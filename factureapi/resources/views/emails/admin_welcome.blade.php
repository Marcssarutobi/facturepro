<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue sur FacturePro</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f7fafc; color: #1f2937; margin: 0; padding: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
            <td align="center" style="padding: 32px 16px;">
                <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);">
                    <tr>
                        <td style="padding: 32px; text-align: center;">
                            <h1 style="margin: 0 0 16px; font-size: 24px; color: #111827;">Bienvenue sur FacturePro</h1>
                            <p style="margin: 0 0 24px; color: #4b5563; line-height: 1.6;">Bonjour {{ $user->fullname }},</p>
                            <p style="margin: 0 0 24px; color: #4b5563; line-height: 1.6;">Votre organisation <strong>{{ $organization->name }}</strong> a été créée avec succès. Voici vos identifiants administrateur :</p>

                            <div style="display: block; padding: 12px 16px; border-radius: 8px; background: #111827; color: #ffffff; font-size: 16px; letter-spacing: 0.02em; margin: 0 0 12px;">
                                <div style="text-align: left;"><strong>Courriel :</strong> {{ $user->email }}</div>
                                <div style="text-align: left;"><strong>Mot de passe :</strong> {{ $password }}</div>
                            </div>

                            <p style="margin: 0 0 24px; color: #4b5563; line-height: 1.6;">Pour vous connecter, rendez-vous sur <a href="https://facturepro-sogs.vercel.app/login">https://facturepro-sogs.vercel.app/login</a> et utilisez ces identifiants. Nous vous recommandons de changer ce mot de passe après votre première connexion.</p>

                            <p style="margin: 24px 0 0; color: #4b5563; font-size: 14px; line-height: 1.6;">Merci,<br>L'équipe FacturePro</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
