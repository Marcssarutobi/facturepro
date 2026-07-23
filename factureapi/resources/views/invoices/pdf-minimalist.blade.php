<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Facture {{ $invoice->invoice_number }}</title>
    <style>
        @page { margin: 48px; }

        body {
            margin: 0;
            font-family: DejaVu Sans, sans-serif;
            font-size: 11.5px;
            line-height: 1.7;
            color: #2b2b2b;
            background: #ffffff;
            font-weight: 300;
        }

        .layout-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .layout-table td { vertical-align: top; }

        .org-logo {
            width: 110px;
            height: 40px;
            object-fit: contain;
            margin-bottom: 18px;
            display: block;
        }

        .muted { color: #9a9a9a; }

        .hairline {
            border-top: 1px solid #e8e8e8;
            margin: 28px 0;
        }

        .tiny-label {
            margin: 0 0 6px;
            font-size: 9px;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #9a9a9a;
            font-weight: 400;
        }

        .invoice-number-big {
            margin: 0 0 4px;
            font-size: 22px;
            font-weight: 300;
            letter-spacing: 0.5px;
        }

        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        .meta-table td { padding: 3px 0; font-size: 11px; }

        .text-right { text-align: right; }

        .lines-table {
            width: 100%;
            border-collapse: collapse;
        }

        .lines-table th {
            padding: 0 0 10px;
            text-align: left;
            font-size: 9px;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #9a9a9a;
            font-weight: 400;
            border-bottom: 1px solid #e8e8e8;
        }

        .lines-table td {
            padding: 12px 0;
            border-bottom: 1px solid #f2f2f2;
        }

        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }

        .totals-table td { padding: 5px 0; font-size: 11.5px; }

        .totals-final td {
            padding-top: 14px;
            font-size: 16px;
            font-weight: 400;
        }

        .footer-note {
            margin-top: 40px;
            font-size: 10px;
            color: #9a9a9a;
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

    {{-- ── EN-TETE ──────────────────────────────────────────── --}}
    <table class="layout-table">
        <tr>
            <td style="width: 55%;">
                @if(!$isFreePlan && $hasLogo)
                    <img src="{{ public_path('storage/' . $org->logo) }}" alt="{{ $org->name }}" class="org-logo">
                @else
                    <img src="{{ public_path('/logoFacture.png') }}" alt="Logo" class="org-logo" width="110">
                @endif
                <div>{{ $org->name ?? 'FacturaPro' }}</div>
                <div class="muted">{{ $org->adresse ?? '' }}</div>
                <div class="muted">{{ $org->email ?? '' }}</div>
                <div class="muted">{{ $org->phone ?? '' }}</div>
            </td>
            <td class="text-right" style="width: 45%;">
                <p class="tiny-label">Facture</p>
                <p class="invoice-number-big">{{ $invoice->invoice_number }}</p>
                <table class="meta-table">
                    <tr>
                        <td class="muted">Statut</td>
                        <td class="text-right">{{ $statusLabels[$invoice->status] ?? ucfirst($invoice->status) }}</td>
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

    <div class="hairline"></div>

    {{-- ── CLIENT / EMETTEUR ───────────────────────────────── --}}
    <table class="layout-table">
        <tr>
            <td style="width: 50%;">
                <p class="tiny-label">Facturee a</p>
                <div>{{ $invoice->customer->fullname ?? $invoice->anonymous_customer_name }}</div>
                <div class="muted">{{ $invoice->customer->email ?? '' }}</div>
                @if($invoice->customer->ifu ?? null)<div class="muted">IFU {{ $invoice->customer->ifu }}</div>@endif
                @if($invoice->customer->phone ?? null)<div class="muted">{{ $invoice->customer->phone }}</div>@endif
            </td>
            <td style="width: 50%;">
                <p class="tiny-label">Preparee par</p>
                <div>{{ $invoice->user->fullname ?? 'Equipe FacturaPro' }}</div>
                <div class="muted">{{ $invoice->user->email ?? '' }}</div>
            </td>
        </tr>
    </table>

    <div class="hairline"></div>

    {{-- ── LIGNES DE FACTURE ───────────────────────────────── --}}
    <table class="lines-table">
        <thead>
            <tr>
                <th style="width: 46%;">Description</th>
                <th style="width: 10%;">Qte</th>
                <th style="width: 18%;">Prix unit.</th>
                <th style="width: 8%;">TVA</th>
                <th class="text-right" style="width: 18%;">Total</th>
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
            <td style="width: 60%;"></td>
            <td style="width: 40%;">
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
        <div class="hairline"></div>
        <table style="width:100%;">
            <tr>
                <td style="width:90px;">
                    <img src="{{ $invoice->qr_code_base64 }}" style="width:70px;">
                </td>
                <td class="muted" style="font-size:10px;">
                    Code MECeF/DGI : {{ $invoice->emcef_code }}<br>
                    NIM {{ $invoice->emcef_nim }} — Compteur {{ $invoice->emcef_counters }}<br>
                    {{ \Carbon\Carbon::parse($invoice->emcef_datetime)->format('d/m/Y H:i') }}
                </td>
            </tr>
        </table>
    @endif

    <p class="footer-note">Merci pour votre confiance.</p>
</div>
</body>
</html>
