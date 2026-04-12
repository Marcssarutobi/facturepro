"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  FileText,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader,
  Check,
  X,
  Paperclip,
  Send,
} from "lucide-react"
import axiosInstance from "@/lib/axiosInstance"
import { toast } from "@/hooks/use-toast"

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled"

type Customer = {
  id: number
  fullname: string
  email: string | null
}

type Invoice = {
  id: number
  invoice_number: string
  status: InvoiceStatus
  due_at: string
  echeance_at: string
  total_ht: string
  total_ttc: string
  total_tva: string
  customer_id: number
  customer: Customer | null
  created_at: string
}

type InvoiceDetailItem = {
  id: number
  description: string
  quantity: number
  unit_price: string
  vat_rate: string
}

type InvoiceDetail = Invoice & {
  items: InvoiceDetailItem[]
  user?: {
    id: number
    fullname: string
    email: string
  } | null
  organization?: {
    id: number
    name: string
    email: string | null
    phone: string | null
    adresse: string | null
  } | null
}

type PaginatedResponse = {
  current_page: number
  data: Invoice[]
  last_page: number
  per_page: number
  total: number
  next_page_url: string | null
  prev_page_url: string | null
}

const formatCurrency = (amount: string | number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(Number(amount))

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

const formatPercent = (rate: string | number) => `${Number(rate) * 100}%`

const getStatusLabel = (status: InvoiceStatus) =>
  ({
    draft: "Brouillon",
    sent: "Envoyée",
    paid: "Payée",
    overdue: "En retard",
    cancelled: "Annulée",
  })[status]

const getStatusColor = (status: InvoiceStatus) =>
  ({
    draft: "bg-gray-100 text-gray-700",
    sent: "bg-blue-100 text-blue-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700",
    cancelled: "bg-orange-100 text-orange-700",
  })[status]

const statusOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "draft", label: "Brouillon" },
  { value: "sent", label: "Envoyée" },
  { value: "paid", label: "Payée" },
  { value: "overdue", label: "En retard" },
  { value: "cancelled", label: "Annulée" },
]

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [pagination, setPagination] = useState<Omit<PaginatedResponse, "data"> | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewError, setViewError] = useState("")
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSendDialogOpen, setIsSendDialogOpen]   = useState(false)
  const [sendMessage, setSendMessage]             = useState('')
  const [sendLoading, setSendLoading]             = useState(false)

  const fetchInvoices = async (page = 1) => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page }
      if (statusFilter !== "all") params.status = statusFilter
      if (search) params.search = search

      const res = await axiosInstance.get("/invoices", { params })
      if (res.status === 200) {
        const { data, ...paginationData } = res.data.data
        setInvoices(data)
        setPagination(paginationData)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices(currentPage)
  }, [currentPage, statusFilter])

  useEffect(() => {
    setCurrentPage(1)
    fetchInvoices(1)
  }, [search])

  const loadInvoiceDetails = async (invoiceId: number) => {
    setViewLoading(true)
    setViewError("")
    setSelectedInvoice(null)

    try {
      const res = await axiosInstance.get(`/invoices/${invoiceId}`)
      if (res.status === 200) {
        setSelectedInvoice(res.data.data)
      }
    } catch (error) {
      console.error(error)
      setViewError("Impossible de charger les détails de la facture.")
    } finally {
      setViewLoading(false)
    }
  }

  const handleOpenView = async (invoiceId: number) => {
    setIsViewDialogOpen(true)
    await loadInvoiceDetails(invoiceId)
  }

  const handleOpenPreview = async (invoiceId: number) => {
    setIsPreviewDialogOpen(true)
    await loadInvoiceDetails(invoiceId)
  }

  const handleEdit = (invoiceId: number) => {
    router.push(`/invoices/new?invoiceId=${invoiceId}`)
  }

  const handleUpdateStatus  = async (invoiceId:number, status:string)=>{
    try {
      const res = await axiosInstance.put(`/invoices/${invoiceId}/status`, { status })
      if (res.status === 200) {
        fetchInvoices(currentPage)
        
        toast({
          title: "Statut mis à jour",
          description: `La facture ${invoiceId} est maintenant ${status}.`,
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la facture.",
      })
    }
  }

  const handleDownloadPdf = async (invoiceId: number, fallbackName: string) => {
    setDownloadLoading(true)

    try {
      const res = await axiosInstance.get(`/invoices/${invoiceId}/pdf`, {
        responseType: "blob",
      })

      const blob = new Blob([res.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      const contentDisposition = res.headers["content-disposition"] as string | undefined
      const matchedName = contentDisposition?.match(/filename="?([^"]+)"?/)
      const fileName = matchedName?.[1] ?? `${fallbackName}.pdf`

      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      setViewError("Impossible de générer le PDF pour cette facture.")
    } finally {
      setDownloadLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!invoiceToDelete) return
    setDeleteLoading(true)
    try {
      const res = await axiosInstance.delete(`/invoices/${invoiceToDelete.id}`)
      if (res.status === 200) {
        setIsDeleteDialogOpen(false)
        setInvoiceToDelete(null)
        fetchInvoices(currentPage)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSendInvoice = async () => {
    if (!selectedInvoice) return
    setSendLoading(true)
    try {
      const res = await axiosInstance.post(`/invoices/${selectedInvoice.id}/send`, {
        message: sendMessage
      })
      if (res.data.success) {
        setIsSendDialogOpen(false)
        setSendMessage('')
        setSelectedInvoice(null)
        fetchInvoices(currentPage)
        toast({
          title: "Facture envoyée",
          description: res.data.message,
        })
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.response?.data?.message || "Erreur lors de l'envoi",
      })
    } finally {
      setSendLoading(false)
    }
  }

  return (
    <>
      <Header title="Factures" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro ou client..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as InvoiceStatus | "all")
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden sm:table-cell">Montant HT</TableHead>
                    <TableHead className="hidden md:table-cell">Montant TTC</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden lg:table-cell">Échéance</TableHead>
                    <TableHead className="w-[50px]">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <Loader className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Aucune facture trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {invoice.customer?.fullname ?? "—"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {formatCurrency(invoice.total_ht)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatCurrency(invoice.total_ttc)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getStatusColor(invoice.status)}>
                            {getStatusLabel(invoice.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {formatDate(invoice.echeance_at)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => handleOpenView(invoice.id)}
                              >
                                <Eye className="h-4 w-4" />
                                Voir
                              </DropdownMenuItem>
                              {invoice.status !== "paid" && (
                                <DropdownMenuItem className="gap-2" onClick={() => handleUpdateStatus(invoice.id, "paid")}>
                                  <Check className="h-4 w-4" />
                                  Marquer comme payée
                                </DropdownMenuItem>
                              )}
                              {invoice.status !== "overdue" && (
                                <DropdownMenuItem className="gap-2" onClick={() => handleUpdateStatus(invoice.id, "cancelled")}>
                                  <X className="h-4 w-4" />
                                  Marquer comme annulée
                                </DropdownMenuItem>
                              )}
                              {invoice.status !== "draft" && (
                                <DropdownMenuItem className="gap-2" onClick={() => handleUpdateStatus(invoice.id, "draft")}>
                                  <Paperclip className="h-4 w-4" />
                                  Marquer comme brouillon
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={async () => {
                                  await loadInvoiceDetails(invoice.id)
                                  setIsSendDialogOpen(true)
                                }}
                              >
                                <Send className="h-4 w-4" />
                                Envoyer par email
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => handleEdit(invoice.id)}
                              >
                                <Edit className="h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => handleOpenPreview(invoice.id)}
                              >
                                <FileText className="h-4 w-4" />
                                Preview PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 text-destructive focus:text-destructive"
                                onClick={() => {
                                  setInvoiceToDelete(invoice)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {pagination && pagination.last_page > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {pagination.total} facture{pagination.total > 1 ? "s" : ""} — page{" "}
                  {pagination.current_page} sur {pagination.last_page}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={!pagination.prev_page_url || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentPage} / {pagination.last_page}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(pagination.last_page, page + 1))
                    }
                    disabled={!pagination.next_page_url || loading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={isViewDialogOpen}
          onOpenChange={(open) => {
            setIsViewDialogOpen(open)
            if (!open) {
              setSelectedInvoice(null)
              setViewError("")
            }
          }}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {selectedInvoice
                  ? `Facture ${selectedInvoice.invoice_number}`
                  : "Détails de la facture"}
              </DialogTitle>
              <DialogDescription>
                Consultez le contenu complet de la facture sans quitter la liste.
              </DialogDescription>
            </DialogHeader>

            {viewLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : viewError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {viewError}
              </div>
            ) : selectedInvoice ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium text-foreground">Client</p>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">
                        {selectedInvoice.customer?.fullname ?? "—"}
                      </p>
                      <p>{selectedInvoice.customer?.email ?? "Email non renseigné"}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Statut</span>
                        <Badge variant="secondary" className={getStatusColor(selectedInvoice.status)}>
                          {getStatusLabel(selectedInvoice.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Date d'émission</span>
                        <span>{formatDate(selectedInvoice.due_at)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Échéance</span>
                        <span>{formatDate(selectedInvoice.echeance_at)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Créée le</span>
                        <span>{formatDate(selectedInvoice.created_at)}</span>
                      </div>
                      {selectedInvoice.user && (
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">Créée par</span>
                          <span>{selectedInvoice.user.fullname}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Qté</TableHead>
                        <TableHead>Prix unitaire</TableHead>
                        <TableHead>TVA</TableHead>
                        <TableHead className="text-right">Total HT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                            Aucune ligne sur cette facture
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedInvoice.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.description}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                            <TableCell>{formatPercent(item.vat_rate)}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.quantity * Number(item.unit_price))}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium text-foreground">Organisation</p>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">
                        {selectedInvoice.organization?.name ?? "Organisation"}
                      </p>
                      <p>{selectedInvoice.organization?.email ?? "Email non renseigné"}</p>
                      <p>{selectedInvoice.organization?.phone ?? "Téléphone non renseigné"}</p>
                      <p>{selectedInvoice.organization?.adresse ?? "Adresse non renseignée"}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Total HT</span>
                        <span className="font-medium">{formatCurrency(selectedInvoice.total_ht)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">TVA</span>
                        <span className="font-medium">{formatCurrency(selectedInvoice.total_tva)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-t pt-2">
                        <span className="font-semibold text-foreground">Total TTC</span>
                        <span className="text-base font-semibold text-primary">
                          {formatCurrency(selectedInvoice.total_ttc)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Fermer
              </Button>
              {selectedInvoice && (
                <Button
                  type="button"
                  className="gap-2"
                  onClick={() => {
                    setIsViewDialogOpen(false)
                    handleEdit(selectedInvoice.id)
                  }}
                >
                  <Edit className="h-4 w-4" />
                  Modifier la facture
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isPreviewDialogOpen}
          onOpenChange={(open) => {
            setIsPreviewDialogOpen(open)
            if (!open) {
              setSelectedInvoice(null)
              setViewError("")
            }
          }}
        >
          <DialogContent className="max-h-[92vh] overflow-y-auto bg-slate-100 p-0 sm:max-w-5xl">
            <div className="flex items-center justify-between border-b bg-white px-6 py-4">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {selectedInvoice
                    ? `Preview PDF - ${selectedInvoice.invoice_number}`
                    : "Preview PDF"}
                </DialogTitle>
                <DialogDescription>
                  Aperçu d&apos;une facture professionnelle prête à être exportée.
                </DialogDescription>
              </div>
              <Button
                type="button"
                className="gap-2"
                disabled={!selectedInvoice || viewLoading || downloadLoading}
                onClick={() =>
                  selectedInvoice &&
                  handleDownloadPdf(selectedInvoice.id, selectedInvoice.invoice_number)
                }
              >
                {downloadLoading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {downloadLoading ? "Génération..." : "Télécharger le PDF"}
              </Button>
            </div>

            <div className="p-6">
              {viewLoading ? (
                <div className="flex h-[60vh] items-center justify-center rounded-xl border border-dashed bg-white">
                  <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : viewError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {viewError}
                </div>
              ) : selectedInvoice ? (
                <div className="mx-auto max-w-4xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
                  <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-6 border-b border-slate-200 pb-8 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-4">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
                          F
                        </div>
                        <div>
                          <p className="text-2xl font-semibold tracking-tight text-slate-900">
                            {selectedInvoice.organization?.name ?? "FacturaPro"}
                          </p>
                          <div className="mt-2 space-y-1 text-sm text-slate-500">
                            <p>{selectedInvoice.organization?.adresse ?? "Adresse non renseignée"}</p>
                            <p>{selectedInvoice.organization?.email ?? "Email non renseigné"}</p>
                            <p>{selectedInvoice.organization?.phone ?? "Téléphone non renseigné"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 rounded-3xl bg-slate-950 px-6 py-5 text-white sm:min-w-[260px]">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Facture</p>
                          <p className="mt-2 text-2xl font-semibold">{selectedInvoice.invoice_number}</p>
                        </div>
                        <div className="grid gap-3 text-sm">
                          <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3">
                            <span className="text-slate-300">Statut</span>
                            <span>{getStatusLabel(selectedInvoice.status)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-300">Émise le</span>
                            <span>{formatDate(selectedInvoice.due_at)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-300">Échéance</span>
                            <span>{formatDate(selectedInvoice.echeance_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                          Facturée à
                        </p>
                        <div className="mt-3 space-y-1">
                          <p className="text-lg font-semibold text-slate-900">
                            {selectedInvoice.customer?.fullname ?? "Client"}
                          </p>
                          <p className="text-sm text-slate-500">
                            {selectedInvoice.customer?.email ?? "Email non renseigné"}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                          Préparée par
                        </p>
                        <div className="mt-3 space-y-1">
                          <p className="text-lg font-semibold text-slate-900">
                            {selectedInvoice.user?.fullname ?? "Équipe FacturaPro"}
                          </p>
                          <p className="text-sm text-slate-500">
                            {selectedInvoice.user?.email ?? "Email non renseigné"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-left text-xs uppercase tracking-[0.22em] text-slate-400">
                            <th className="px-6 py-4 font-semibold">Description</th>
                            <th className="px-6 py-4 font-semibold">Qté</th>
                            <th className="px-6 py-4 font-semibold">Prix</th>
                            <th className="px-6 py-4 font-semibold">TVA</th>
                            <th className="px-6 py-4 text-right font-semibold">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedInvoice.items.map((item) => (
                            <tr key={item.id} className="border-t border-slate-200">
                              <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                {item.description}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">{item.quantity}</td>
                              <td className="px-6 py-4 text-sm text-slate-600">
                                {formatCurrency(item.unit_price)}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">
                                {formatPercent(item.vat_rate)}
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                                {formatCurrency(item.quantity * Number(item.unit_price))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-col gap-6 border-t border-slate-200 pt-6 sm:flex-row sm:items-end sm:justify-between">
                      <div className="max-w-md rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                        <p className="font-semibold text-slate-900">Note</p>
                        <p className="mt-2">
                          Merci pour votre confiance. Cet aperçu correspond au rendu PDF
                          professionnel qui pourra être téléchargé ensuite.
                        </p>
                      </div>

                      <div className="w-full max-w-sm space-y-3 rounded-3xl bg-slate-950 px-6 py-5 text-white">
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-slate-300">Total HT</span>
                          <span>{formatCurrency(selectedInvoice.total_ht)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-slate-300">TVA</span>
                          <span>{formatCurrency(selectedInvoice.total_tva)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3 text-base font-semibold">
                          <span>Total TTC</span>
                          <span>{formatCurrency(selectedInvoice.total_ttc)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isSendDialogOpen} onOpenChange={(open) => {
          setIsSendDialogOpen(open)
          if (!open) {
            setSendMessage('')
            setSelectedInvoice(null)
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Envoyer la facture
              </DialogTitle>
              <DialogDescription>
                La facture{" "}
                <span className="font-semibold text-foreground">
                  {selectedInvoice?.invoice_number}
                </span>{" "}
                sera envoyée à{" "}
                <span className="font-semibold text-foreground">
                  {selectedInvoice?.customer?.fullname}
                </span>
                {selectedInvoice?.customer?.email && (
                  <> — <span className="text-primary">{selectedInvoice.customer.email}</span></>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4">
              <label className="text-sm font-medium">Message personnalisé</label>
              <textarea
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={4}
                placeholder={`Bonjour, veuillez trouver ci-joint votre facture ${selectedInvoice?.invoice_number}...`}
                value={sendMessage}
                onChange={(e) => setSendMessage(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsSendDialogOpen(false)
                  setSendMessage('')
                  setSelectedInvoice(null)
                }}
              >
                Annuler
              </Button>
              <Button
                type="button"
                className="gap-2"
                disabled={sendLoading || viewLoading || !sendMessage.trim()}
                onClick={handleSendInvoice}
              >
                {sendLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Envoyer la facture
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Supprimer la facture
              </DialogTitle>
              <DialogDescription>
                Vous êtes sur le point de supprimer la facture{" "}
                <span className="font-semibold text-foreground">
                  {invoiceToDelete?.invoice_number}
                </span>
                . Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setInvoiceToDelete(null)
                }}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteLoading}
                onClick={handleDelete}
                className="gap-2"
              >
                {deleteLoading ? (
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
      </main>
    </>
  )
}
