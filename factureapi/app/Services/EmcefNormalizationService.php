<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EmcefNormalizationService
{
    /**
     * Normalise une facture (FV) ou un avoir (FA) auprès de l'API e-MCF.
     *
     * Contient exactement la logique auparavant présente dans
     * InvoiceNormalizationController::normalize(), extraite ici pour être
     * réutilisable (normalisation manuelle depuis le modal, ou normalisation
     * automatique à la création d'une facture / d'un avoir).
     *
     * @return array{
     *     success: bool,
     *     status: int,
     *     message: string,
     *     debug?: mixed,
     *     invoice?: Invoice,
     *     emcef_code?: string|null,
     * }
     */
    public function normalize(Invoice $invoice, User $user, ?string $paymentType = null): array
    {
        $org = $user->organization;

        if (!$org) {
            return $this->fail('Organisation introuvable.', 422);
        }

        if (!$org->canNormalize()) {
            return $this->fail('Configurez d\'abord vos paramètres e-MCF.', 422);
        }

        if ($invoice->is_normalized) {
            return $this->fail('Cette facture est déjà normalisée.', 422);
        }

        if (!in_array($invoice->status, ['sent', 'paid'], true)) {
            return $this->fail('Seules les factures envoyées ou payées peuvent être normalisées.', 422);
        }

        // ───────── Cas particulier : facture d'avoir (FA) ─────────
        // Un avoir doit obligatoirement référencer le code MECeF/DGI de la
        // facture de vente d'origine, qui doit donc déjà être normalisée.
        $isCreditNote = $invoice->type === 'FA';
        $reference = null;

        if ($isCreditNote) {
            $originalInvoice = $invoice->originalInvoice;

            if (!$originalInvoice) {
                return $this->fail("Cet avoir n'est rattaché à aucune facture de vente d'origine.", 422);
            }

            if (!$originalInvoice->is_normalized || empty($originalInvoice->emcef_code)) {
                return $this->fail(
                    "La facture de vente d'origine ({$originalInvoice->invoice_number}) doit être normalisée avant de pouvoir normaliser cet avoir.",
                    422
                );
            }

            $reference = $originalInvoice->emcef_code;
        }

        $invoice->loadMissing(['customer', 'items', 'organization']);

        if ($invoice->items->isEmpty()) {
            return $this->fail('Impossible de normaliser une facture sans lignes.', 422);
        }

        $apiUrl = $org->emcefInvoiceUrl();

        $headers = [
            'Authorization' => 'Bearer ' . $org->emcef_token,
            'Content-Type'  => 'application/json',
            'Accept'        => 'application/json',
        ];

        $paymentType = $paymentType ?? 'ESPECES';

        // ───────── 1. CHECK API ─────────
        try {
            $statusRes = Http::withHeaders($headers)->withoutVerifying()->timeout(10)->get($apiUrl);

            Log::info('e-MCF CHECK', [
                'url'      => $apiUrl,
                'token'    => $org->emcef_token,
                'http'     => $statusRes->status(),
                'response' => $statusRes->json(),
            ]);

            if (!$statusRes->successful() || !$statusRes->json('status')) {
                return $this->fail('API e-MCF indisponible.', 503, [
                    'url'      => $apiUrl,
                    'http'     => $statusRes->status(),
                    'response' => $statusRes->json(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('e-MCF status error: ' . $e->getMessage());

            return $this->fail('Impossible de contacter e-MCF.', 503, $e->getMessage());
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

            // e-MCF reconstitue la TVA à partir du prix article envoyé.
            // Pour aligner le ticket DGI sur les totaux HT/TVA/TTC de l'app,
            // on transmet donc le prix unitaire TTC pour les lignes taxables.
            $totalTTC += $priceTTCDgi * $qty;
            $totalHT  += $lineHT;
            // Le champ `price` envoyé à e-MCF doit porter la valeur TTC.
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
            'type'  => $isCreditNote ? 'FA' : 'FV',
            'items' => $items,
            'operator' => [
                'name' => $user->fullname ?? $user->name ?? $org->name,
            ],
            'payment' => [[
                'name'   => $paymentType,
                'amount' => (int) $totalTTC,
            ]],
        ];

        if ($reference !== null) {
            $payload['reference'] = $reference;
        }

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
                ->withoutVerifying()
                ->timeout(30)
                ->post($apiUrl, $payload);

            $data = $res->json();

            if (!$res->successful() || isset($data['errorCode'])) {
                return $this->fail('Erreur e-MCF : ' . ($data['errorDesc'] ?? 'inconnue'), 422);
            }

            if (empty($data['uid'])) {
                return $this->fail('UID manquant.', 422);
            }

            $uid = $data['uid'];

        } catch (\Throwable $e) {
            Log::error('Send error: ' . $e->getMessage());

            return $this->fail('Erreur envoi.', 500);
        }

        // ───────── 5. CONFIRMATION ─────────
        try {
            $confirmRes = Http::withHeaders($headers)
                ->withoutVerifying()
                ->timeout(30)
                ->put("{$apiUrl}/{$uid}/confirm");

            $confirmData = $confirmRes->json();

            if (!$confirmRes->successful() || isset($confirmData['errorCode'])) {
                return $this->fail('Erreur confirmation e-MCF.', 422);
            }

        } catch (\Throwable $e) {
            Log::error('Confirm error: ' . $e->getMessage());

            return $this->fail('Erreur confirmation.', 500);
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

        return [
            'success'    => true,
            'status'     => 200,
            'message'    => 'Facture normalisée avec succès',
            'invoice'    => $invoice->fresh(),
            'emcef_code' => $confirmData['codeMECeFDGI'] ?? null,
        ];
    }

    /**
     * @param mixed $debug
     */
    private function fail(string $message, int $status, $debug = null): array
    {
        $result = [
            'success' => false,
            'status'  => $status,
            'message' => $message,
        ];

        if ($debug !== null) {
            $result['debug'] = $debug;
        }

        return $result;
    }
}
