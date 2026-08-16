<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Services\ReceiptPrinterService;
use Illuminate\Http\JsonResponse;

class ReceiptPrintController extends Controller
{
    public function __construct(private ReceiptPrinterService $printerService)
    {
    }

    /**
     * GET /api/invoices/{invoice}/print-ticket
     * Retourne les commandes ESC/POS en base64, prêtes pour QZ Tray.
     */
    public function printTicket(Invoice $invoice): JsonResponse
    {
        // Vérifie que l'utilisateur a bien le droit de voir cette facture
        $this->authorize('view', $invoice);

        $invoice->load(['items', 'organization']);

        $data = $this->printerService->generateTicket($invoice);

        return response()->json([
            'data' => $data,
        ]);
    }
}
