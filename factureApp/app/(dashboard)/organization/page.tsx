"use client"

import { useEffect, useState } from "react"
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
import { Building2, Upload, Save, AlertTriangle, Loader2 } from "lucide-react"
import axiosInstance from "@/lib/axiosInstance"
import { toast } from "@/hooks/use-toast"

export default function OrganizationPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData,setFormData] = useState<{
  name:    string
  email:   string
  phone:   string
  plan:    string
  plan_started_at: string
  plan_expires_at: string
  is_active: boolean
  adresse: string
  logo:    string | File  // ← accepte les deux
}>({
    name: '',
    email: '',
    phone: '',
    plan: '',
    plan_started_at: '',
    plan_expires_at: '',
    is_active: false,
    adresse: '',
    logo:''
  })

  const PLAN_INFO = {
    free: {
      price: '0€/mois',
      features: '3 factures/mois · 1 utilisateur',
    },
    pro: {
      price: '9€/mois',
      features: 'Factures illimitées · 3 utilisateurs · Relances auto',
    },
    business: {
      price: '25€/mois',
      features: 'Factures illimitées · Utilisateurs illimités · Support prioritaire',
    },
  } as const

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      
      const userRaw = localStorage.getItem('user')
      const user    = JSON.parse(userRaw || '{}')
      const orgId   = user.organization.id

      const form = new FormData()
      form.append('name', formData.name)
      form.append('email', formData.email)
      form.append('phone', formData.phone)
      form.append('plan', formData.plan)
      form.append('adresse', formData.adresse)

      // N'envoyer le logo que si c'est un nouveau fichier choisi
      if (formData.logo instanceof File) {
        form.append('logo', formData.logo)
      }

      form.append('_method', 'PUT')

      const res = await axiosInstance.post('/organizations/' + orgId, form,{
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (res.status !== 200) {
        setError(res.data?.message || 'Une erreur est survenue lors de la mise à jour de l\'organisation.')
        toast({
          variant: "destructive",
          title: "Erreur lors de la mise à jour de l'organisation",
          description: res.data?.message || 'Une erreur est survenue lors de la mise à jour de l\'organisation.',
        })
        setLoading(false)
        return;
      }

      // Mettre à jour le localStorage avec les nouvelles données
      user.organization = res.data.data
      localStorage.setItem('user', JSON.stringify(user))

      toast({
        title: "Organisation mise à jour",
        description: "Les informations de votre organisation ont été mises à jour avec succès.",
      })

    } catch (error) {
      setError('Une erreur est survenue lors de la mise à jour de l\'organisation.')
      toast({
        variant: "destructive",
        title: "Erreur lors de la mise à jour de l'organisation",
        description: 'Une erreur est survenue lors de la mise à jour de l\'organisation.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{
    const userRaw = localStorage.getItem('user')
    if (userRaw) {
      const user = JSON.parse(userRaw)
      const org  = user.organization
      console.log("Org loaded from localStorage:", org)

      setFormData({
        name:    org.name    ?? '',
        email:   org.email   ?? '',
        phone:   org.phone   ?? '',
        plan:    org.plan    ?? '',
        plan_started_at: org.plan_started_at ?? '',
        plan_expires_at: org.plan_expires_at ?? '-',
        is_active: org.is_active ?? false,
        adresse: org.adresse ?? '',
        logo:    org.logo    ?? '',
      })

    }
  },[])

  return (
    <>
      <Header title="Organisation" showNewInvoice={false} />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Organization Info */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations de l&apos;organisation
              </CardTitle>
              <CardDescription>
                Ces informations apparaîtront sur vos factures.
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
                    <Label htmlFor="orgPhone">Téléphone</Label>
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

                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    {/* Prévisualisation */}
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed bg-muted overflow-hidden">
                      {formData.logo ? (
                        <img
                          src={
                            formData.logo instanceof File
                              ? URL.createObjectURL(formData.logo)
                              : formData.logo
                          }
                          alt="Logo"
                          className="h-full w-full object-cover rounded-lg"
                        />
                      ) : (
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* ✅ type="button" pour ne pas soumettre le form */}
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() => document.getElementById('logo-input')?.click()}
                      >
                        <Upload className="h-4 w-4" />
                        Télécharger un logo
                      </Button>

                      {formData.logo && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="gap-2 text-destructive hover:text-destructive"
                          onClick={() => setFormData({ ...formData, logo: '' })}
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>

                    {/* Input caché */}
                    <input
                      id="logo-input"
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) setFormData({ ...formData, logo: file })
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Format recommandé : PNG ou SVG, 200x200px minimum
                  </p>
                </div>

                <Button type="submit" className="gap-2">
                  {loading ? 
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enregistrement...
                    </> : 
                    <>
                      <Save className="h-4 w-4" />
                      Enregistrer les modifications
                    </>
                  }
                  
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Current Plan */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Abonnement actuel</CardTitle>
              <CardDescription>
                Gérez votre abonnement et votre facturation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Plan {formData.plan} </span>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {formData.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formData.plan
                      ? `${PLAN_INFO[formData.plan as keyof typeof PLAN_INFO]?.price} — ${PLAN_INFO[formData.plan as keyof typeof PLAN_INFO]?.features}`
                      : 'Chargement...'
                    }
                  </p>
                </div>
                <Button variant="outline">Changer de plan</Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Prochain renouvellement : <span className="font-medium text-foreground">{formData.plan_expires_at}</span>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Zone de danger
              </CardTitle>
              <CardDescription>
                Actions irréversibles pour votre organisation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div>
                  <p className="font-medium text-foreground">Supprimer l&apos;organisation</p>
                  <p className="text-sm text-muted-foreground">
                    Cette action supprimera définitivement toutes vos données.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Supprimer</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Cela supprimera définitivement votre
                        organisation et toutes les données associées (factures, clients, membres).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Supprimer définitivement
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
