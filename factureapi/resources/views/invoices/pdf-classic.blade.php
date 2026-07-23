<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Facture {{ $invoice->invoice_number }}</title>
    <style>
        @page { margin: 36px; }

        body {
            margin: 0;
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #1a1a1a;
            background: #ffffff;
        }

        .layout-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .layout-table td { vertical-align: top; }

        .org-logo {
            width: 130px;
            height: 48px;
            object-fit: contain;
            margin-bottom: 8px;
            display: block;
        }

        .company-name {
            margin: 0 0 6px;
            font-size: 16px;
            font-weight: 700;
        }

        .muted { color: #555555; }

        .title-block {
            text-align: right;
        }

        .invoice-title {
            margin: 0 0 4px;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
        }

        .invoice-number {
            margin: 0;
            font-size: 13px;
            color: #555555;
        }

        .double-rule {
            border-top: 3px double #1a1a1a;
            margin: 18px 0;
        }

        .single-rule {
            border-top: 1px solid #1a1a1a;
            margin: 18px 0;
        }

        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
        }

        .meta-table td { padding: 2px 0; }

        .text-right { text-align: right; }

        .section-label {
            margin: 0 0 6px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 1px solid #1a1a1a;
            padding-bottom: 4px;
        }

        .lines-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        .lines-table th {
            padding: 8px 6px;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            border-top: 2px solid #1a1a1a;
            border-bottom: 2px solid #1a1a1a;
        }

        .lines-table td {
            padding: 8px 6px;
            border-bottom: 1px solid #cccccc;
        }

        .totals-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }

        .totals-table td {
            padding: 5px 0;
        }

        .totals-final td {
            border-top: 2px solid #1a1a1a;
            padding-top: 8px;
            font-size: 15px;
            font-weight: 700;
        }

        .status-tag {
            display: inline-block;
            padding: 2px 8px;
            border: 1px solid #1a1a1a;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .footer-note {
            margin-top: 30px;
            padding-top: 12px;
            border-top: 1px solid #cccccc;
            font-size: 10px;
            color: #555555;
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

    {{-- ── EN-TETE : ORGANISATION / TITRE FACTURE ─────────── --}}
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
                <p class="invoice-title">Facture</p>
                <p class="invoice-number">N° {{ $invoice->invoice_number }}</p>
                <table class="meta-table">
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

    <div class="double-rule"></div>

    {{-- ── CLIENT / EMETTEUR ───────────────────────────────── --}}
    <table class="layout-table">
        <tr>
            <td style="width: 50%;">
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
            </td>
            <td style="width: 50%; padding-left: 20px;">
                <p class="section-label">Preparee par</p>
                <p style="font-weight:700; margin:0 0 4px;">{{ $invoice->user->fullname ?? 'Equipe FacturaPro' }}</p>
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

    {{-- ── TOTAUX ──────────────────────────────────────────── --}}
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

    @if($invoice->is_normalized && $invoice->qr_code_base64)
        <div class="single-rule"></div>
        <table style="width:100%;">
            <tr>
                <td style="width:100px;">
                    <img src="{{ $invoice->qr_code_base64 }}" style="width:80px;">
                </td>
                <td>
                    <p style="font-size:11px; margin:0 0 4px;">Code MECeF/DGI : <strong>{{ $invoice->emcef_code }}</strong></p>
                    <p style="font-size:10px; margin:0; color:#555;">
                        NIM {{ $invoice->emcef_nim }} — Compteur {{ $invoice->emcef_counters }} —
                        {{ \Carbon\Carbon::parse($invoice->emcef_datetime)->format('d/m/Y H:i') }}
                    </p>
                </td>
            </tr>
        </table>
    @endif

    <p class="footer-note">Merci pour votre confiance.</p>
</div>
</body>
</html>
