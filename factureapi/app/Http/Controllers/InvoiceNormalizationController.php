<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Services\EmcefNormalizationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class InvoiceNormalizationController extends Controller
{
    public function __construct(private readonly EmcefNormalizationService $normalizationService)
    {
    }

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

        $validated = $request->validate([
            'payment_type' => 'nullable|in:ESPECES,MOBILEMONEY,CARTEBANCAIRE,VIREMENT,CHEQUES,CREDIT,AUTRE',
        ]);

        $result = $this->normalizationService->normalize(
            $invoice,
            $user,
            $validated['payment_type'] ?? null
        );

        if (!$result['success']) {
            $payload = [
                'success' => false,
                'message' => $result['message'],
            ];

            if (isset($result['debug'])) {
                $payload['debug'] = $result['debug'];
            }

            return response()->json($payload, $result['status']);
        }

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data' => [
                'invoice' => $result['invoice'],
                'emcef_code' => $result['emcef_code'],
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
