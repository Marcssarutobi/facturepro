<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Illuminate\Support\Facades\Mail;

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
                'required',
                Rule::exists('customers', 'id')->where(
                    fn ($query) => $query->where('organization_id', $request->user()->organization_id)
                ),
            ],
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

            $invoice = Invoice::create([
                'customer_id' => $validated['customer_id'],
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

            return response()->json([
                'success' => true,
                'message' => 'Facture créée avec succès',
                'data' => $invoice->load(['customer', 'items']),
            ], 201);
        });
    }

    // GET /api/invoices/{id}
    public function show(Request $request, Invoice $invoice): JsonResponse
    {
        $this->ensureSameOrganization($request, $invoice);

        $invoice->load(['customer', 'user', 'items', 'organization']);

        return response()->json([
            'success' => true,
            'data' => $invoice,
        ]);
    }

    // GET /api/invoices/{id}/pdf
    public function downloadPdf(Request $request, Invoice $invoice): BinaryFileResponse
    {
        $this->ensureSameOrganization($request, $invoice);

        $invoice->load(['customer', 'user', 'items', 'organization']);

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

        $pdf = Pdf::loadView('invoices.pdf', [
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
                'sometimes',
                Rule::exists('customers', 'id')->where(
                    fn ($query) => $query->where('organization_id', $request->user()->organization_id)
                ),
            ],
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

        $invoice->load(['customer', 'items', 'organization', 'user']);

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

            $pdf = Pdf::loadView('invoices.pdf', [
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
                     ->subject("Facture {$invoice->invoice_number} — {$invoice->organization->name}")
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
