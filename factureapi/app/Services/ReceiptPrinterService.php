<?php

namespace App\Services;

use App\Models\Invoice;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;
use Mike42\Escpos\Printer;

class ReceiptPrinterService
{
    /**
     * Génère les commandes ESC/POS pour une facture et retourne
     * le résultat encodé en base64, prêt à être envoyé à QZ Tray.
     *
     * Suppose que $invoice est déjà chargée avec ->items et ->organization
     * (ex: $invoice->load(['items', 'organization'])).
     */
    public function generateTicket(Invoice $invoice): string
    {
        $tmpPath = storage_path('app/tmp_ticket_' . uniqid() . '.bin');

        $connector = new FilePrintConnector($tmpPath);
        $printer = new Printer($connector);

        $this->printHeader($printer, $invoice);
        $this->printItems($printer, $invoice);
        $this->printTotal($printer, $invoice);

        // ✅ Même bloc "sécurité e-MCF/DGI" que sur le PDF, si la facture est normalisée
        if ($invoice->is_normalized) {
            $this->printEmcefBlock($printer, $invoice);
        }

        $this->printFooter($printer);

        $printer->close();

        $raw = file_get_contents($tmpPath);
        unlink($tmpPath);

        return base64_encode($raw);
    }

    private function printHeader(Printer $printer, Invoice $invoice): void
    {
        $org = $invoice->organization;

        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setEmphasis(true);
        $printer->setTextSize(2, 2);
        $printer->text(($org->name ?? 'Organisation') . "\n");
        $printer->setTextSize(1, 1);
        $printer->setEmphasis(false);

        if (!empty($org->adresse)) {
            $printer->text($org->adresse . "\n");
        }

        $printer->text("--------------------------------\n");
        $printer->setJustification(Printer::JUSTIFY_LEFT);
        $printer->text('Facture N: ' . $invoice->invoice_number . "\n");
        $printer->text('Date: ' . $invoice->created_at->format('d/m/Y H:i') . "\n");

        if ($invoice->customer) {
            $printer->text('Client: ' . $invoice->customer->fullname . "\n");
        } elseif ($invoice->anonymous_customer_name) {
            $printer->text('Client: ' . $invoice->anonymous_customer_name . "\n");
        }

        $printer->text("--------------------------------\n");
    }

    private function printItems(Printer $printer, Invoice $invoice): void
    {
        foreach ($invoice->items as $item) {
            $printer->text($item->description . "\n");

            $lineTotal = $item->quantity * $item->unit_price;

            $line = sprintf(
                "%-4s x %-9s %14s\n",
                $item->quantity,
                number_format((float) $item->unit_price, 0, ',', ' '),
                number_format($lineTotal, 0, ',', ' ') . ' F'
            );
            $printer->text($line);
        }

        $printer->text("--------------------------------\n");
    }

    private function printTotal(Printer $printer, Invoice $invoice): void
    {
        $printer->setEmphasis(true);
        $printer->text(sprintf(
            "%-18s %13s\n",
            'TOTAL TTC',
            number_format((float) $invoice->total_ttc, 0, ',', ' ') . ' F'
        ));
        $printer->setEmphasis(false);

        if ($invoice->status === 'paid') {
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->text("** PAYEE **\n");
            $printer->setJustification(Printer::JUSTIFY_LEFT);
        }
    }

    /**
     * Reproduit le contenu du bloc "Éléments de sécurité de la facture
     * normalisée" (resources/views/invoices/partials/emcef-block.blade.php),
     * adapté au format ticket 58/80mm avec impression QR native imprimante
     * (pas d'image, la plupart des imprimantes ESC/POS savent générer
     * le QR elles-mêmes, ce qui rend un rendu plus net qu'une image bitmap).
     */
    private function printEmcefBlock(Printer $printer, Invoice $invoice): void
    {
        $printer->feed(1);
        $printer->text("--------------------------------\n");
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setEmphasis(true);
        $printer->text("ELEMENTS DE SECURITE\nFACTURE NORMALISEE\n");
        $printer->setEmphasis(false);
        $printer->feed(1);

        if (!empty($invoice->emcef_qr_code)) {
            $printer->qrCode($invoice->emcef_qr_code, Printer::QR_ECLEVEL_L, 6, Printer::QR_MODEL_2);
            $printer->feed(1);
        }

        $printer->text("Code MECeF/DGI\n");
        $printer->setEmphasis(true);
        $printer->text(($invoice->emcef_code ?? '-') . "\n");
        $printer->setEmphasis(false);
        $printer->feed(1);

        $printer->setJustification(Printer::JUSTIFY_LEFT);
        $printer->text('MECeF NIM: ' . ($invoice->emcef_nim ?? '-') . "\n");
        $printer->text('MECeF Compteurs: ' . ($invoice->emcef_counters ?? '-') . "\n");

        if ($invoice->emcef_datetime) {
            $printer->text('MECeF Heure: ' . $invoice->emcef_datetime->format('d/m/Y H:i:s') . "\n");
        }
    }

    private function printFooter(Printer $printer): void
    {
        $printer->feed(1);
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->text("Merci de votre confiance !\n");
        $printer->feed(2);
        $printer->cut();
    }
}
