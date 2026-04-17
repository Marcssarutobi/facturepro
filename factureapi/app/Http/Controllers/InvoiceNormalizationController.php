<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class InvoiceNormalizationController extends Controller
{
    // POST /api/invoices/{invoice}/normalize
    public function normalize(Request $request, Invoice $invoice): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié.',
            ], 401);
        }

        $this->ensureSameOrganization($user, $invoice);

        $org = $user->organization;

        if (!$org) {
            return response()->json([
                'success' => false,
                'message' => 'Organisation introuvable.',
            ], 422);
        }

        if (!$org->canNormalize()) {
            return response()->json([
                'success' => false,
                'message' => 'Configurez d\'abord vos paramètres e-MCF.',
            ], 422);
        }

        if ($invoice->is_normalized) {
            return response()->json([
                'success' => false,
                'message' => 'Cette facture est déjà normalisée.',
            ], 422);
        }

        if (!in_array($invoice->status, ['sent', 'paid'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Seules les factures envoyées ou payées peuvent être normalisées.',
            ], 422);
        }

        $validated = $request->validate([
            'payment_type' => 'nullable|in:ESPECES,MOBILEMONEY,CARTEBANCAIRE,VIREMENT,CHEQUES,CREDIT,AUTRE',
        ]);

        $invoice->load(['customer', 'items', 'organization']);

        if ($invoice->items->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de normaliser une facture sans lignes.',
            ], 422);
        }

        $apiUrl = $org->emcefInvoiceUrl();

        $headers = [
            'Authorization' => 'Bearer ' . $org->emcef_token,
            'Content-Type'  => 'application/json',
            'Accept'        => 'application/json',
        ];

        $paymentType = $validated['payment_type'] ?? 'ESPECES';

        // ───────── 1. CHECK API ─────────
        try {
            $statusRes = Http::withHeaders($headers)->timeout(10)->get($apiUrl);

            if (!$statusRes->successful() || !$statusRes->json('status')) {
                return response()->json([
                    'success' => false,
                    'message' => 'API e-MCF indisponible.',
                ], 503);
            }
        } catch (\Throwable $e) {
            Log::error('e-MCF status error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Impossible de contacter e-MCF.',
            ], 503);
        }

        // ───────── 2. CALCUL DGI STRICT ─────────
        $items = [];
        $totalHT  = 0;
        $totalTVA = 0;
        $totalTTC = 0;

        foreach ($invoice->items as $item) {
            $qty     = (int) $item->quantity;
            $priceHT = (float) $item->unit_price;
            $vat     = (float) $item->vat_rate;
            $lineHT  = $priceHT * $qty;
            $priceTTCDgi = $vat > 0
                ? (int) round($priceHT * (1 + $vat))
                : (int) round($priceHT);

            // e-MCF reconstitue la TVA Ã  partir du prix article envoyÃ©.
            // Pour aligner le ticket DGI sur les totaux HT/TVA/TTC de l'app,
            // on transmet donc le prix unitaire TTC pour les lignes taxables.
            $totalTTC += $priceTTCDgi * $qty;
            $totalHT  += $lineHT;
            // Le champ `price` envoyÃ© Ã  e-MCF doit porter la valeur TTC.
            $priceHT = $priceTTCDgi;

            $items[] = [
                'name'     => (string) $item->description,
                'price'    => (int) round($priceHT), // ✅ envoyer HT à la DGI
                'quantity' => $qty,
                'taxGroup' => $vat > 0 ? 'B' : 'A',
            ];
        }

        $totalHT = (int) round($totalHT);
        $totalTVA = $totalTTC - $totalHT;

        Log::info('DGI CALC', [
            'HT'  => $totalHT,
            'TVA' => $totalTVA,
            'TTC' => $totalTTC,
        ]);

        // ───────── 3. PAYLOAD ─────────
        $payload = [
            'ifu'   => $org->ifu,
            'type'  => 'FV',
            'items' => $items,
            'operator' => [
                'name' => $user->fullname ?? $user->name ?? $org->name,
            ],
            'payment' => [[
                'name'   => $paymentType,
                'amount' => (int) $totalTTC,
            ]],
        ];

        if ($invoice->customer) {
            $payload['client'] = array_filter([
                'name'    => $invoice->customer->fullname,
                'contact' => $invoice->customer->phone ?? $invoice->customer->email,
                'address' => $invoice->customer->adresse,
                'ifu'     => $invoice->customer->ifu ?? null,
            ]);
        }

        // ───────── 4. ENVOI ─────────
        try {
            $res = Http::withHeaders($headers)
                ->timeout(30)
                ->post($apiUrl, $payload);

            $data = $res->json();

            if (!$res->successful() || isset($data['errorCode'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur e-MCF : ' . ($data['errorDesc'] ?? 'inconnue'),
                ], 422);
            }

            if (empty($data['uid'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'UID manquant.',
                ], 422);
            }

            $uid = $data['uid'];

        } catch (\Throwable $e) {
            Log::error('Send error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur envoi.',
            ], 500);
        }

        // ───────── 5. CONFIRMATION ─────────
        try {
            $confirmRes = Http::withHeaders($headers)
                ->timeout(30)
                ->put("{$apiUrl}/{$uid}/confirm");

            $confirmData = $confirmRes->json();

            if (!$confirmRes->successful() || isset($confirmData['errorCode'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur confirmation e-MCF.',
                ], 422);
            }

        } catch (\Throwable $e) {
            Log::error('Confirm error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur confirmation.',
            ], 500);
        }

        // ───────── 6. SAVE ─────────
        $invoice->update([
            'emcef_uid'      => $uid,
            'emcef_code'     => $confirmData['codeMECeFDGI'] ?? null,
            'emcef_qr_code'  => $confirmData['qrCode'] ?? null,
            'emcef_nim'      => $confirmData['nim'] ?? null,
            'emcef_counters' => $confirmData['counters'] ?? null,
            'emcef_datetime' => now(),
            'is_normalized'  => true,
            'payment_type'   => $paymentType,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Facture normalisée avec succès',
            'data' => [
                'invoice' => $invoice->fresh(),
                'emcef_code' => $confirmData['codeMECeFDGI'] ?? null,
            ],
        ]);
    }

    private function ensureSameOrganization($user, Invoice $invoice): void
    {
        if (($user->organization_id ?? null) !== $invoice->organization_id) {
            abort(403, 'Accès non autorisé.');
        }
    }
}
