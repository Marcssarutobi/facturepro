"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import axiosInstance from "@/lib/axiosInstance"
import { toast } from "@/hooks/use-toast"
import { getApiErrorMessage } from "@/lib/utils"
import Script from "next/script";

type Step = 'registration' | 'payment'

const PLAN_PRICES: Record<string, number> = {
  free:     0,
  pro:      5000,
  business: 12000,
}

const MONTH_OPTIONS = [
  { value: 1,  label: '1 mois' },
  { value: 3,  label: '3 mois' },
  { value: 6,  label: '6 mois' },
  { value: 9,  label: '9 mois' },
  { value: 12, label: '12 mois' },
]

export default function RegisterForm() {
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")
  const [step, setStep]         = useState<Step>('registration')
  const router                  = useRouter()
  const searchParams            = useSearchParams()

  const [formData, setFormData] = useState({
    name:    "",
    email:   "",
    phone:   "",
    plan:    "free",
    adresse: "",
    country: "",
  })

  const [paymentData, setPaymentData] = useState({
    firstname: "",
    lastname:  "",
    phone:     "",
    months:    1,
  })

  // Prix total calculé
  const unitPrice  = PLAN_PRICES[formData.plan] ?? 0
  const totalPrice = unitPrice * paymentData.months

  useEffect(() => {
    const planFromUrl = searchParams.get("plan")
    const validPlans  = ["free", "pro", "business"]
    if (planFromUrl && validPlans.includes(planFromUrl)) {
      setFormData((prev) => ({ ...prev, plan: planFromUrl }))
    }
  }, [searchParams])

  // ── Étape 1 : Soumettre le formulaire d'inscription ──────────
  async function handleRegistrationSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError("")

    if (!formData.name || !formData.email || !formData.phone || !formData.adresse || !formData.country) {
      const message = "Tous les champs sont requis."
      setError(message)
      toast({ variant: "destructive", title: "Formulaire incomplet", description: message })
      return
    }

    // Plan free → créer directement
    if (formData.plan === 'free') {
      await createOrganization()
      return
    }

    // Plan payant → passer à l'étape paiement
    setStep('payment')
    // Pré-remplir le téléphone avec celui de l'organisation
    setPaymentData(prev => ({ ...prev, phone: formData.phone }))
  }

  // ── Étape 2 : Soumettre le paiement FedaPay ──────────────────
  async function handlePaymentSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError("")

    if (!paymentData.firstname || !paymentData.lastname || !paymentData.phone) {
      setError("Tous les champs de paiement sont requis.")
      return
    }

    setLoading(true)

    try {
      // ── Ouvrir le Checkout FedaPay directement ────────────────
      // @ts-ignore
      const handler = window.FedaPay.init({
        public_key: process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY,
        transaction: {
          amount:      totalPrice,
          description: `Abonnement FacturaPro Plan ${formData.plan} — ${paymentData.months} mois`,
        },
        customer: {
          firstname: paymentData.firstname,
          lastname:  paymentData.lastname,
          email:     formData.email,
          phone_number: {
            number:  paymentData.phone,
            country: 'BJ',
          },
        },

        onComplete: async (response: {
          reason:      string
          transaction: { id: number; status: string }
        }) => {

          // Client a fermé sans payer
          // @ts-ignore
          if (response.reason === window.FedaPay.DIALOG_DISMISSED) {
            setError("Paiement annulé.")
            setLoading(false)
            return
          }

          // ── Vérifier le paiement côté Laravel ─────────────────
          try {
            const verif = await axiosInstance.post('/verifier-paiement', {
              transaction_id: response.transaction.id,
              firstname:      paymentData.firstname,
              lastname:       paymentData.lastname,
              phone:          paymentData.phone,
              amount:         totalPrice,
              months:         paymentData.months,
              plan:           formData.plan,
              org_name:       formData.name,
              org_email:      formData.email,
              org_phone:      formData.phone,
            })

            if (verif.status === 200) {
              // ── Créer l'organisation après paiement validé ─────
              await createOrganization()
            }

          } catch (err: any) {
            const message = getApiErrorMessage(err, "Erreur lors de la vérification")
            setError(message)
            toast({
              variant:     "destructive",
              title:       "Erreur de vérification",
              description: message,
            })
          } finally {
            setLoading(false)
          }
        },
      })

      // ── Ouvrir la popup ───────────────────────────────────────
      handler.open()

    } catch (error) {
      const message = getApiErrorMessage(error, "Erreur lors de l'ouverture du paiement")
      setError(message)
      toast({
        variant:     "destructive",
        title:       "Paiement impossible",
        description: message,
      })
      setLoading(false)
    }
  }

  // ── Créer l'organisation (plan free) ─────────────────────────
  async function createOrganization() {
    setLoading(true)
    try {
      const res = await axiosInstance.post("/organizations", {
        ...formData,
        months: paymentData.months
      })
      if (res.status === 201) {
        toast({
          title: "Organisation créée",
          description: `Mot de passe temporaire : ${res.data?.data?.admin?.password ?? "Admin@123"}`,
        })
        router.push("/login")
      }
    } catch (error) {
      const message = getApiErrorMessage(error, "Erreur réseau")
      setError(message)
      toast({ variant: "destructive", title: "Inscription impossible", description: message })
    } finally {
      setLoading(false)
    }
  }

  // ── Rendu étape 1 : Formulaire d'inscription ─────────────────
  if (step === 'registration') {
    return (
      <form onSubmit={handleRegistrationSubmit} className="space-y-6">
        {error && <div role="alert" className="text-sm text-destructive">{error}</div>}

        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nom de l&apos;organisation</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Acme SARL"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">Ce nom sera visible par vos collaborateurs.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Email de contact"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Téléphone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Téléphone de contact"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Pays</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Pays de l'organisation"
              required
            />
             <p className="mt-1 text-xs text-muted-foreground">Veuillez entrer le pays où votre organisation est basée.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Adresse</label>
            <input
              type="text"
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Adresse"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">Veuillez entrer l&apos;adresse de votre organisation.</p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full rounded-md bg-primary py-2 font-medium text-primary-foreground disabled:opacity-60"
            disabled={loading}
          >
            {loading
              ? "Création..."
              : formData.plan === 'free'
                ? "Créer l'organisation"
                : "Continuer vers le paiement →"
            }
          </button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Vous avez déjà une organisation ?{" "}
          <a href="/login" className="text-primary underline">Se connecter</a>
        </div>
      </form>
    )
  }

  // ── Rendu étape 2 : Formulaire de paiement ───────────────────
  return (
    <form onSubmit={handlePaymentSubmit} className="space-y-6">

      {/* Résumé du plan */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium capitalize">Plan {formData.plan}</p>
            <p className="text-sm text-muted-foreground">{unitPrice.toLocaleString('fr-FR')} FCFA / mois</p>
          </div>
          <button
            type="button"
            onClick={() => setStep('registration')}
            className="text-xs text-primary underline"
          >
            Modifier
          </button>
        </div>
      </div>

      {error && <div role="alert" className="text-sm text-destructive">{error}</div>}

      <div className="grid gap-4">

        {/* Durée de l'abonnement */}
        <div>
          <label className="mb-1 block text-sm font-medium">Durée de l&apos;abonnement</label>
          <select
            value={paymentData.months}
            onChange={(e) => setPaymentData({ ...paymentData, months: parseInt(e.target.value) })}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            {MONTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} — {(unitPrice * option.value).toLocaleString('fr-FR')} FCFA
              </option>
            ))}
          </select>
        </div>

        {/* Prénom */}
        <div>
          <label className="mb-1 block text-sm font-medium">Prénom</label>
          <input
            type="text"
            value={paymentData.firstname}
            onChange={(e) => setPaymentData({ ...paymentData, firstname: e.target.value })}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Votre prénom"
            required
          />
        </div>

        {/* Nom */}
        <div>
          <label className="mb-1 block text-sm font-medium">Nom</label>
          <input
            type="text"
            value={paymentData.lastname}
            onChange={(e) => setPaymentData({ ...paymentData, lastname: e.target.value })}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Votre nom"
            required
          />
        </div>

        {/* Téléphone mobile money */}
        <div>
          <label className="mb-1 block text-sm font-medium">Numéro Mobile Money / Carte</label>
          <input
            type="tel"
            value={paymentData.phone}
            onChange={(e) => setPaymentData({ ...paymentData, phone: e.target.value })}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="+229 XXXXXXXX"
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">
            MTN, Moov, ou numéro lié à votre carte bancaire.
          </p>
        </div>
      </div>

      {/* Total à payer */}
      <div className="rounded-lg bg-muted p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {unitPrice.toLocaleString('fr-FR')} FCFA × {paymentData.months} mois
          </span>
          <span className="text-xl font-bold text-primary">
            {totalPrice.toLocaleString('fr-FR')} FCFA
          </span>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="w-full rounded-md bg-primary py-2 font-medium text-primary-foreground disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Redirection vers FedaPay..." : `Payer ${totalPrice.toLocaleString('fr-FR')} FCFA`}
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Paiement sécurisé via FedaPay — Carte bancaire &amp; Mobile Money acceptés
      </p>
    </form>
  )
}