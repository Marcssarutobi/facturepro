<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>{{ $invoice->type === 'FA' ? 'Avoir' : 'Facture' }} {{ $invoice->invoice_number }}</title>
    <style>
        @page { margin: 20px 36px 36px 36px; }

        body {
            margin: 0;
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #0f172a;
            background: #ffffff;
        }

        .band {
            background: #1d4ed8;
            color: #ffffff;
            padding: 22px 36px;
            margin: -20px -36px 24px -36px;
        }

        .layout-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .layout-table td { vertical-align: top; }

        .org-logo {
            width: 120px;
            height: 44px;
            object-fit: contain;
            margin-bottom: 8px;
            display: block;
        }

        .company-name {
            margin: 0 0 4px;
            font-size: 15px;
            font-weight: 700;
            color: #ffffff;
        }

        .band .muted { color: #dbeafe; font-size: 10.5px; }

        .title-block { text-align: right; }

        .invoice-title {
            margin: 0 0 4px;
            font-size: 22px;
            font-weight: 700;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .invoice-number {
            margin: 0;
            font-size: 12px;
            color: #dbeafe;
        }

        .muted { color: #64748b; }

        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        .meta-table td { padding: 2px 0; font-size: 10.5px; color: #dbeafe; }

        .text-right { text-align: right; }

        .status-tag {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            background: rgba(255,255,255,0.15);
            color: #ffffff;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .section-label {
            margin: 0 0 8px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #1d4ed8;
        }

        .info-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 14px;
        }

        .lines-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .lines-table thead { display: table-header-group; }

        .lines-table th {
            padding: 9px 8px;
            text-align: left;
            font-size: 9.5px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            background: #1d4ed8;
            color: #ffffff;
        }

        .lines-table th:first-child { border-top-left-radius: 6px; border-bottom-left-radius: 6px; }
        .lines-table th:last-child { border-top-right-radius: 6px; border-bottom-right-radius: 6px; }

        .lines-table td {
            padding: 9px 8px;
            border-bottom: 1px solid #e2e8f0;
        }

        .lines-table tbody tr { page-break-inside: avoid; }
        .lines-table tbody tr:nth-child(even) { background: #f8fafc; }

        .totals-block { page-break-inside: avoid; }

        .totals-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }

        .totals-table td { padding: 5px 0; }

        .totals-final td {
            border-top: 2px solid #1d4ed8;
            padding-top: 8px;
            font-size: 15px;
            font-weight: 700;
            color: #1d4ed8;
        }

        .footer-note {
            margin-top: 26px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            font-size: 10px;
            color: #64748b;
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

    {{-- ── BANDEAU D'EN-TETE ───────────────────────────────── --}}
    <div class="band">
        <table class="layout-table">
            <tr>
                <td style="width: 55%;">
                    @if(!$isFreePlan && $hasLogo)
                        <img src="{{ public_path('storage/' . $org->logo) }}" alt="{{ $org->name }}" class="org-logo">
                    @else
                        <img src="{{ public_path('/logoFacture.png') }}" alt="Logo" class="org-logo" width="120">
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
                            <td>Avoir sur facture</td>
                            <td class="text-right">{{ $invoice->originalInvoice->invoice_number }}</td>
                        </tr>
                        @endif
                        <tr>
                            <td>Statut</td>
                            <td class="text-right">
                                <span class="status-tag">{{ $statusLabels[$invoice->status] ?? ucfirst($invoice->status) }}</span>
                            </td>
                        </tr>
                        <tr>
                            <td>Emise le</td>
                            <td class="text-right">{{ $formatDate($invoice->due_at) }}</td>
                        </tr>
                        <tr>
                            <td>Echeance</td>
                            <td class="text-right">{{ $formatDate($invoice->echeance_at) }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>

    {{-- ── CLIENT / EMETTEUR ───────────────────────────────── --}}
    <table class="layout-table">
        <tr>
            <td style="width: 50%;">
                <div class="info-card">
                    <p class="section-label">Facturee a</p>
                    <p style="font-weight:700; margin:0 0 4px;">
                        {{ $invoice->customer->fullname ?? $invoice->anonymous_customer_name }}
                    </p>
                    <div class="muted">
                        <div>{{ $invoice->customer->email ?? 'Email non renseigne' }}</div>
                        @if($invoice->customer->ifu ?? null)<div>IFU : {{ $invoice->customer->ifu }}</div>@endif
                        @if($invoice->customer->phone ?? null)<div>{{ $invoice->customer->phone }}</div>@endif
                        @if($invoice->customer->adresse ?? null)<div>{{ $invoice->customer->adresse }}</div>@endif
                    </div>
                </div>
            </td>
            <td style="width: 50%; padding-left: 16px;">
                <div class="info-card">
                    <p class="section-label">Preparee par</p>
                    <p style="font-weight:700; margin:0 0 4px;">{{ $invoice->user->fullname ?? 'Equipe FacturaPro' }}</p>
                    <div class="muted">{{ $invoice->user->email ?? 'Email non renseigne' }}</div>
                </div>
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

    <p class="footer-note">Merci pour votre confiance.</p>
</div>
</body>
</html>
