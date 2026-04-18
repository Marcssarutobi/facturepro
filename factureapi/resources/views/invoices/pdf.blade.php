<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Facture {{ $invoice->invoice_number }}</title>
    <style>
        @page {
            margin: 32px;
        }

        body {
            margin: 0;
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #0f172a;
            background: #ffffff;
        }

        .page {
            width: 100%;
        }

        .page {
            page-break-inside: avoid;
        }

        .section-gap {
            page-break-inside: avoid;
        }

        .lines-wrap {
            page-break-inside: avoid;
        }

        .footer-wrap {
            page-break-inside: avoid;
        }

        .section-gap {
            margin-bottom: 16px;
        }

        .header-wrap {
            padding-bottom: 24px;
            border-bottom: 1px solid #e2e8f0;
        }

        .layout-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .layout-table td {
            vertical-align: top;
        }

        .cell-gap-left {
            padding-left: 16px;
        }

        .card-light {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 14px;
            border-radius: 16px;
        }

        .card-plain {
            border: 1px solid #e2e8f0;
            padding: 14px;
            border-radius: 16px;
        }

        .card-dark {
            background: #0f172a;
            color: #ffffff;
            padding: 14px;
            border-radius: 16px;
        }

        .brand-mark {
            width: 46px;
            height: 46px;
            background: #0f172a;
            color: #ffffff;
            text-align: center;
            line-height: 46px;
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 16px;
            border-radius: 16px;
        }

        .org-logo {
            width: 150px;
            height: 52px;
            border-radius: 10px;
            object-fit: contain;
            margin-bottom: 16px;
            display: block;
        }

        .company-name {
            margin: 0 0 10px;
            font-size: 20px;
            font-weight: 700;
        }

        .label {
            margin: 0 0 10px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1.6px;
            color: #94a3b8;
        }

        .card-dark .label,
        .card-dark .muted {
            color: #cbd5e1;
        }

        .invoice-number {
            margin: 0 0 16px;
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
        }

        .section-title {
            margin: 0 0 8px;
            font-size: 18px;
            font-weight: 700;
        }

        .muted {
            color: #64748b;
        }

        .meta-table,
        .totals-table,
        .lines-table {
            width: 100%;
            border-collapse: collapse;
        }

        .meta-table td,
        .totals-table td {
            padding: 4px 0;
        }

        .text-right {
            text-align: right;
        }

        .lines-wrap {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
        }

        .lines-table th {
            padding: 10px 12px;
            background: #f8fafc;
            color: #94a3b8;
            text-align: left;
            text-transform: uppercase;
            letter-spacing: 1.4px;
            font-size: 10px;
            border-bottom: 1px solid #e2e8f0;
        }

        .lines-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
        }

        .lines-table tr:last-child td {
            border-bottom: none;
        }

        .footer-wrap {
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
        }

        .totals-divider {
            border-top: 1px solid rgba(255, 255, 255, 0.15);
            margin: 12px 0;
        }

        .totals-strong {
            font-size: 16px;
            font-weight: 700;
        }

        .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 600;
        }

        .badge-draft     { background: #f1f5f9; color: #64748b; }
        .badge-sent      { background: #dbeafe; color: #1d4ed8; }
        .badge-paid      { background: #dcfce7; color: #15803d; }
        .badge-overdue   { background: #fee2e2; color: #dc2626; }
        .badge-cancelled { background: #ffedd5; color: #c2410c; }
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
    $statusBadges = [
        'draft'     => 'badge-draft',
        'sent'      => 'badge-sent',
        'paid'      => 'badge-paid',
        'overdue'   => 'badge-overdue',
        'cancelled' => 'badge-cancelled',
    ];
@endphp

<div class="page">

    {{-- ── HEADER ─────────────────────────────────────────── --}}
    <div class="header-wrap section-gap">
        <table class="layout-table">
            <tr>
                <td style="width: 56%;">

                    {{-- Logo ou initiale --}}
                    @php
                        $org = $invoice->organization;
                        $isFreePlan = ($org->plan ?? 'free') === 'free';
                        $hasLogo = !empty($org->logo);
                    @endphp

                    @if(!$isFreePlan && $hasLogo)
                        {{-- Logo de l'organisation --}}
                        <img
                            src="{{ public_path('storage/' . $org->logo) }}"
                            alt="{{ $org->name }}"
                            class="org-logo"
                        >
                    @else
                        {{-- Logo par défaut --}}
                        <img
                            src="{{ public_path('/logoFacture.png') }}"
                            alt="Logo par défaut"
                            class="org-logo"
                            width="150"
                        >
                    @endif

                    <h1 class="company-name">{{ $invoice->organization->name ?? 'FacturaPro' }}</h1>
                    <div class="muted">
                        <div>{{ $invoice->organization->adresse ?? 'Adresse non renseignee' }}</div>
                        <div>{{ $invoice->organization->email ?? 'Email non renseigne' }}</div>
                        <div>{{ $invoice->organization->phone ?? 'Telephone non renseigne' }}</div>
                    </div>
                </td>
                <td class="cell-gap-left" style="width: 44%;">
                    <div class="card-dark">
                        <p class="label">Facture</p>
                        <p class="invoice-number">{{ $invoice->invoice_number }}</p>
                        <table class="meta-table">
                            <tr>
                                <td class="muted">Statut</td>
                                <td class="text-right">
                                    <span class="badge {{ $statusBadges[$invoice->status] ?? 'badge-draft' }}">
                                        {{ $statusLabels[$invoice->status] ?? ucfirst($invoice->status) }}
                                    </span>
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
                    </div>
                </td>
            </tr>
        </table>
    </div>

    {{-- ── INFOS CLIENT / EMETTEUR ────────────────────────── --}}
    <div class="section-gap">
        <table class="layout-table">
            <tr>
                <td style="width: 50%;">
                    <div class="card-light">
                        <p class="label">Facturee a</p>
                        <p class="section-title">{{ $invoice->customer->fullname ?? $invoice->anonymous_customer_name }}</p>
                        <div class="muted">
                            <div>{{ $invoice->customer->email ?? 'Email non renseigne' }}</div>
                            @if($invoice->customer->phone ?? null)
                                <div>{{ $invoice->customer->phone }}</div>
                            @endif
                            @if($invoice->customer->adresse ?? null)
                                <div>{{ $invoice->customer->adresse }}</div>
                            @endif
                        </div>
                    </div>
                </td>
                <td class="cell-gap-left" style="width: 50%;">
                    <div class="card-plain">
                        <p class="label">Preparee par</p>
                        <p class="section-title">{{ $invoice->user->fullname ?? 'Equipe FacturaPro' }}</p>
                        <div class="muted">
                            <div>{{ $invoice->user->email ?? 'Email non renseigne' }}</div>
                        </div>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    {{-- ── LIGNES DE FACTURE ───────────────────────────────── --}}
    <div class="lines-wrap section-gap">
        <table class="lines-table">
            <thead>
                <tr>
                    <th style="width: 40%;">Description</th>
                    <th style="width: 10%;">Qte</th>
                    <th style="width: 18%;">Prix unitaire TTC</th>
                    <th style="width: 12%;">TVA</th>
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
                        <td class="text-right">
                            {{ $formatMoney($getLineTotalTtc($item)) }}
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    {{-- ── FOOTER : NOTE + TOTAUX ──────────────────────────── --}}
    <div class="footer-wrap">
        <table class="layout-table">
            <tr>
                <td style="width: 56%;">
                    <div class="card-light">
                        <p class="section-title" style="font-size: 16px;">Note</p>
                        <div class="muted" style="margin-top: 8px;">
                            Merci pour votre confiance.
                        </div>
                    </div>
                </td>
                <td class="cell-gap-left" style="width: 44%;">
                    <div class="card-dark">
                        <table class="totals-table">
                            <tr>
                                <td class="muted">Total HT</td>
                                <td class="text-right">{{ $formatMoney($invoice->total_ht) }}</td>
                            </tr>
                            <tr>
                                <td class="muted">TVA</td>
                                <td class="text-right">{{ $formatMoney($invoice->total_tva) }}</td>
                            </tr>
                        </table>
                        <div class="totals-divider"></div>
                        <table class="totals-table">
                            <tr>
                                <td class="totals-strong">Total TTC</td>
                                <td class="text-right totals-strong">
                                    {{ $formatMoney($invoice->total_ttc) }}
                                </td>
                            </tr>
                        </table>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    @if($invoice->is_normalized && $invoice->qr_code_base64)
        <div style="border:1px solid #e2e8f0; padding:16px; border-radius:8px; margin-top:20px;">

            <table style="width:100%;">
                <tr>
                    <td style="width:120px;">
                        <img src="{{ $invoice->qr_code_base64 }}" style="width:80px;">
                    </td>
                    <td>

                        <p style="text-align:center; font-size:12px;">Code MECeF/DGI</p>
                        <p style="text-align:center; font-weight:bold;">
                            {{ $invoice->emcef_code }}
                        </p>

                        <table style="width:100%; margin-top:10px;">
                            <tr>
                                <td>MECeF NIM :</td>
                                <td style="text-align:right;">{{ $invoice->emcef_nim }}</td>
                            </tr>
                            <tr>
                                <td>MECeF Compteurs :</td>
                                <td style="text-align:right;">{{ $invoice->emcef_counters }}</td>
                            </tr>
                            <tr>
                                <td>MECeF Heure :</td>
                                <td style="text-align:right;">
                                    {{ \Carbon\Carbon::parse($invoice->emcef_datetime)->format('d/m/Y H:i') }}
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>
            </table>
        </div>
    @endif

</div>
</body>
</html>
