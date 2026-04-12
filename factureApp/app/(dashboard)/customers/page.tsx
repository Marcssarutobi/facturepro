"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search, Mail, Phone, FileText, Edit, Loader, Trash2 } from "lucide-react"
import axiosInstance from "@/lib/axiosInstance"
import { toast } from "@/hooks/use-toast"
import { getApiErrorMessage } from "@/lib/utils"

type Customer = {
  id:              number
  fullname:        string
  email:           string | null
  phone:           string | null
  adresse:         string | null
  invoices_count:         number
  organization_id: number
  created_at:      string
  updated_at:      string
}




export default function CustomersPage() {
  const [customers,setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    adresse: '',
  })

  const openNewDialog = ()=>{
    setIsDialogOpen(true)
    setSelectedCustomer(null)
    setFormData({
      fullname: '',
      email: '',
      phone: '',
      adresse: '',
    })
  }

  const openEditDialog = (customer: Customer)=>{
    setSelectedCustomer(customer)
    setFormData({
      fullname: customer.fullname,
      email: customer.email || '',
      phone: customer.phone || '',
      adresse: customer.adresse || '',
    })
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (customer: Customer)=>{
    setSelectedCustomer(customer)
    setIsDeleteDialogOpen(true)
  }

  const handleAllCustomer = async ()=>{
    setFetching(true) 
    try {
      const res = await axiosInstance.get('/customers')
      if(res.status === 200){
        setCustomers(res.data.data)
      }
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Chargement impossible",
        description: getApiErrorMessage(error, "Impossible de charger les clients."),
      })
    }finally {
      setFetching(false)  // ← ajouter
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axiosInstance.post('/customers', formData)
      if (res.status === 201) {
        setCustomers((prev) => [...prev, res.data.data])
        setIsDialogOpen(false)
        setFormData({
          fullname: '',
          email: '',
          phone: '',
          adresse: '',
        })
        handleAllCustomer()
        toast({
          title: "Client ajouté",
          description: "Le client a bien été enregistré.",
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Ajout impossible",
        description: getApiErrorMessage(error, "Impossible d'ajouter le client."),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return

    setLoading(true)
    try {
      const res = await axiosInstance.put(`/customers/${selectedCustomer.id}`, formData)
      if (res.status === 200) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === selectedCustomer.id ? res.data.data : c))
        )
        setIsDialogOpen(false)
        setSelectedCustomer(null)
        setFormData({
          fullname: '',
          email: '',
          phone: '',
          adresse: '',
        })
        await handleAllCustomer()
        toast({
          title: "Client mis à jour",
          description: "Les informations du client ont été enregistrées.",
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Mise à jour impossible",
        description: getApiErrorMessage(error, "Impossible de modifier le client."),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCustomer) return
    setLoading(true)
    try {
      const res = await axiosInstance.delete(`/customers/${selectedCustomer.id}`)
      if (res.status === 200) {
        setCustomers((prev) => prev.filter((c) => c.id !== selectedCustomer.id))
        setIsDeleteDialogOpen(false)
        setSelectedCustomer(null)
        toast({
          title: "Client supprimé",
          description: "Le client a bien été retiré.",
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Suppression impossible",
        description: getApiErrorMessage(error, "Impossible de supprimer le client."),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{
    handleAllCustomer()
  },[])

  function getInitials(fullname: string): string {
    return fullname
      .split(' ')           // ["Admin", "Admin"]
      .map(n => n[0])       // ["A", "A"]
      .join('')             // "AA"
      .toUpperCase()        // "AA"
      .slice(0, 2)          // max 2 lettres
  }

  // Filter customers
  const filteredCustomers = customers.filter((customer) => {
    const searchLower = search.toLowerCase()

    return (
      customer.fullname.toLowerCase().includes(searchLower) ||
      (customer.email?.toLowerCase() ?? '').includes(searchLower) ||
      (customer.phone ?? '').includes(searchLower) ||
      (customer.adresse?.toLowerCase() ?? '').includes(searchLower)
    )
  })

  return (
    <>
      <Header title="Clients" showNewInvoice={false} />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* Header Actions */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={openNewDialog}>
                <Plus className="h-4 w-4" />
                Ajouter un client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedCustomer ? 'Modifier' : 'Nouveau'} client</DialogTitle>
                <DialogDescription>
                  {selectedCustomer ? 'Modifiez les informations du client.' : 'Ajoutez un nouveau client à votre carnet d&apos;adresses.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={selectedCustomer ? handleUpdate : handleSubmit} className="grid w-full gap-6 py-4">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nom / Entreprise</Label>
                    <Input id="name" value={formData.fullname} onChange={(e) => setFormData({ ...formData, fullname: e.target.value })} placeholder="Nom du client ou de l'entreprise" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@exemple.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+221 77 123 45 67" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input id="address" value={formData.adresse} onChange={(e) => setFormData({ ...formData, adresse: e.target.value })} placeholder="Ville, Pays" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading || !formData.fullname || !formData.email || !formData.phone || !formData.adresse} className="gap-2">
                    {loading ? 
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Ajout en cours...
                      </> 
                    : 
                      selectedCustomer ? 'Enregistrer les modifications' : 'Ajouter le client'
                    }
                    
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog confirmation suppression */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Supprimer le client
                </DialogTitle>
                <DialogDescription>
                  Vous êtes sur le point de supprimer{" "}
                  <span className="font-semibold text-foreground">
                    {selectedCustomer?.fullname}
                  </span>
                  . Cette action est irréversible et supprimera également toutes ses factures.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDeleteDialogOpen(false)
                    setSelectedCustomer(null)
                  }}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={loading}
                  onClick={handleDelete}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Supprimer définitivement
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>

        {/* Customers Grid */}
        {fetching ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Chargement des clients...</p>
            </div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">Aucun client trouvé</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="border-border/50 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 items-center flex-shrink-0 justify-center rounded-full bg-primary/70 text-primary font-medium `}
                    >
                      <span className="text-lg font-semibold text-white">
                        {getInitials(customer.fullname)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate text-base">{customer.fullname}</CardTitle>
                      <CardDescription className="line-clamp-2">{customer.adresse}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span>{customer.invoices_count ?? 0} facture{customer.invoices_count > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => openEditDialog(customer)}>
                      <Edit className="h-3.5 w-3.5" />
                      Modifier
                    </Button>
                    <Button variant="destructive" size="sm" className="flex-1 gap-1.5" onClick={() => openDeleteDialog(customer)}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
