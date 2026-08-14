{{--
    Bloc "Éléments de sécurité de la facture normalisée" (e-MCF / DGI).

    Inclus tel quel dans chaque template PDF via :
        @include('invoices.partials.emcef-block')

    Volontairement en styles inline (indépendant des classes CSS propres à
    chaque template) pour garantir un rendu strictement identique partout.
    page-break-inside: avoid est appliqué directement ici pour que ce bloc
    (QR code + infos) ne soit jamais coupé entre deux pages.
--}}
@if($invoice->is_normalized && $invoice->qr_code_base64)
    <div style="
        margin-top: 20px;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 16px 20px;
        page-break-inside: avoid;
    ">
        <p style="
            margin: 0 0 14px;
            text-align: center;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #b45309;
        ">-- Éléments de sécurité de la facture normalisée --</p>

        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 100px; vertical-align: middle;">
                    <img src="{{ $invoice->qr_code_base64 }}" style="width: 84px; height: 84px;">
                </td>
                <td style="vertical-align: middle;">
                    <p style="margin: 0 0 4px; text-align: center; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; color: #2563eb;">
                        Code MECeF/DGI
                    </p>
                    <p style="margin: 0 0 10px; text-align: center; font-size: 12px; font-weight: 700; color: #0f172a;">
                        {{ $invoice->emcef_code }}
                    </p>
                    <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                        <tr>
                            <td style="color: #64748b; padding: 2px 0;">MECeF NIM :</td>
                            <td style="text-align: right; font-weight: 700; padding: 2px 0;">{{ $invoice->emcef_nim }}</td>
                        </tr>
                        <tr>
                            <td style="color: #64748b; padding: 2px 0;">MECeF Compteurs :</td>
                            <td style="text-align: right; font-weight: 700; padding: 2px 0;">{{ $invoice->emcef_counters }}</td>
                        </tr>
                        <tr>
                            <td style="color: #64748b; padding: 2px 0;">MECeF Heure :</td>
                            <td style="text-align: right; font-weight: 700; padding: 2px 0;">
                                {{ \Carbon\Carbon::parse($invoice->emcef_datetime)->format('d/m/Y H:i:s') }}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>
@endif
