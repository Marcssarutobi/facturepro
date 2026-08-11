<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\ItemTemplate;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Illuminate\Support\Facades\Mail;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

class InvoiceController extends Controller
{
    // GET /api/invoices
    public function index(Request $request): JsonResponse
    {
        $query = Invoice::where('organization_id', $request->user()->organization_id)
            ->with(['customer', 'user', 'items']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        $invoices = $query->latest()->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $invoices,
        ]);
    }

    // POST /api/invoices
    public function store(Request $request): JsonResponse
    {

        // ✅ Vérification limite factures
        if (!$request->user()->organization->canCreateInvoice()) {
            return response()->json([
                'success' => false,
                'message' => 'Limite de 3 factures par mois atteinte. Passez au plan Pro.',
            ], 403);
        }

        // ✅ Vérification abonnement expiré
        if ($request->user()->organization->isExpired()) {
            return response()->json([
                'success' => false,
                'message' => 'Votre abonnement est expiré. Renouvelez votre plan.',
            ], 403);
        }

        $validated = $request->validate([
            'customer_id' => [
                'nullable',
                Rule::exists('customers', 'id')->where(
                    fn ($query) => $query->where('organization_id', $request->user()->organization_id)
                ),
            ],
            'anonymous_customer_name' => 'nullable|string|max:255',
            'invoice_number' => 'required|string|unique:invoices,invoice_number',
            'due_at' => 'required|date',
            'echeance_at' => 'required|date',
            'total_tva' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.vat_rate' => 'nullable|numeric|min:0|max:1',
        ]);

        return DB::transaction(function () use ($validated, $request) {

            $totalHt = collect($validated['items'])->sum(
                fn ($item) => $item['quantity'] * $item['unit_price']
            );

            $totalTva = collect($validated['items'])->sum(
                fn ($item) => $item['quantity'] * $item['unit_price'] * ($item['vat_rate'] ?? 0)
            );

            $totalTtc = $totalHt + $totalTva;

            // ✅ Générer nom client anonyme si pas de customer_id
            $anonymousName = null;

            if (empty($validated['customer_id'])) {
                $anonymousName = $validated['anonymous_customer_name']
                    ?? 'Client anonyme #' . now()->timestamp;
            }

            $invoice = Invoice::create([
                'customer_id' => $validated['customer_id'] ?? null,
                'anonymous_customer_name' => $anonymousName, // ✅ ICI
                'invoice_number' => $validated['invoice_number'],
                'due_at' => $validated['due_at'],
                'echeance_at' => $validated['echeance_at'],
                'total_tva' => $totalTva,
                'total_ht' => $totalHt,
                'total_ttc' => $totalTtc,
                'user_id' => $request->user()->id,
                'organization_id' => $request->user()->organization_id,
            ]);

            foreach ($validated['items'] as $item) {
                $invoice->items()->create($item);
            }

            $this->upsertItemTemplates($request->user()->organization_id, $validated['items']);

            return response()->json([
                'success' => true,
                'message' => 'Facture créée avec succès',
                'data' => $invoice->load(['customer', 'items']),
            ], 201);
        });
    }

    // Enregistre/actualise le "catalogue" de descriptions utilisées par l'organisation,
    // pour l'autocomplétion (ItemTemplateController::index). Le prix (et la TVA) est
    // toujours écrasé par la dernière valeur saisie pour cette description.
    private function upsertItemTemplates(int $organizationId, array $items): void
    {
        foreach ($items as $item) {
            $description = trim($item['description']);

            if ($description === '') {
                continue;
            }

            ItemTemplate::updateOrCreate(
                [
                    'organization_id' => $organizationId,
                    'description' => $description,
                ],
                [
                    'unit_price' => $item['unit_price'],
                    'vat_rate' => $item['vat_rate'] ?? 0,
                ]
            );
        }
    }

    // POST /api/invoices/{invoice}/credit-note
    // Crée une facture d'avoir (FA) à partir d'une facture de vente normalisée :
    // - scope = "total"   -> reprend toutes les lignes de la facture d'origine
    // - scope = "partiel" -> reprend une seule ligne (article), avec une quantité <= quantité facturée
    public function storeCreditNote(Request $request, Invoice $invoice): JsonResponse
    {
        $this->ensureSameOrganization($request, $invoice);

        if ($invoice->type === 'FA') {
            return response()->json([
                'success' => false,
                'message' => "Impossible de créer un avoir à partir d'une facture d'avoir.",
            ], 422);
        }

        if (!$invoice->is_normalized || empty($invoice->emcef_code)) {
            return response()->json([
                'success' => false,
                'message' => "La facture de vente d'origine doit d'abord être normalisée avant de pouvoir émettre un avoir.",
            ], 422);
        }

        $validated = $request->validate([
            'scope' => 'required|in:total,partiel',
            'item_id' => 'required_if:scope,partiel|nullable|integer',
            'quantity' => 'nullable|integer|min:1',
        ]);

        $invoice->load('items');

        if ($invoice->items->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => "Cette facture n'a aucune ligne à créditer.",
            ], 422);
        }

        if ($validated['scope'] === 'partiel') {
            $originalItem = $invoice->items->firstWhere('id', (int) $validated['item_id']);

            if (!$originalItem) {
                return response()->json([
                    'success' => false,
                    'message' => "Cet article n'appartient pas à la facture d'origine.",
                ], 422);
            }

            $quantity = $validated['quantity'] ?? $originalItem->quantity;

            if ($quantity > $originalItem->quantity) {
                return response()->json([
                    'success' => false,
                    'message' => "La quantité de l'avoir ne peut pas dépasser la quantité facturée ({$originalItem->quantity}).",
                ], 422);
            }

            $itemsPayload = [[
                'description' => $originalItem->description,
                'quantity' => $quantity,
                'unit_price' => $originalItem->unit_price,
                'vat_rate' => $originalItem->vat_rate,
                'original_item_id' => $originalItem->id,
            ]];
        } else {
            $itemsPayload = $invoice->items->map(fn ($item) => [
                'description' => $item->description,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'vat_rate' => $item->vat_rate,
                'original_item_id' => $item->id,
            ])->all();
        }

        return DB::transaction(function () use ($invoice, $itemsPayload, $validated, $request) {
            $totalHt = collect($itemsPayload)->sum(
                fn ($item) => $item['quantity'] * $item['unit_price']
            );

            $totalTva = collect($itemsPayload)->sum(
                fn ($item) => $item['quantity'] * $item['unit_price'] * ($item['vat_rate'] ?? 0)
            );

            $totalTtc = $totalHt + $totalTva;

            $creditNote = Invoice::create([
                'invoice_number' => $this->generateCreditNoteNumber($invoice),
                'type' => 'FA',
                'original_invoice_id' => $invoice->id,
                'credit_scope' => $validated['scope'],
                'customer_id' => $invoice->customer_id,
                'anonymous_customer_name' => $invoice->anonymous_customer_name,
                'due_at' => now()->toDateString(),
                'echeance_at' => now()->toDateString(),
                'total_ht' => $totalHt,
                'total_tva' => $totalTva,
                'total_ttc' => $totalTtc,
                'user_id' => $request->user()->id,
                'organization_id' => $request->user()->organization_id,
            ]);

            foreach ($itemsPayload as $item) {
                $creditNote->items()->create($item);
            }

            return response()->json([
                'success' => true,
                'message' => 'Avoir créé avec succès. Vous pouvez maintenant le normaliser.',
                'data' => $creditNote->load(['customer', 'items', 'originalInvoice']),
            ], 201);
        });
    }

    // Génère un numéro de facture unique pour un avoir, dérivé du numéro d'origine.
    private function generateCreditNoteNumber(Invoice $invoice): string
    {
        $base = 'AV-' . $invoice->invoice_number;
        $number = $base;
        $suffix = 1;

        while (Invoice::where('invoice_number', $number)->exists()) {
            $suffix++;
            $number = $base . '-' . $suffix;
        }

        return $number;
    }

    // GET /api/invoices/{id}
    public function show(Request $request, Invoice $invoice): JsonResponse
    {
        $this->ensureSameOrganization($request, $invoice);

        $invoice->load(['customer', 'user', 'items', 'organization', 'originalInvoice']);

        // ✅ Générer QR code si facture normalisée
        if ($invoice->is_normalized && $invoice->emcef_qr_code) {

            $renderer = new ImageRenderer(
                new RendererStyle(300),
                new SvgImageBackEnd() // ✅ PAS Imagick
            );

            $writer = new Writer($renderer);

            $qrCode = $writer->writeString($invoice->emcef_qr_code);

            $invoice->qr_code_base64 = 'data:image/svg+xml;base64,' . base64_encode($qrCode);
        }

        return response()->json([
            'success' => true,
            'data' => $invoice,
        ]);
    }

    // GET /api/invoices/{id}/pdf
    public function downloadPdf(Request $request, Invoice $invoice): BinaryFileResponse
    {
        $this->ensureSameOrganization($request, $invoice);

        $invoice->load(['customer', 'user', 'items', 'organization', 'originalInvoice']);

        // ✅ Convertir l'URL du logo en chemin local pour DomPDF
        if ($invoice->organization->logo) {
            $logoPath = str_replace(
                url('/storage'),
                storage_path('app/public'),
                $invoice->organization->logo
            );

            // Vérifier que le fichier existe et le convertir en base64
            if (file_exists($logoPath)) {
                $extension = pathinfo($logoPath, PATHINFO_EXTENSION);
                $mimeType  = match(strtolower($extension)) {
                    'png'  => 'image/png',
                    'jpg', 'jpeg' => 'image/jpeg',
                    'svg'  => 'image/svg+xml',
                    default => 'image/png',
                };
                $invoice->organization->logo_base64 = 'data:' . $mimeType . ';base64,' . base64_encode(file_get_contents($logoPath));
            } else {
                $invoice->organization->logo_base64 = null;
            }
        }

        // ✅ Générer QR code si facture normalisée
        if ($invoice->is_normalized && $invoice->emcef_qr_code) {

            $renderer = new \BaconQrCode\Renderer\ImageRenderer(
                new \BaconQrCode\Renderer\RendererStyle\RendererStyle(300),
                new \BaconQrCode\Renderer\Image\SvgImageBackEnd()
            );

            $writer = new \BaconQrCode\Writer($renderer);

            $qrCode = $writer->writeString($invoice->emcef_qr_code);

            $invoice->qr_code_base64 =
                'data:image/svg+xml;base64,' . base64_encode($qrCode);
        }

        $pdf = Pdf::loadView($invoice->organization->invoicePdfView(), [
            'invoice' => $invoice,
        ])->setPaper('a4');

        $safeNumber    = preg_replace('/[^A-Za-z0-9\-_]/', '-', $invoice->invoice_number) ?: 'facture';
        $fileName      = $safeNumber . '.pdf';
        $relativePath  = 'temp/invoices/' . uniqid($safeNumber . '-', true) . '.pdf';

        Storage::disk('local')->put($relativePath, $pdf->output());

        return response()
            ->download(storage_path('app/' . $relativePath), $fileName, [
                'Content-Type' => 'application/pdf',
            ])
            ->deleteFileAfterSend(true);
    }

    // PUT /api/invoices/{id}/status
    public function updateStatus(Request $request, Invoice $invoice): JsonResponse
    {
        $this->ensureSameOrganization($request, $invoice);

        $request->validate([
            'status' => 'required|in:draft,sent,paid,overdue,cancelled',
        ]);

        $invoice->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'Statut mis à jour',
            'data' => $invoice,
        ]);
    }

    // PUT /api/invoices/{id}
    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        $this->ensureSameOrganization($request, $invoice);

        $validated = $request->validate([
            'customer_id' => [
                'nullable',
                Rule::exists('customers', 'id')->where(
                    fn ($query) => $query->where('organization_id', $request->user()->organization_id)
                ),
            ],
            'anonymous_customer_name' => 'nullable|string|max:255',
            'invoice_number' => [
                'sometimes',
                'string',
                Rule::unique('invoices', 'invoice_number')->ignore($invoice->id),
            ],
            'due_at' => 'sometimes|date',
            'echeance_at' => 'sometimes|date',
            'status' => 'sometimes|in:draft,sent,paid,overdue,cancelled',
            'total_tva' => 'nullable|numeric|min:0',
            'items' => 'sometimes|array|min:1',
            'items.*.description' => 'required_with:items|string',
            'items.*.quantity' => 'required_with:items|integer|min:1',
            'items.*.unit_price' => 'required_with:items|numeric|min:0',
            'items.*.vat_rate' => 'nullable|numeric|min:0|max:1',
        ]);

        return DB::transaction(function () use ($invoice, $validated) {
            if (isset($validated['items'])) {
                $invoice->items()->delete();

                $totalHt = collect($validated['items'])->sum(
                    fn ($item) => $item['quantity'] * $item['unit_price']
                );
                $totalTva = collect($validated['items'])->sum(
                    fn ($item) => $item['quantity'] * $item['unit_price'] * ($item['vat_rate'] ?? 0)
                );
                $totalTtc = $totalHt + $totalTva;

                foreach ($validated['items'] as $item) {
                    $invoice->items()->create($item);
                }

                $this->upsertItemTemplates($invoice->organization_id, $validated['items']);

                $validated['total_ht'] = $totalHt;
                $validated['total_tva'] = $totalTva;
                $validated['total_ttc'] = $totalTtc;
                unset($validated['items']);
            }

            $invoice->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Facture mise à jour',
                'data' => $invoice->load(['customer', 'items']),
            ]);
        });
    }

    // DELETE /api/invoices/{id}
    public function destroy(Request $request, Invoice $invoice): JsonResponse
    {
        $this->ensureSameOrganization($request, $invoice);

        $invoice->delete();

        return response()->json([
            'success' => true,
            'message' => 'Facture supprimée',
        ]);
    }

    // POST /api/invoices/{invoice}/send
    public function send(Request $request, Invoice $invoice): JsonResponse
    {

        // ✅ Vérifier le plan
        if (!$request->user()->organization->hasFeature('email_invoices')) {
            return response()->json([
                'success' => false,
                'message' => 'L\'envoi de factures par email nécessite le plan Pro ou Business.',
            ], 403);
        }

        $request->validate([
            'message' => 'nullable|string|max:1000',
        ]);

        $invoice->load(['customer', 'items', 'organization', 'user', 'originalInvoice']);

        // ✅ 🔥 AJOUT ICI (logo_base64)
        if ($invoice->organization->logo) {
            $logoPath = str_replace(
                url('/storage'),
                storage_path('app/public'),
                $invoice->organization->logo
            );

            if (file_exists($logoPath)) {
                $extension = pathinfo($logoPath, PATHINFO_EXTENSION);

                $mimeType = match (strtolower($extension)) {
                    'png'  => 'image/png',
                    'jpg', 'jpeg' => 'image/jpeg',
                    'svg'  => 'image/svg+xml',
                    default => 'image/png',
                };

                $invoice->organization->logo_base64 =
                    'data:' . $mimeType . ';base64,' . base64_encode(file_get_contents($logoPath));
            } else {
                $invoice->organization->logo_base64 = null;
            }
        }

        // ✅ Générer QR code si facture normalisée
        if ($invoice->is_normalized && $invoice->emcef_qr_code) {

            $renderer = new \BaconQrCode\Renderer\ImageRenderer(
                new \BaconQrCode\Renderer\RendererStyle\RendererStyle(300),
                new \BaconQrCode\Renderer\Image\SvgImageBackEnd()
            );

            $writer = new \BaconQrCode\Writer($renderer);

            $qrCode = $writer->writeString($invoice->emcef_qr_code);

            $invoice->qr_code_base64 =
                'data:image/svg+xml;base64,' . base64_encode($qrCode);
        }

        // Vérifier que le client a un email
        if (!$invoice->customer->email) {
            return response()->json([
                'success' => false,
                'message' => 'Ce client n\'a pas d\'adresse email.',
            ], 422);
        }

        $pdfPath = null;

        try {
            // ── 1. Générer le PDF ──────────────────────────
            $statusLabels = [
                'draft'     => 'Brouillon',
                'sent'      => 'Envoyée',
                'paid'      => 'Payée',
                'overdue'   => 'En retard',
                'cancelled' => 'Annulée',
            ];

            $pdf = Pdf::loadView($invoice->organization->invoicePdfView(), [
                'invoice'      => $invoice,
                'organization' => $invoice->organization,
                'statusLabels' => $statusLabels,
            ])->setPaper('a4', 'portrait');

            // ── 2. Stocker temporairement ──────────────────
            $filename = 'invoice_' . $invoice->invoice_number . '_' . now()->timestamp . '.pdf';
            $pdfPath  = 'invoices_temp/' . $filename;

            Storage::put($pdfPath, $pdf->output());
            $fullPath = Storage::path($pdfPath);

            // ── 3. Envoyer l'email ─────────────────────────
            $customMessage = $request->message ?? "Veuillez trouver ci-joint votre facture {$invoice->invoice_number}.";

            Mail::send('emails.invoice', [
                'invoice'       => $invoice,
                'customer'      => $invoice->customer,
                'organization'  => $invoice->organization,
                'customMessage' => $customMessage,
                'statusLabels'  => $statusLabels,
            ], function ($mail) use ($invoice, $fullPath, $filename) {
                $mail->to($invoice->customer->email, $invoice->customer->fullname)
                    ->subject(($invoice->type === 'FA' ? 'Avoir' : 'Facture') . " {$invoice->invoice_number} — {$invoice->organization->name}")
                    ->attach($fullPath, [
                        'as'   => $filename,
                        'mime' => 'application/pdf',
                    ]);
            });

            // ── 4. Supprimer le PDF du storage ─────────────
            Storage::delete($pdfPath);

            // ── 5. Mettre à jour le statut en "sent" ───────
            if ($invoice->status === 'draft') {
                $invoice->update(['status' => 'sent']);
            }

            return response()->json([
                'success' => true,
                'message' => "Facture envoyée avec succès à {$invoice->customer->email}",
                'data'    => $invoice->fresh(),
            ]);

        } catch (\Exception $e) {

            // Nettoyer le PDF si erreur
            if ($pdfPath && Storage::exists($pdfPath)) {
                Storage::delete($pdfPath);
            }

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi : ' . $e->getMessage(),
            ], 500);
        }
    }

    private function ensureSameOrganization(Request $request, Invoice $invoice): void
    {
        abort_unless($invoice->organization_id === $request->user()->organization_id, 404);
    }
}
