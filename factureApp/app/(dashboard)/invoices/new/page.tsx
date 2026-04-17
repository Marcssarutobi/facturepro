"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
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
import { Plus, Trash2, Save, Send, ArrowLeft, Loader2 } from "lucide-react"
import axiosInstance from "@/lib/axiosInstance"
import { toast } from "@/hooks/use-toast"

type Customer = {
  id: number
  fullname: string
  email: string | null
  phone: string | null
  adresse: string | null
  invoices_count: number
  organization_id: number
  created_at: string
  updated_at: string
}

type InvoiceItem = {
  id: string
  description: string
  quantity: number
  unit_price: number
  vat_rate: number
}

type InvoiceResponse = {
  id: number
  customer_id: number
  invoice_number: string
  due_at: string
  echeance_at: string
  items: Array<{
    id: number
    description: string
    quantity: number
    unit_price: string
    vat_rate: string
  }>
}

const defaultLine: InvoiceItem = {
  id: "",
  description: "",
  quantity: 1,
  unit_price: 0,
  vat_rate: 0.18,
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(amount)

const toDateInputValue = (value: string) => value.split("T")[0]

const toUnitPriceTTC = (unitPriceHT: number, vatRate: number) =>
  vatRate > 0 ? Math.round(unitPriceHT * (1 + vatRate)) : Math.round(unitPriceHT)

const getLineTotalTTC = (line: Pick<InvoiceItem, "quantity" | "unit_price">) =>
  Math.round(line.quantity * line.unit_price)

const getLineTotalHT = (line: Pick<InvoiceItem, "quantity" | "unit_price" | "vat_rate">) => {
  const lineTTC = getLineTotalTTC(line)

  return line.vat_rate > 0
    ? Math.round(lineTTC / (1 + line.vat_rate))
    : lineTTC
}

export default function NewInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invoiceId = searchParams.get("invoiceId")
  const isEditMode = Boolean(invoiceId)

  const [selectedClient, setSelectedClient] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [issueDate, setIssueDate] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [lines, setLines] = useState<InvoiceItem[]>([{ ...defaultLine, id: "1" }])
  const [loading, setLoading] = useState(false)
  const [loadingInvoice, setLoadingInvoice] = useState(isEditMode)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isEditMode) return

    const now = new Date()
    setIssueDate(now.toISOString().split("T")[0])
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
    setInvoiceNumber(
      `FAC-${now.getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`
    )
  }, [isEditMode])

  const handleAllCustomer = async () => {
    try {
      const res = await axiosInstance.get("/customers")
      if (res.status === 200) {
        setCustomers(res.data.data)
      }
    } catch (fetchError) {
      console.error(fetchError)
      setError("Impossible de charger les clients.")
    }
  }

  useEffect(() => {
    handleAllCustomer()
  }, [])

  useEffect(() => {
    if (!invoiceId) {
      setLoadingInvoice(false)
      return
    }

    const fetchInvoice = async () => {
      setLoadingInvoice(true)
      setError("")

      try {
        const res = await axiosInstance.get(`/invoices/${invoiceId}`)
        if (res.status === 200) {
          const invoice = res.data.data as InvoiceResponse

          setSelectedClient(String(invoice.customer_id))
          setInvoiceNumber(invoice.invoice_number)
          setIssueDate(toDateInputValue(invoice.due_at))
          setDueDate(toDateInputValue(invoice.echeance_at))
          setLines(
            invoice.items.length > 0
              ? invoice.items.map((item) => ({
                  id: String(item.id),
                  description: item.description,
                  quantity: item.quantity,
                  unit_price: toUnitPriceTTC(Number(item.unit_price), Number(item.vat_rate)),
                  vat_rate: Number(item.vat_rate),
                }))
              : [{ ...defaultLine, id: "1" }]
          )
        }
      } catch (fetchError: any) {
        console.error(fetchError)
        setError(fetchError.response?.data?.message || "Erreur lors du chargement de la facture.")
      } finally {
        setLoadingInvoice(false)
      }
    }

    fetchInvoice()
  }, [invoiceId])

  const addLine = () => {
    setLines((previous) => [
      ...previous,
      { ...defaultLine, id: Date.now().toString() },
    ])
  }

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines((previous) => previous.filter((line) => line.id !== id))
    }
  }

  const updateLine = (
    id: string,
    field: keyof Omit<InvoiceItem, "id">,
    value: string | number
  ) => {
    setLines((previous) =>
      previous.map((line) => (line.id === id ? { ...line, [field]: value } : line))
    )
  }

  const totals = useMemo(() => {
    let totalHT = 0
    let totalTVA = 0
    let totalTTC = 0

    lines.forEach((line) => {
      const lineTTC = getLineTotalTTC(line)
      const lineHT = getLineTotalHT(line)
      const lineTVA = lineTTC - lineHT

      totalHT += lineHT
      totalTVA += lineTVA
      totalTTC += lineTTC
    })

    return {
      totalHT: Math.round(totalHT),
      totalTVA: Math.round(totalTVA),
      totalTTC: Math.round(totalTTC),
    }
  }, [lines])

  const handleSubmit = async () => {
    // if (!selectedClient) {
    //   setError("Veuillez sélectionner un client")
    //   toast({
    //     variant: "destructive",
    //     title: "Erreur lors de l'enregistrement de la facture",
    //     description: "Veuillez sélectionner un client",
    //   })
    //   return
    // }

    setLoading(true)
    setError("")

    try {
      const payload = {
        customer_id: selectedClient ? Number(selectedClient) : null,
        invoice_number: invoiceNumber,
        due_at: issueDate,
        echeance_at: dueDate,
        total_tva: totals.totalTVA,
        items: lines.map(({ id, ...item }) => {
          const lineTTC = getLineTotalTTC(item)
          const lineHT = item.vat_rate > 0
            ? Math.round(lineTTC / (1 + item.vat_rate))
            : lineTTC

          return {
            ...item,
            unit_price: Number((lineHT / item.quantity).toFixed(2)),
          }
        }),
      }

      const res = isEditMode
        ? await axiosInstance.put(`/invoices/${invoiceId}`, payload)
        : await axiosInstance.post("/invoices", payload)

      if ((isEditMode && res.status === 200) || (!isEditMode && res.status === 201)) {
        router.push("/invoices")
        toast({
          title: "Facture ajoutée",
          description: "La facture a bien été enregistrée.",
        })
      }
    } catch (submitError: any) {
      console.error(submitError)
      setError(
        submitError.response?.data?.message ||
          (isEditMode
            ? "Erreur lors de la modification de la facture."
            : "Erreur lors de la création de la facture.")
      )
      toast({
        variant: "destructive",
        title: "Erreur lors de l'enregistrement de la facture",
        description: submitError.response?.data?.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header title={isEditMode ? "Modifier la facture" : "Nouvelle facture"} showNewInvoice={false} />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="mb-6">
          <Button variant="ghost" size="sm" className="gap-2" asChild>
            <Link href="/invoices">
              <ArrowLeft className="h-4 w-4" />
              Retour aux factures
            </Link>
          </Button>
        </div>

        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

        {isEditMode && loadingInvoice ? (
          <div className="flex h-[50vh] items-center justify-center rounded-lg border border-dashed">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement de la facture...
            </div>
          </div>
        ) : isEditMode && !loadingInvoice && !invoiceNumber ? (
          <div className="flex h-[50vh] items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              La facture demandée n&apos;a pas pu être chargée.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Détails de la facture</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Client</Label>
                      <Select value={selectedClient} onValueChange={setSelectedClient}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner un client" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={String(customer.id)}>
                              {customer.fullname}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Numéro de facture</Label>
                      <Input
                        value={invoiceNumber}
                        readOnly={!isEditMode}
                        onChange={(event) => setInvoiceNumber(event.target.value)}
                        className={isEditMode ? "" : "bg-muted"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date d&apos;émission</Label>
                      <Input
                        type="date"
                        value={issueDate}
                        onChange={(event) => setIssueDate(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date d&apos;échéance</Label>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(event) => setDueDate(event.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Lignes de facture</CardTitle>
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addLine}>
                    <Plus className="h-4 w-4" />
                    Ajouter une ligne
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40%]">Description</TableHead>
                          <TableHead>Qté</TableHead>
                          <TableHead>Prix unitaire TTC</TableHead>
                          <TableHead>TVA %</TableHead>
                          <TableHead className="text-right">Total TTC</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lines.map((line) => (
                          <TableRow key={line.id}>
                            <TableCell>
                              <Input
                                placeholder="Description"
                                value={line.description}
                                onChange={(event) =>
                                  updateLine(line.id, "description", event.target.value)
                                }
                                className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={line.quantity}
                                onChange={(event) =>
                                  updateLine(line.id, "quantity", parseInt(event.target.value, 10) || 1)
                                }
                                className="w-16 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                value={line.unit_price}
                                onChange={(event) =>
                                  updateLine(line.id, "unit_price", parseFloat(event.target.value) || 0)
                                }
                                className="w-28 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={line.vat_rate.toString()}
                                onValueChange={(value) =>
                                  updateLine(line.id, "vat_rate", parseFloat(value))
                                }
                              >
                                <SelectTrigger className="w-20 border-0 bg-transparent p-0 shadow-none focus:ring-0">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0">0%</SelectItem>
                                  <SelectItem value="0.05">5%</SelectItem>
                                  <SelectItem value="0.10">10%</SelectItem>
                                  <SelectItem value="0.18">18%</SelectItem>
                                  <SelectItem value="0.20">20%</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(getLineTotalTTC(line))}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => removeLine(line.id)}
                                disabled={lines.length === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="sticky top-6 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total HT</span>
                    <span className="font-medium">{formatCurrency(totals.totalHT)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TVA</span>
                    <span className="font-medium">{formatCurrency(totals.totalTVA)}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total TTC</span>
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(totals.totalTTC)}
                      </span>
                    </div>
                  </div>

                  {isEditMode ? (
                    <div className="space-y-2 pt-4">
                      <Button
                        type="button"
                        className="w-full gap-2"
                        disabled={loading}
                        onClick={handleSubmit}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {loading ? "Mise à jour..." : "Mettre à jour la facture"}
                      </Button>
                      <Button type="button" variant="outline" className="w-full gap-2" asChild>
                        <Link href="/invoices">Annuler</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-4">
                      {/* <Button
                        type="button"
                        className="w-full gap-2"
                        disabled={loading}
                        onClick={handleSubmit}
                      >
                        <Send className="h-4 w-4" />
                        {loading ? "Envoi..." : "Générer et envoyer"}
                      </Button> */}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        disabled={loading}
                        onClick={handleSubmit}
                      >
                        <Save className="h-4 w-4" />
                        Enregistrer brouillon
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
