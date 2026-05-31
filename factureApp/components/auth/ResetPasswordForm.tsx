"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import axiosInstance from "@/lib/axiosInstance"
import { toast } from "@/hooks/use-toast"
import { getApiErrorMessage } from "@/lib/utils"

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError("")

    if (!email || !code || !password || !passwordConfirm) {
      const message = "Tous les champs sont requis."
      setError(message)
      toast({ variant: "destructive", title: "Formulaire incomplet", description: message })
      return
    }

    if (password !== passwordConfirm) {
      const message = "Les mots de passe ne correspondent pas."
      setError(message)
      toast({ variant: "destructive", title: "Erreur", description: message })
      return
    }

    setLoading(true)

    try {
      const res = await axiosInstance.post('/password/reset', {
        email,
        code,
        password,
        password_confirmation: passwordConfirm,
      })

      toast({ title: 'Mot de passe mis à jour', description: res.data.message })
      router.push('/login')
    } catch (err: any) {
      const message = getApiErrorMessage(err, 'Impossible de réinitialiser le mot de passe.')
      setError(message)
      toast({ variant: 'destructive', title: 'Erreur', description: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div role="alert" className="text-sm text-destructive">{error}</div>}

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="admin@exemple.com"
          required
        />
      </div>

      <div>
        <label htmlFor="code" className="block text-sm font-medium mb-1">Code de vérification</label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Ex: 1A2B3C"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Nouveau mot de passe"
          required
        />
      </div>

      <div>
        <label htmlFor="passwordConfirm" className="block text-sm font-medium mb-1">Confirmer le mot de passe</label>
        <input
          id="passwordConfirm"
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Confirmer le nouveau mot de passe"
          required
        />
      </div>

      <div>
        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Validation...' : 'Réinitialiser le mot de passe'}
        </button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Vous avez déjà un compte ? <a href="/login" className="text-primary underline">Se connecter</a>
      </div>
    </form>
  )
}
