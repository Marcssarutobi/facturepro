"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, Upload, Save, AlertTriangle, Loader2, Lock, CreditCard } from "lucide-react"
import axiosInstance from "@/lib/axiosInstance"
import { toast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { getApiErrorMessage } from "@/lib/utils"

type PlanKey = "free" | "pro" | "business"
type PaidPlanKey = "pro" | "business"
type MonthValue = 1 | 3 | 6 | 9 | 12
type PlanProcessingStep = "" | "verification" | "activation"

type OrganizationFormData = {
  name: string
  email: string
  phone: string
  plan: PlanKey | ""
  plan_started_at: string
  plan_expires_at: string
  is_active: boolean
  adresse: string
  logo: string | File
  ifu: string
  emcef_token: string
  emcef_nim: string
  emcef_active: boolean
}

type PaymentFormData = {
  firstname: string
  lastname: string
  phone: string
  plan: PaidPlanKey
  months: MonthValue
}

type StoredUser = {
  fullname?: string
  organization?: Partial<OrganizationFormData> & Record<string, unknown>
}

type FedaPayResponse = {
  reason: string
  transaction: {
    id: number
    status: string
  }
}

type FedaPayHandler = {
  open: () => void
}

type FedaPayConfig = {
  public_key?: string
  transaction: {
    amount: number
    description: string
  }
  customer: {
    firstname: string
    lastname: string
    email: string
    phone_number: {
      number: string
      country: string
    }
  }
  onComplete: (response: FedaPayResponse) => Promise<void>
}

declare global {
  interface Window {
    FedaPay: {
      init: (config: FedaPayConfig) => FedaPayHandler
      DIALOG_DISMISSED: string
    }
  }
}

const PLAN_INFO: Record<
  PlanKey,
  {
    label: string
    price: string
    unitPrice: number
    features: string
  }
> = {
  free: {
    label: "Free",
    price: "0 FCFA/mois",
    unitPrice: 0,
    features: "3 factures/mois - 1 utilisateur",
  },
  pro: {
    label: "Pro",
    price: "5 000 FCFA/mois",
    unitPrice: 5000,
    features: "Factures illimitees - 5 utilisateurs - Relances auto",
  },
  business: {
    label: "Business",
    price: "12 000 FCFA/mois",
    unitPrice: 12000,
    features: "Factures illimitees - Utilisateurs illimites - Support prioritaire",
  },
}

const MONTH_OPTIONS: Array<{ value: MonthValue; label: string }> = [
  { value: 1, label: "1 mois" },
  { value: 3, label: "3 mois" },
  { value: 6, label: "6 mois" },
  { value: 9, label: "9 mois" },
  { value: 12, label: "12 mois" },
]

const INITIAL_FORM_DATA: OrganizationFormData = {
  name: "",
  email: "",
  phone: "",
  plan: "",
  plan_started_at: "",
  plan_expires_at: "",
  is_active: false,
  adresse: "",
  logo: "",
  ifu: "",
  emcef_token: "",
  emcef_nim: "",
  emcef_active: false,
}

const INITIAL_PAYMENT_DATA: PaymentFormData = {
  firstname: "",
  lastname: "",
  phone: "",
  plan: "pro",
  months: 1,
}

function getValidDate(value: string) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function formatDate(value: string) {
  const date = getValidDate(value)

  if (!date) {
    return "Non definie"
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function formatPlanLabel(plan: string) {
  if (!plan) {
    return "Sans plan"
  }

  return PLAN_INFO[plan as PlanKey]?.label ?? plan
}

function getStoredUser() {
  if (typeof window === "undefined") {
    return null
  }

  const userRaw = localStorage.getItem("user")
  if (!userRaw) {
    return null
  }

  try {
    return JSON.parse(userRaw) as StoredUser & Record<string, unknown>
  } catch {
    return null
  }
}

export default function OrganizationPage() {
  const router = useRouter()
  const [organizationLoading, setOrganizationLoading] = useState(false)
  const [emcefLoading, setEmcefLoading] = useState(false)
  const [planChangeLoading, setPlanChangeLoading] = useState(false)
  const [organizationDeleteLoading, setOrganizationDeleteLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [planProcessingStep, setPlanProcessingStep] = useState<PlanProcessingStep>("")
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [planConfirmOpen, setPlanConfirmOpen] = useState(false)
  const [planChangeError, setPlanChangeError] = useState("")
  const [formData, setFormData] = useState<OrganizationFormData>(INITIAL_FORM_DATA)
  const [paymentData, setPaymentData] = useState<PaymentFormData>(INITIAL_PAYMENT_DATA)

  const currentPlanInfo =
    formData.plan && formData.plan in PLAN_INFO
      ? PLAN_INFO[formData.plan as PlanKey]
      : null

  const currentExpiryDate = getValidDate(formData.plan_expires_at)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const hasActiveSubscription = Boolean(currentExpiryDate && currentExpiryDate >= today)
  const isExpired = Boolean(currentExpiryDate && currentExpiryDate < today)
  const selectedPlanInfo = PLAN_INFO[paymentData.plan]
  const totalPlanAmount = selectedPlanInfo.unitPrice * paymentData.months
  const planProcessingMessage =
    planProcessingStep === "verification"
      ? "Verification du paiement en cours..."
      : planProcessingStep === "activation"
        ? "Activation du nouveau plan..."
        : ""

  const deleteProcessingMessage = "Suppression de l'organisation en cours..."

  const syncOrganizationState = (organization: Partial<OrganizationFormData>) => {
    setFormData((prev) => ({
      ...prev,
      name: organization.name ?? prev.name,
      email: organization.email ?? prev.email,
      phone: organization.phone ?? prev.phone,
      plan: organization.plan ?? prev.plan,
      plan_started_at: organization.plan_started_at ?? prev.plan_started_at,
      plan_expires_at: organization.plan_expires_at ?? "",
      is_active: organization.is_active ?? prev.is_active,
      adresse: organization.adresse ?? prev.adresse,
      logo: organization.logo !== undefined ? organization.logo : prev.logo,
      ifu: organization.ifu ?? prev.ifu,
      emcef_token: organization.emcef_token ?? prev.emcef_token,
      emcef_nim: organization.emcef_nim ?? prev.emcef_nim,
      emcef_active: organization.emcef_active ?? prev.emcef_active,
    }))
  }

  const syncOrganizationStorage = (organization: Record<string, unknown>) => {
    const user = getStoredUser()
    if (!user) {
      return
    }

    user.organization = {
      ...(user.organization ?? {}),
      ...organization,
    }

    localStorage.setItem("user", JSON.stringify(user))
  }

  const openPlanModal = () => {
    const storedUser = getStoredUser()
    const fullname = (storedUser?.fullname ?? "").trim()
    const parts = fullname.split(" ").filter(Boolean)
    const firstname = parts[0] ?? paymentData.firstname
    const lastname = parts.slice(1).join(" ") || paymentData.lastname

    setPlanChangeError("")
    setPaymentData((prev) => ({
      ...prev,
      firstname,
      lastname,
      phone: formData.phone || prev.phone,
      plan: formData.plan === "business" ? "business" : "pro",
    }))
    setPlanModalOpen(true)
  }

  const handlePlanButtonClick = () => {
    if (hasActiveSubscription) {
      setPlanConfirmOpen(true)
      return
    }

    openPlanModal()
  }

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setOrganizationLoading(true)

    try {
      const user = getStoredUser()
      const orgId = user?.organization?.id

      if (!orgId) {
        throw new Error("Organisation introuvable.")
      }

      const form = new FormData()
      form.append("name", formData.name)
      form.append("email", formData.email)
      form.append("phone", formData.phone)
      form.append("adresse", formData.adresse)

      if (formData.logo instanceof File) {
        form.append("logo", formData.logo)
      }

      form.append("_method", "PUT")

      const res = await axiosInstance.post(`/organizations/${orgId}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      if (res.status !== 200) {
        throw new Error(
          res.data?.message ||
            "Une erreur est survenue lors de la mise a jour de l'organisation."
        )
      }

      const updatedOrganization = res.data?.data ?? {}
      syncOrganizationState(updatedOrganization)
      syncOrganizationStorage(updatedOrganization)

      toast({
        title: "Organisation mise a jour",
        description: "Les informations de votre organisation ont ete mises a jour avec succes.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de mise a jour",
        description: getApiErrorMessage(
          error,
          "Une erreur est survenue lors de la mise a jour de l'organisation."
        ),
      })
    } finally {
      setOrganizationLoading(false)
    }
  }

  const handleUpdateEmcef = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmcefLoading(true)

    try {
      const res = await axiosInstance.put("/organizations/emcef", {
        ifu: formData.ifu,
        emcef_token: formData.emcef_token,
        emcef_nim: formData.emcef_nim,
        emcef_active: formData.emcef_active,
      })

      if (res.status !== 200) {
        throw new Error(
          res.data?.message ||
            "Une erreur est survenue lors de la mise a jour des informations EMCEF."
        )
      }

      toast({
        title: "EMCEF mis a jour",
        description: "Les informations EMCEF ont ete mises a jour avec succes.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur EMCEF",
        description: getApiErrorMessage(
          error,
          "Une erreur est survenue lors de la mise a jour des informations EMCEF."
        ),
      })
    } finally {
      setEmcefLoading(false)
    }
  }

  const handleDeleteOrganization = async () => {
    setOrganizationDeleteLoading(true)

    try {
      const user = getStoredUser()
      const orgId = user?.organization?.id

      if (!orgId) {
        throw new Error("Organisation introuvable.")
      }

      const res = await axiosInstance.delete(`/organizations/${orgId}`)

      if (res.status !== 200) {
        throw new Error(
          res.data?.message || "La suppression de l'organisation a echoue."
        )
      }

      localStorage.removeItem("token")
      localStorage.removeItem("user")
      setDeleteDialogOpen(false)
      router.replace("/login")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Suppression impossible",
        description: getApiErrorMessage(
          error,
          "La suppression de l'organisation a echoue."
        ),
      })
    } finally {
      setOrganizationDeleteLoading(false)
    }
  }

  const handlePlanChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPlanChangeError("")

    if (!paymentData.firstname || !paymentData.lastname || !paymentData.phone) {
      const message = "Tous les champs de paiement sont requis."
      setPlanChangeError(message)
      toast({
        variant: "destructive",
        title: "Paiement incomplet",
        description: message,
      })
      return
    }

    if (!window.FedaPay || !process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY) {
      const message = "FedaPay n'est pas disponible pour le moment."
      setPlanChangeError(message)
      toast({
        variant: "destructive",
        title: "Paiement indisponible",
        description: message,
      })
      return
    }

    setPlanChangeLoading(true)

    try {
      const handler = window.FedaPay.init({
        public_key: process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY,
        transaction: {
          amount: totalPlanAmount,
          description: `Changement de plan ${formatPlanLabel(paymentData.plan)} - ${paymentData.months} mois`,
        },
        customer: {
          firstname: paymentData.firstname,
          lastname: paymentData.lastname,
          email: formData.email,
          phone_number: {
            number: paymentData.phone,
            country: "BJ",
          },
        },
        onComplete: async (response) => {
          if (response.reason === window.FedaPay.DIALOG_DISMISSED) {
            const message = "Paiement annule."
            setPlanChangeError(message)
            setPlanProcessingStep("")
            setPlanModalOpen(true)
            toast({
              variant: "destructive",
              title: "Paiement annule",
              description: message,
            })
            setPlanChangeLoading(false)
            return
          }

          try {
            setPlanProcessingStep("verification")

            const verif = await axiosInstance.post("/verifier-paiement", {
              transaction_id: response.transaction.id,
              firstname: paymentData.firstname,
              lastname: paymentData.lastname,
              phone: paymentData.phone,
              amount: totalPlanAmount,
              months: paymentData.months,
              plan: paymentData.plan,
              org_name: formData.name,
              org_email: formData.email,
              org_phone: formData.phone,
            })

            if (verif.status !== 200) {
              throw new Error("Le paiement n'a pas pu etre verifie.")
            }

            setPlanProcessingStep("activation")

            const res = await axiosInstance.post("/organizations/change-plan", {
              transaction_id: response.transaction.id,
              firstname: paymentData.firstname,
              lastname: paymentData.lastname,
              phone: paymentData.phone,
              amount: totalPlanAmount,
              months: paymentData.months,
              plan: paymentData.plan,
            })

            const updatedOrganization = res.data?.data ?? {}

            syncOrganizationState(updatedOrganization)
            syncOrganizationStorage(updatedOrganization)
            setPlanModalOpen(false)
            setPlanConfirmOpen(false)
            setPlanChangeError("")

            toast({
              title: "Plan mis a jour",
              description: `Votre plan ${formatPlanLabel(paymentData.plan)} est actif jusqu'au ${formatDate(
                String(updatedOrganization.plan_expires_at ?? "")
              )}.`,
            })
          } catch (error) {
            const message = getApiErrorMessage(
              error,
              "Erreur lors de la verification du paiement."
            )

            setPlanProcessingStep("")
            setPlanChangeError(message)
            toast({
              variant: "destructive",
              title: "Verification impossible",
              description: message,
            })
          } finally {
            setPlanProcessingStep("")
            setPlanChangeLoading(false)
          }
        },
      })

      setPlanModalOpen(false)
      setPlanConfirmOpen(false)

      window.setTimeout(() => {
        handler.open()
      }, 150)
    } catch (error) {
      const message = getApiErrorMessage(error, "Impossible d'ouvrir le checkout FedaPay.")
      setPlanProcessingStep("")
      setPlanChangeError(message)
      setPlanModalOpen(true)
      toast({
        variant: "destructive",
        title: "Paiement impossible",
        description: message,
      })
      setPlanChangeLoading(false)
    }
  }

  useEffect(() => {
    const user = getStoredUser()
    const org = user?.organization

    if (!org) {
      return
    }

    setFormData({
      name: org.name ?? "",
      email: org.email ?? "",
      phone: org.phone ?? "",
      plan: (org.plan as PlanKey | "") ?? "",
      plan_started_at: String(org.plan_started_at ?? ""),
      plan_expires_at: org.plan_expires_at ? String(org.plan_expires_at) : "",
      is_active: Boolean(org.is_active ?? false),
      adresse: org.adresse ?? "",
      logo: (org.logo as string) ?? "",
      ifu: org.ifu ?? "",
      emcef_token: org.emcef_token ?? "",
      emcef_nim: org.emcef_nim ?? "",
      emcef_active: Boolean(org.emcef_active ?? false),
    })

    const fullname = (user.fullname ?? "").trim()
    const parts = fullname.split(" ").filter(Boolean)

    setPaymentData((prev) => ({
      ...prev,
      firstname: parts[0] ?? prev.firstname,
      lastname: parts.slice(1).join(" ") || prev.lastname,
      phone: org.phone ?? prev.phone,
      plan: org.plan === "business" ? "business" : "pro",
    }))
  }, [])

  return (
    <>
      <Header title="Organisation" showNewInvoice={false} />

      {planProcessingStep ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg">
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{planProcessingMessage}</p>
                <p className="text-sm text-muted-foreground">
                  Patientez pendant que nous confirmons votre paiement et mettons a jour votre abonnement.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {organizationDeleteLoading ? (
        <div className="fixed inset-0 z-[121] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg">
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-destructive" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{deleteProcessingMessage}</p>
                <p className="text-sm text-muted-foreground">
                  Patientez pendant que nous supprimons votre organisation et toutes les donnees associees.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <AlertDialog open={planConfirmOpen} onOpenChange={setPlanConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le changement de plan</AlertDialogTitle>
            <AlertDialogDescription>
              Votre abonnement {formatPlanLabel(formData.plan)} reste actif jusqu&apos;au{" "}
              {formatDate(formData.plan_expires_at)}. Si vous continuez, le temps restant sera
              remplace par le nouveau plan choisi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={openPlanModal}>Oui, continuer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={planModalOpen}
        onOpenChange={(open) => {
          if (!planChangeLoading) {
            setPlanModalOpen(open)
          }
        }}
      >
        <DialogContent className="sm:max-w-xl" showCloseButton={!planChangeLoading}>
          <DialogHeader>
            <DialogTitle>Changer de plan</DialogTitle>
            <DialogDescription>
              Choisissez le nouveau plan, la duree de l&apos;abonnement et finalisez le paiement
              avec FedaPay.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePlanChangeSubmit} className="space-y-6">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plan actuel</p>
                  <p className="font-semibold">{formatPlanLabel(formData.plan)}</p>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {hasActiveSubscription ? "Actif" : isExpired ? "Expire" : "Sans abonnement"}
                </Badge>
              </div>
            </div>

            {planChangeError ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {planChangeError}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select
                  value={paymentData.plan}
                  onValueChange={(value) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      plan: value as PaidPlanKey,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir un plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pro">Pro - 5 000 FCFA / mois</SelectItem>
                    <SelectItem value="business">Business - 12 000 FCFA / mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duree</Label>
                <Select
                  value={String(paymentData.months)}
                  onValueChange={(value) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      months: Number(value) as MonthValue,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir une duree" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label} - {(selectedPlanInfo.unitPrice * option.value).toLocaleString("fr-FR")} FCFA
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="payerFirstname">Prenom</Label>
                <Input
                  id="payerFirstname"
                  value={paymentData.firstname}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      firstname: e.target.value,
                    }))
                  }
                  placeholder="Votre prenom"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payerLastname">Nom</Label>
                <Input
                  id="payerLastname"
                  value={paymentData.lastname}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      lastname: e.target.value,
                    }))
                  }
                  placeholder="Votre nom"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payerPhone">Numero Mobile Money / Carte</Label>
              <Input
                id="payerPhone"
                type="tel"
                value={paymentData.phone}
                onChange={(e) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="+229 XXXXXXXX"
              />
            </div>

            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{formatPlanLabel(paymentData.plan)}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlanInfo.price} x {paymentData.months} mois
                  </p>
                </div>
                <p className="text-xl font-bold text-primary">
                  {totalPlanAmount.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPlanModalOpen(false)}
                disabled={planChangeLoading}
              >
                Annuler
              </Button>
              <Button type="submit" className="gap-2" disabled={planChangeLoading}>
                {planChangeLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redirection vers FedaPay...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Payer {totalPlanAmount.toLocaleString("fr-FR")} FCFA
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations de l&apos;organisation
              </CardTitle>
              <CardDescription>
                Ces informations apparaitront sur vos factures.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleUpdateOrganization} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Nom de l&apos;entreprise</Label>
                    <Input
                      id="orgName"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgPhone">Telephone</Label>
                    <Input
                      id="orgPhone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgAddress">Adresse</Label>
                  <Input
                    id="orgAddress"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgEmail">Email professionnel</Label>
                  <Input
                    id="orgEmail"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-muted">
                      {formData.logo ? (
                        <img
                          src={
                            formData.logo instanceof File
                              ? URL.createObjectURL(formData.logo)
                              : formData.logo
                          }
                          alt="Logo"
                          className="h-full w-full rounded-lg object-cover"
                        />
                      ) : (
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() => document.getElementById("logo-input")?.click()}
                      >
                        <Upload className="h-4 w-4" />
                        Telecharger un logo
                      </Button>

                      {formData.logo ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="gap-2 text-destructive hover:text-destructive"
                          onClick={() => setFormData({ ...formData, logo: "" })}
                        >
                          Supprimer
                        </Button>
                      ) : null}
                    </div>

                    <input
                      id="logo-input"
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setFormData({ ...formData, logo: file })
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Format recommande : PNG ou SVG, 200x200px minimum
                  </p>
                </div>

                <Button type="submit" className="gap-2" disabled={organizationLoading}>
                  {organizationLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Informations supplementaires
              </CardTitle>
              <CardDescription>
                Ces informations sont necessaires pour l&apos;integration avec EMCEF.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleUpdateEmcef} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ifu">IFU</Label>
                    <Input
                      id="ifu"
                      value={formData.ifu}
                      onChange={(e) => setFormData({ ...formData, ifu: e.target.value })}
                      placeholder="Ex: 12345678901234"
                    />
                  </div>

                  <div>
                    <Label htmlFor="emcef_token">Token EMCEF</Label>
                    <Input
                      id="emcef_token"
                      type="password"
                      value={formData.emcef_token}
                      onChange={(e) => setFormData({ ...formData, emcef_token: e.target.value })}
                      placeholder="Token d'authentification pour EMCEF"
                    />
                  </div>

                  <div>
                    <Label htmlFor="emcef_nim">NIM EMCEF</Label>
                    <Input
                      id="emcef_nim"
                      value={formData.emcef_nim}
                      onChange={(e) => setFormData({ ...formData, emcef_nim: e.target.value })}
                      placeholder="Numero d'identification EMCEF"
                    />
                  </div>

                  <div>
                    <Label htmlFor="emcef_active">Actif EMCEF</Label>
                    <Switch
                      id="emcef_active"
                      className="mt-3 ml-5"
                      checked={formData.emcef_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, emcef_active: checked })
                      }
                    />
                  </div>
                </div>

                <Button type="submit" disabled={emcefLoading}>
                  {emcefLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Abonnement actuel</CardTitle>
              <CardDescription>Gerez votre abonnement et votre facturation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Plan {formatPlanLabel(formData.plan)}</span>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {formData.is_active ? "Actif" : "Inactif"}
                    </Badge>
                    {isExpired ? <Badge variant="destructive">Expire</Badge> : null}
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {currentPlanInfo
                      ? `${currentPlanInfo.price} - ${currentPlanInfo.features}`
                      : "Chargement..."}
                  </p>
                </div>

                <Button variant="outline" onClick={handlePlanButtonClick} disabled={planChangeLoading}>
                  Changer de plan
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                {currentExpiryDate ? (
                  <>
                    {isExpired ? "Abonnement expire le" : "Prochain renouvellement :"}{" "}
                    <span className="font-medium text-foreground">
                      {formatDate(formData.plan_expires_at)}
                    </span>
                  </>
                ) : (
                  <>
                    Aucune date d&apos;expiration definie. Cliquez sur{" "}
                    <span className="font-medium text-foreground">Changer de plan</span> pour
                    choisir un abonnement payant.
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Zone de danger
              </CardTitle>
              <CardDescription>Actions irreversibles pour votre organisation.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div>
                  <p className="font-medium text-foreground">Supprimer l&apos;organisation</p>
                  <p className="text-sm text-muted-foreground">
                    Cette action supprimera definitivement toutes vos donnees.
                  </p>
                </div>

                <AlertDialog
                  open={deleteDialogOpen}
                  onOpenChange={(open) => {
                    if (!organizationDeleteLoading) {
                      setDeleteDialogOpen(open)
                    }
                  }}
                >
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={organizationDeleteLoading}>
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Etes-vous absolument sur ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irreversible. Cela supprimera definitivement votre
                        organisation et toutes les donnees associees.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={organizationDeleteLoading}>
                        Annuler
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={organizationDeleteLoading}
                        onClick={(event) => {
                          event.preventDefault()
                          void handleDeleteOrganization()
                        }}
                      >
                        {organizationDeleteLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Suppression...
                          </>
                        ) : (
                          "Supprimer definitivement"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
