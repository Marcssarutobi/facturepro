import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-6xl bg-transparent rounded-lg overflow-hidden shadow-lg grid grid-cols-1 md:grid-cols-2">
        {/* Left marketing / illustration */}
        <aside className="hidden md:flex flex-col justify-center gap-6 p-12 bg-gradient-to-br from-primary/90 to-secondary/80 text-primary-foreground">
          <div>
            <h2 className="text-3xl font-bold mb-2">Lancez votre organisation</h2>
            <p className="text-sm opacity-90">Créez rapidement votre espace de facturation, invitez votre équipe et commencez à émettre des factures en quelques minutes.</p>
          </div>

          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-primary-foreground text-primary font-bold">✓</span>
              <span>Formulaire rapide et intuitif</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-primary-foreground text-primary font-bold">✓</span>
              <span>Multi-utilisateurs et rôles</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-primary-foreground text-primary font-bold">✓</span>
              <span>PDFs conformes aux mentions légales</span>
            </li>
          </ul>

          <div className="mt-6 opacity-95">
            {/* Illustrative placeholder - can replace with an SVG or image */}
            <div className="h-40 w-full rounded-lg bg-white/10 flex items-center justify-center text-white/80">Illustration</div>
          </div>
        </aside>

        {/* Right form panel */}
        <section className="flex items-center justify-center p-8 bg-card">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-semibold mb-2">Créer une organisation</h1>
            <p className="mb-6 text-sm text-muted-foreground">Créez votre organisation et le compte administrateur pour commencer.</p>
            <RegisterForm />
          </div>
        </section>
      </div>
    </main>
  );
}
