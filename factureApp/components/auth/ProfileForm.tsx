"use client"

import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"
import axiosInstance from "@/lib/axiosInstance"
import { getApiErrorMessage } from "@/lib/utils"

type FormState = {
  fullname: string
  email: string
  password: string
  passwordConfirm: string
}

export default function ProfileForm() {
  const [form, setForm] = useState<FormState>({
    fullname: "",
    email: "",
    password: "",
    passwordConfirm: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const userRaw = localStorage.getItem("user")
    if (!userRaw) return

    try {
      const user = JSON.parse(userRaw)
      setForm((prev) => ({
        ...prev,
        fullname: user.fullname ?? "",
        email: user.email ?? "",
      }))
    } catch {
      // ignore invalid stored user
    }
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError("")

    if (!form.fullname || !form.email) {
      const message = "Le nom complet et l'email sont requis."
      setError(message)
      toast({ variant: "destructive", title: "Formulaire incomplet", description: message })
      return
    }

    if (form.password && form.password !== form.passwordConfirm) {
      const message = "Les mots de passe ne correspondent pas."
      setError(message)
      toast({ variant: "destructive", title: "Erreur", description: message })
      return
    }

    setLoading(true)

    try {
      const payload: Record<string, string> = {
        fullname: form.fullname,
        email: form.email,
      }

      if (form.password) {
        payload.password = form.password
        payload.password_confirmation = form.passwordConfirm
      }

      const res = await axiosInstance.put('/profile', payload)
      toast({ title: 'Profil mis à jour', description: res.data.message })

      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const user = JSON.parse(storedUser)
        localStorage.setItem('user', JSON.stringify({ ...user, fullname: form.fullname, email: form.email }))
      }

      setForm((prev) => ({ ...prev, password: '', passwordConfirm: '' }))
    } catch (err: any) {
      const message = getApiErrorMessage(err, 'Impossible de mettre à jour le profil.')
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
        <label htmlFor="fullname" className="block text-sm font-medium mb-1">Nom complet</label>
        <input
          id="fullname"
          type="text"
          value={form.fullname}
          onChange={(e) => setForm({ ...form, fullname: e.target.value })}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Votre nom"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="admin@exemple.com"
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
          <span className="text-xs text-muted-foreground">optionnel</span>
        </div>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Laissez vide pour conserver le mot de passe actuel"
        />
      </div>

      <div>
        <label htmlFor="passwordConfirm" className="block text-sm font-medium mb-1">Confirmer le mot de passe</label>
        <input
          id="passwordConfirm"
          type="password"
          value={form.passwordConfirm}
          onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Confirmation du mot de passe"
        />
      </div>

      <div>
        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Mise à jour...' : 'Mettre à jour mon profil'}
        </button>
      </div>
    </form>
  )
}
