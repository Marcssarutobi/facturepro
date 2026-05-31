import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-white/80 dark:bg-card p-8 rounded-lg shadow">
        <h1 className="text-2xl font-semibold mb-4">Mot de passe oublié</h1>
        <p className="mb-6 text-sm text-muted-foreground">Entrez votre adresse e-mail pour recevoir un code de réinitialisation.</p>
        <ForgotPasswordForm />
      </div>
    </main>
  )
}
