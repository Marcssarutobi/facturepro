<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f4f6f9; color: #333; }
    .wrapper { max-width: 620px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }

    /* Header organisation */
    .org-header { background: #1e1e2e; padding: 28px 36px; display: table; width: 100%; }
    .org-logo-wrap { display: table-cell; vertical-align: middle; width: 64px; padding-right: 16px; }
    .org-logo { width: 52px; height: 52px; border-radius: 10px; object-fit: contain; background: white; padding: 4px; display: block; }
    .org-logo-placeholder { width: 52px; height: 52px; border-radius: 10px; background: #6366f1; text-align: center; line-height: 52px; font-size: 22px; font-weight: bold; color: white; display: block; }
    .org-info { display: table-cell; vertical-align: middle; }
    .org-name { font-size: 18px; font-weight: 700; color: white; white-space: nowrap; }
    .org-contact { font-size: 12px; color: #a0a0b8; margin-top: 4px; }

    /* Bannière */
    .status-banner { background: #6366f1; padding: 28px 36px; }
    .status-banner h1 { font-size: 22px; font-weight: 700; color: white; }
    .status-banner p { font-size: 14px; color: rgba(255,255,255,0.85); margin-top: 6px; }

    /* Corps */
    .body { padding: 36px; }
    .greeting { font-size: 16px; color: #1a1a2e; margin-bottom: 16px; }
    .custom-message { background: #f8f9ff; border-left: 4px solid #6366f1; border-radius: 0 8px 8px 0; padding: 16px 20px; font-size: 14px; color: #444; line-height: 1.7; margin-bottom: 28px; }

    /* Carte facture */
    .invoice-card { border: 1px solid #e8eaf0; border-radius: 10px; overflow: hidden; margin-bottom: 28px; }
    .invoice-card-header { background: #f8f9ff; padding: 14px 20px; border-bottom: 1px solid #e8eaf0; }
    .invoice-card-header span { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px; }
    .invoice-card-header strong { font-size: 16px; color: #1a1a2e; }
    .invoice-details { padding: 0 20px; }
    .detail-row { display: table; width: 100%; padding: 12px 0; border-bottom: 1px solid #f0f0f5; }
    .detail-row:last-child { border-bottom: none; }
    .detail-row .label { display: table-cell; font-size: 13px; color: #888; width: 50%; }
    .detail-row .value { display: table-cell; font-size: 13px; font-weight: 500; color: #1a1a2e; text-align: right; }
    .total-row { background: #f8f9ff; padding: 16px 20px; display: table; width: 100%; border-top: 2px solid #6366f1; }
    .total-row .label { display: table-cell; font-size: 15px; font-weight: 600; color: #1a1a2e; }
    .total-row .amount { display: table-cell; font-size: 22px; font-weight: 700; color: #6366f1; text-align: right; }

    /* Note PDF */
    .pdf-note { background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px; padding: 14px 18px; font-size: 13px; color: #7a6000; margin-bottom: 28px; }

    /* Footer */
    .footer { background: #f4f6f9; padding: 24px 36px; text-align: center; border-top: 1px solid #e8eaf0; }
    .footer p { font-size: 12px; color: #999; line-height: 1.7; }
    .footer strong { color: #666; }
  </style>
</head>
<body>
<div class="wrapper">

  {{-- Header avec infos organisation --}}
  <div class="org-header">
    <div class="org-logo-wrap">
      @if($organization->logo)
        <img src="{{ $organization->logo }}" alt="{{ $organization->name }}" class="org-logo">
      @else
        <span class="org-logo-placeholder">
          {{ strtoupper(substr($organization->name, 0, 1)) }}
        </span>
      @endif
    </div>
    <div class="org-info">
      <div class="org-name">{{ $organization->name }}</div>
      <div class="org-contact">
        {{ $organization->email }}
        @if($organization->phone) &middot; {{ $organization->phone }} @endif
      </div>
      @if($organization->adresse)
        <div class="org-contact">{{ $organization->adresse }}</div>
      @endif
    </div>
  </div>

  {{-- Bannière --}}
  <div class="status-banner">
    <h1>Votre facture est disponible</h1>
    <p>Facture n&deg; {{ $invoice->invoice_number }} &mdash; {{ \Carbon\Carbon::parse($invoice->due_at)->format('d/m/Y') }}</p>
  </div>

  {{-- Corps --}}
  <div class="body">

    <p class="greeting">Bonjour <strong>{{ $customer->fullname }}</strong>,</p>

    {{-- Message personnalisé --}}
    <div class="custom-message">
      {{ $customMessage }}
    </div>

    {{-- Carte facture --}}
    <div class="invoice-card">
      <div class="invoice-card-header">
        <span>Référence</span>
        <strong>{{ $invoice->invoice_number }}</strong>
      </div>
      <div class="invoice-details">
        <div class="detail-row">
          <span class="label">Date d&apos;émission</span>
          <span class="value">{{ \Carbon\Carbon::parse($invoice->due_at)->format('d/m/Y') }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Date d&apos;échéance</span>
          <span class="value">{{ \Carbon\Carbon::parse($invoice->echeance_at)->format('d/m/Y') }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Montant HT</span>
          <span class="value">{{ number_format($invoice->total_ht, 0, ',', ' ') }} FCFA</span>
        </div>
        <div class="detail-row">
          <span class="label">TVA</span>
          <span class="value">{{ number_format($invoice->total_tva, 0, ',', ' ') }} FCFA</span>
        </div>
      </div>
      <div class="total-row">
        <span class="label">Total TTC</span>
        <span class="amount">{{ number_format($invoice->total_ttc, 0, ',', ' ') }} FCFA</span>
      </div>
    </div>

    {{-- Note PDF --}}
    <div class="pdf-note">
      &#128206; La facture en format PDF est jointe à cet email pour vos archives.
    </div>

    <p style="font-size:14px; color:#555; line-height:1.7;">
      Pour toute question concernant cette facture, n&apos;hésitez pas à nous contacter à
      <a href="mailto:{{ $organization->email }}" style="color:#6366f1;">{{ $organization->email }}</a>.
    </p>

    <p style="font-size:14px; color:#555; margin-top:20px;">
      Cordialement,<br>
      <strong>{{ $organization->name }}</strong>
    </p>

  </div>

  {{-- Footer --}}
  <div class="footer">
    <p>
      <strong>{{ $organization->name }}</strong><br>
      {{ $organization->adresse }}
      @if($organization->phone) &middot; {{ $organization->phone }} @endif
    </p>
    <p style="margin-top:8px;">
      Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.
    </p>
  </div>

</div>
</body>
</html>
