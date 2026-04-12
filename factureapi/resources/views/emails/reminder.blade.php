<!-- resources/views/emails/reminder.blade.php -->
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6366f1; color: white; padding: 24px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; }
    .invoice-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .amount { font-size: 24px; font-weight: bold; color: #6366f1; }
    .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px; }
    .btn { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <h2 style="margin:0;">Rappel de paiement</h2>
    <p style="margin:4px 0 0; opacity:0.8;">{{ $organization->name }}</p>
  </div>

  <div class="content">
    <p>Bonjour <strong>{{ $customer->fullname }}</strong>,</p>

    <p>
      Nous vous rappelons que la facture suivante est en attente de règlement
      depuis <strong>{{ $daysOverdue }} jours</strong>.
    </p>

    <div class="invoice-box">
      <p style="margin:0 0 8px;"><strong>Facture :</strong> {{ $invoice->invoice_number }}</p>
      <p style="margin:0 0 8px;"><strong>Date d'échéance :</strong> {{ \Carbon\Carbon::parse($invoice->echeance_at)->format('d/m/Y') }}</p>
      <p style="margin:0;"><strong>Montant TTC :</strong></p>
      <div class="amount">{{ number_format($invoice->total_ttc, 0, ',', ' ') }} FCFA</div>
    </div>

    <p>Merci de procéder au règlement dans les meilleurs délais.</p>
    <p>Pour toute question, n'hésitez pas à nous contacter à <a href="mailto:{{ $organization->email }}">{{ $organization->email }}</a>.</p>

    <p style="margin-top: 24px;">Cordialement,<br><strong>{{ $organization->name }}</strong></p>
  </div>

  <div class="footer">
    <p>{{ $organization->name }} — {{ $organization->adresse }}</p>
    <p>Cet email est envoyé automatiquement, merci de ne pas y répondre directement.</p>
  </div>
</body>
</html>
