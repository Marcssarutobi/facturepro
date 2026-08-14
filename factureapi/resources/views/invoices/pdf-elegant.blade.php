<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>{{ $invoice->type === 'FA' ? 'Avoir' : 'Facture' }} {{ $invoice->invoice_number }}</title>
    <style>
        @page { margin: 40px; }

        body {
            margin: 0;
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #1e293b;
            background: #ffffff;
        }

        .layout-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .layout-table td { vertical-align: top; }

        .gold-rule {
            border-top: 2px solid #b45309;
            margin: 20px 0;
        }

        .hairline {
            border-top: 1px solid #e5e7eb;
            margin: 20px 0;
        }

        .org-logo {
            width: 130px;
            height: 48px;
            object-fit: contain;
            margin-bottom: 10px;
            display: block;
        }

        .company-name {
            margin: 0 0 6px;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: #1e293b;
        }

        .muted { color: #64748b; }

        .title-block { text-align: right; }

        .kicker {
            margin: 0 0 4px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 3px;
            text-transform: uppercase;
            color: #b45309;
        }

        .invoice-number {
            margin: 0 0 6px;
            font-size: 22px;
            font-weight: 700;
            color: #1e293b;
        }

        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
        }

        .meta-table td { padding: 3px 0; }

        .text-right { text-align: right; }

        .section-label {
            margin: 0 0 8px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #b45309;
        }

        .lines-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        .lines-table thead { display: table-header-group; }

        .lines-table th {
            padding: 10px 8px;
            text-align: left;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #b45309;
            border-top: 1px solid #1e293b;
            border-bottom: 1px solid #1e293b;
        }

        .lines-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #f1f5f9;
        }

        .lines-table tbody tr { page-break-inside: avoid; }

        .totals-block { page-break-inside: avoid; }

        .totals-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }

        .totals-table td { padding: 5px 0; }

        .totals-final td {
            border-top: 1px solid #b45309;
            padding-top: 10px;
            font-size: 16px;
            font-weight: 700;
            color: #1e293b;
        }

        .status-tag {
            display: inline-block;
            padding: 2px 10px;
            border: 1px solid #b45309;
            color: #b45309;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .footer-note {
            margin-top: 26px;
            padding-top: 14px;
            border-top: 1px solid #e5e7eb;
            font-size: 10px;
            font-style: italic;
            color: #64748b;
            text-align: center;
        }
    </style>
</head>
<body>
@php
    $formatMoney = fn ($amount) => number_format((float) $amount, 0, ',', ' ') . ' FCFA';
    $formatDate  = fn ($date)   => \Carbon\Carbon::parse($date)->translatedFormat('d M Y');
    $getUnitPriceTtc = fn ($item) => round((float) $item->unit_price * (1 + (float) $item->vat_rate));
    $getLineTotalTtc = fn ($item) => $item->quantity * $getUnitPriceTtc($item);
    $statusLabels = [
        'draft'     => 'Brouillon',
        'sent'      => 'Envoyee',
        'paid'      => 'Payee',
        'overdue'   => 'En retard',
        'cancelled' => 'Annulee',
    ];
    $org = $invoice->organization;
    $isFreePlan = ($org->plan ?? 'free') === 'free';
    $hasLogo = !empty($org->logo);
@endphp

<div class="page">

    {{-- ── EN-TETE ─────────────────────────────────────────── --}}
    <table class="layout-table">
        <tr>
            <td style="width: 55%;">
                @if(!$isFreePlan && $hasLogo)
                    <img src="{{ public_path('storage/' . $org->logo) }}" alt="{{ $org->name }}" class="org-logo">
                @else
                    <img src="{{ public_path('/logoFacture.png') }}" alt="Logo" class="org-logo" width="130">
                @endif
                <p class="company-name">{{ $org->name ?? 'FacturaPro' }}</p>
                <div class="muted">
                    <div>{{ $org->adresse ?? 'Adresse non renseignee' }}</div>
                    <div>{{ $org->email ?? 'Email non renseigne' }}</div>
                    <div>{{ $org->phone ?? 'Telephone non renseigne' }}</div>
                </div>
            </td>
            <td class="title-block" style="width: 45%;">
                <p class="kicker">{{ $invoice->type === 'FA' ? 'Avoir' : 'Facture' }}</p>
                <p class="invoice-number">N° {{ $invoice->invoice_number }}</p>
                <table class="meta-table">
                    @if($invoice->type === 'FA' && $invoice->originalInvoice)
                    <tr>
                        <td class="muted">Avoir sur facture</td>
                        <td class="text-right">{{ $invoice->originalInvoice->invoice_number }}</td>
                    </tr>
                    @endif
                    <tr>
                        <td class="muted">Statut</td>
                        <td class="text-right">
                            <span class="status-tag">{{ $statusLabels[$invoice->status] ?? ucfirst($invoice->status) }}</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="muted">Emise le</td>
                        <td class="text-right">{{ $formatDate($invoice->due_at) }}</td>
                    </tr>
                    <tr>
                        <td class="muted">Echeance</td>
                        <td class="text-right">{{ $formatDate($invoice->echeance_at) }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <div class="gold-rule"></div>

    {{-- ── CLIENT / EMETTEUR ───────────────────────────────── --}}
    <table class="layout-table">
        <tr>
            <td style="width: 50%;">
                <p class="section-label">Facturee a</p>
                <p style="font-weight:700; margin:0 0 4px; font-size:13px;">
                    {{ $invoice->customer->fullname ?? $invoice->anonymous_customer_name }}
                </p>
                <div class="muted">
                    <div>{{ $invoice->customer->email ?? 'Email non renseigne' }}</div>
                    @if($invoice->customer->ifu ?? null)<div>IFU : {{ $invoice->customer->ifu }}</div>@endif
                    @if($invoice->customer->phone ?? null)<div>{{ $invoice->customer->phone }}</div>@endif
                    @if($invoice->customer->adresse ?? null)<div>{{ $invoice->customer->adresse }}</div>@endif
                </div>
            </td>
            <td style="width: 50%; padding-left: 20px;">
                <p class="section-label">Preparee par</p>
                <p style="font-weight:700; margin:0 0 4px; font-size:13px;">{{ $invoice->user->fullname ?? 'Equipe FacturaPro' }}</p>
                <div class="muted">{{ $invoice->user->email ?? 'Email non renseigne' }}</div>
            </td>
        </tr>
    </table>

    {{-- ── LIGNES DE FACTURE ───────────────────────────────── --}}
    <table class="lines-table">
        <thead>
            <tr>
                <th style="width: 42%;">Description</th>
                <th style="width: 10%;">Qte</th>
                <th style="width: 18%;">Prix unit. TTC</th>
                <th style="width: 10%;">TVA</th>
                <th class="text-right" style="width: 20%;">Total TTC</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($invoice->items as $item)
                <tr>
                    <td>{{ $item->description }}</td>
                    <td>{{ $item->quantity }}</td>
                    <td>{{ $formatMoney($getUnitPriceTtc($item)) }}</td>
                    <td>{{ number_format((float) $item->vat_rate * 100, 0, ',', ' ') }}%</td>
                    <td class="text-right">{{ $formatMoney($getLineTotalTtc($item)) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    {{-- ── TOTAUX + SECURITE e-MCF (bloc protégé, ne se coupe jamais) ─── --}}
    <div class="totals-block">
        <table class="layout-table">
            <tr>
                <td style="width: 55%;"></td>
                <td style="width: 45%;">
                    <table class="totals-table">
                        <tr>
                            <td class="muted">Total HT</td>
                            <td class="text-right">{{ $formatMoney($invoice->total_ht) }}</td>
                        </tr>
                        <tr>
                            <td class="muted">TVA</td>
                            <td class="text-right">{{ $formatMoney($invoice->total_tva) }}</td>
                        </tr>
                        <tr class="totals-final">
                            <td>Total TTC</td>
                            <td class="text-right">{{ $formatMoney($invoice->total_ttc) }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        @include('invoices.partials.emcef-block')
    </div>

    <p class="footer-note">Merci pour la confiance que vous accordez a notre maison.</p>
</div>
</body>
</html>
