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
import { invoices, formatCurrency, formatDate, getStatusLabel, getStatusColor } from "@/lib/data"

export function RecentInvoices() {
  const recentInvoices = invoices.slice(0, 5)

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
            {recentInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.number}</TableCell>
                <TableCell className="max-w-[150px] truncate">{invoice.client}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {formatCurrency(invoice.amountTTC)}
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
