<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use App\Models\Organization;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendInvoiceReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature   = 'invoices:send-reminders';



    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Envoie les relances automatiques pour les factures en retard';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $this->info('Vérification des factures en retard...');

        // ── 1. Mettre à jour en overdue les factures dont l'échéance est dépassée ──
        $updatedCount = Invoice::whereNotIn('status', ['paid', 'cancelled', 'overdue'])
            ->where('echeance_at', '<', now())
            ->update(['status' => 'overdue']);

        $this->info("{$updatedCount} facture(s) passée(s) en overdue.");

        // ── 2. Récupérer les factures overdue pour les relances ────────────────────
        $overdueInvoices = Invoice::where('status', 'overdue')
            ->where('echeance_at', '<', now())
            ->with(['customer', 'organization', 'organization.users'])
            ->get();

        $count = 0;

        foreach ($overdueInvoices as $invoice) {

            // Vérifier que l'organisation a la fonctionnalité relances auto
            if (!$invoice->organization->hasFeature('auto_reminders')) {
                continue;
            }

            // Calculer le nombre de jours de retard
            $daysOverdue = Carbon::parse($invoice->echeance_at)->diffInDays(now());

            // Envoyer uniquement à J+7 et J+14
            if (!in_array($daysOverdue, [7, 14])) {
                continue;
            }

            // Vérifier si une relance a déjà été envoyée pour ce jour
            $alreadySent = $invoice->reminders()
                ->where('day_offset', $daysOverdue)
                ->where('status', 'envoyée')
                ->exists();

            if ($alreadySent) {
                continue;
            }

            // Envoyer l'email de relance
            try {
                Mail::send('emails.reminder', [
                    'invoice'      => $invoice,
                    'customer'     => $invoice->customer,
                    'organization' => $invoice->organization,
                    'daysOverdue'  => $daysOverdue,
                ], function ($mail) use ($invoice) {
                    $mail->to($invoice->customer->email)
                        ->subject("Rappel de paiement — Facture {$invoice->invoice_number}");
                });

                // Enregistrer la relance
                $invoice->reminders()->create([
                    'day_offset' => $daysOverdue,
                    'sent_at'    => now(),
                    'status'     => 'envoyée',
                    'organization_id' => $invoice->organization_id,
                ]);

                $count++;
                $this->info("Relance envoyée pour la facture {$invoice->invoice_number}");

            } catch (\Exception $e) {
                $invoice->reminders()->create([
                    'day_offset' => $daysOverdue,
                    'sent_at'    => now(),
                    'status'     => 'échouée',
                    'organization_id' => $invoice->organization_id,
                ]);
                $this->error("Erreur pour {$invoice->invoice_number} : {$e->getMessage()}");
            }
        }

        $this->info("Terminé — {$count} relance(s) envoyée(s).");
    }
}
