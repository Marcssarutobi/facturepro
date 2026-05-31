import ResetPasswordForm from '@/components/auth/ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-white/80 dark:bg-card p-8 rounded-lg shadow">
        <h1 className="text-2xl font-semibold mb-4">Réinitialiser le mot de passe</h1>
        <p className="mb-6 text-sm text-muted-foreground">Saisissez votre email, le code reçu par mail et votre nouveau mot de passe.</p>
        <ResetPasswordForm />
      </div>
    </main>
  )
}
