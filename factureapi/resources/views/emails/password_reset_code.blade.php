<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code de réinitialisation</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f7fafc; color: #1f2937; margin: 0; padding: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
            <td align="center" style="padding: 32px 16px;">
                <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);">
                    <tr>
                        <td style="padding: 32px; text-align: center;">
                            <h1 style="margin: 0 0 16px; font-size: 24px; color: #111827;">Réinitialisation de votre mot de passe</h1>
                            <p style="margin: 0 0 24px; color: #4b5563; line-height: 1.6;">Bonjour {{ $user->fullname }},</p>
                            <p style="margin: 0 0 24px; color: #4b5563; line-height: 1.6;">Un code de vérification a été demandé pour votre compte. Utilisez le code ci-dessous pour confirmer votre e-mail et définir un nouveau mot de passe.</p>
                            <div style="display: inline-block; padding: 18px 24px; border-radius: 12px; background: #111827; color: #ffffff; font-size: 20px; letter-spacing: 0.1em; margin: 0 0 24px;">{{ $code }}</div>
                            <p style="margin: 0 0 4px; color: #4b5563; line-height: 1.6;">Ce code est valable quelques minutes. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer ce message.</p>
                            <p style="margin: 24px 0 0; color: #4b5563; font-size: 14px; line-height: 1.6;">Merci,<br>L'équipe FacturePro</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
