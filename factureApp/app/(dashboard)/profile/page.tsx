import ProfileForm from '@/components/auth/ProfileForm'

export default function ProfilePage() {
  return (
    <main className="flex-1 overflow-auto p-8">
      <div className="mx-auto w-full max-w-2xl rounded-3xl bg-white/90 p-8 shadow-lg ring-1 ring-black/5">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Mon profil</h1>
          <p className="mt-2 text-sm text-muted-foreground">Mettez à jour vos informations personnelles et changez votre mot de passe si nécessaire.</p>
        </div>
        <ProfileForm />
      </div>
    </main>
  )
}
