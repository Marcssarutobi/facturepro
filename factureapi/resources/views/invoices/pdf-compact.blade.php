<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>{{ $invoice->type === 'FA' ? 'Avoir' : 'Facture' }} {{ $invoice->invoice_number }}</title>
    <style>
        @page { margin: 26px; }

        body {
            margin: 0;
            font-family: DejaVu Sans, sans-serif;
            font-size: 10.5px;
            line-height: 1.35;
            color: #111827;
            background: #ffffff;
        }

        .layout-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .layout-table td { vertical-align: top; }

        .org-logo {
            width: 100px;
            height: 36px;
            object-fit: contain;
            margin-bottom: 4px;
            display: block;
        }

        .company-name {
            margin: 0 0 3px;
            font-size: 13px;
            font-weight: 700;
        }

        .muted { color: #6b7280; }

        .title-block { text-align: right; }

        .invoice-title {
            margin: 0 0 2px;
            font-size: 17px;
            font-weight: 700;
            color: #0d9488;
        }

        .invoice-number {
            margin: 0;
            font-size: 10.5px;
            color: #6b7280;
        }

        .rule {
            border-top: 1px solid #0d9488;
            margin: 8px 0 10px;
        }

        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
        }

        .meta-table td { padding: 1px 0; font-size: 10px; }

        .text-right { text-align: right; }

        .section-label {
            margin: 0 0 3px;
            font-size: 8.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #0d9488;
        }

        .lines-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }

        .lines-table thead { display: table-header-group; }

        .lines-table th {
            padding: 4px 5px;
            text-align: left;
            font-size: 8.5px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            background: #f0fdfa;
            color: #0d9488;
            border-top: 1px solid #0d9488;
            border-bottom: 1px solid #0d9488;
        }

        .lines-table td {
            padding: 4px 5px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 10px;
        }

        .lines-table tbody tr { page-break-inside: avoid; }

        .totals-block { page-break-inside: avoid; }

        .totals-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
        }

        .totals-table td { padding: 2px 0; font-size: 10.5px; }

        .totals-final td {
            border-top: 1px solid #0d9488;
            padding-top: 4px;
            font-size: 12.5px;
            font-weight: 700;
        }

        .status-tag {
            display: inline-block;
            padding: 1px 6px;
            background: #f0fdfa;
            color: #0d9488;
            font-size: 8.5px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            border-radius: 3px;
        }

        .footer-note {
            margin-top: 14px;
            padding-top: 6px;
            border-top: 1px solid #f0f0f0;
            font-size: 8.5px;
            color: #6b7280;
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
                    <img src="{{ public_path('/logoFacture.png') }}" alt="Logo" class="org-logo" width="100">
                @endif
                <p class="company-name">{{ $org->name ?? 'FacturaPro' }}</p>
                <div class="muted">
                    <div>{{ $org->adresse ?? 'Adresse non renseignee' }}</div>
                    <div>{{ $org->email ?? 'Email non renseigne' }} — {{ $org->phone ?? 'Telephone non renseigne' }}</div>
                </div>
            </td>
            <td class="title-block" style="width: 45%;">
                <p class="invoice-title">{{ $invoice->type === 'FA' ? 'Avoir' : 'Facture' }}</p>
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

    <div class="rule"></div>

    {{-- ── CLIENT / EMETTEUR ───────────────────────────────── --}}
    <table class="layout-table">
        <tr>
            <td style="width: 50%;">
                <p class="section-label">Facturee a</p>
                <p style="font-weight:700; margin:0 0 2px;">
                    {{ $invoice->customer->fullname ?? $invoice->anonymous_customer_name }}
                </p>
                <div class="muted">
                    <div>{{ $invoice->customer->email ?? 'Email non renseigne' }}</div>
                    @if($invoice->customer->ifu ?? null)<div>IFU : {{ $invoice->customer->ifu }}</div>@endif
                    @if($invoice->customer->phone ?? null)<div>{{ $invoice->customer->phone }}</div>@endif
                </div>
            </td>
            <td style="width: 50%; padding-left: 16px;">
                <p class="section-label">Preparee par</p>
                <p style="font-weight:700; margin:0 0 2px;">{{ $invoice->user->fullname ?? 'Equipe FacturaPro' }}</p>
                <div class="muted">{{ $invoice->user->email ?? 'Email non renseigne' }}</div>
            </td>
        </tr>
    </table>

    {{-- ── LIGNES DE FACTURE (dense, optimisee pour listes longues) ── --}}
    <table class="lines-table">
        <thead>
            <tr>
                <th style="width: 44%;">Description</th>
                <th style="width: 9%;">Qte</th>
                <th style="width: 17%;">P.U. TTC</th>
                <th style="width: 9%;">TVA</th>
                <th class="text-right" style="width: 21%;">Total TTC</th>
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

    <p class="footer-note">Merci pour votre confiance.</p>
</div>
</body>
</html>
