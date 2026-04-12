import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-white/80 dark:bg-card p-8 rounded-lg shadow">
        <h1 className="text-2xl font-semibold mb-4">Connexion</h1>
        <p className="mb-6 text-sm text-muted-foreground">Connectez-vous à votre compte</p>
        <LoginForm />
      </div>
    </main>
  );
}
