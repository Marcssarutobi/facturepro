"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import axiosInstance from "@/lib/axiosInstance"
import { toast } from "@/hooks/use-toast"
import { getApiErrorMessage } from "@/lib/utils"

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError("")

    if (!email) {
      const message = "Veuillez entrer votre adresse e-mail."
      setError(message)
      toast({ variant: "destructive", title: "Email requis", description: message })
      return
    }

    setLoading(true)

    try {
      const res = await axiosInstance.post('/password/forgot', { email })
      toast({ title: 'Code envoyé', description: res.data.message })
      router.push('/reset-password')
    } catch (err: any) {
      const message = getApiErrorMessage(err, 'Impossible d\'envoyer le code de réinitialisation.')
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
        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Envoi en cours...' : 'Recevoir le code'}
        </button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Vous avez déjà le code ? <a href="/reset-password" className="text-primary underline">Réinitialiser mon mot de passe</a>
      </div>
    </form>
  )
}
