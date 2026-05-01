"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate, getStatusLabel, getStatusColor, InvoiceStatus } from "@/lib/data"
import { useEffect, useState } from "react"
import axiosInstance from "@/lib/axiosInstance"

interface RecentInvoice {
  id: number
  number: string
  customer: string
  amount: number
  status: InvoiceStatus
  date: string
}

export function RecentInvoices() {
  const [invoices, setInvoices] = useState<RecentInvoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axiosInstance.get('/dashboard')
        setInvoices(response.data.recent_invoices)
      } catch (error) {
        console.error('Erreur lors du chargement des factures récentes:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Dernières factures</CardTitle>
            <CardDescription>Les 5 factures les plus récentes</CardDescription>
          </div>
          <Link
            href="/invoices"
            className="text-sm font-medium text-primary hover:underline"
          >
            Voir tout
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 bg-muted rounded animate-pulse flex-1" />
                <div className="h-4 bg-muted rounded animate-pulse w-20" />
                <div className="h-4 bg-muted rounded animate-pulse w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Dernières factures</CardTitle>
          <CardDescription>Les 5 factures les plus récentes</CardDescription>
        </div>
        <Link
          href="/invoices"
          className="text-sm font-medium text-primary hover:underline"
        >
          Voir tout
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="hidden sm:table-cell">Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.number}</TableCell>
                <TableCell className="max-w-[150px] truncate">{invoice.customer}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {formatCurrency(invoice.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={getStatusColor(invoice.status)}>
                    {getStatusLabel(invoice.status)}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatDate(invoice.date)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
