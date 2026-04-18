"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, FileText, CheckCircle2, Clock, Users, AlertTriangle } from "lucide-react"
import { formatCurrency } from "@/lib/data"
import { useEffect, useState } from "react"
import axiosInstance from "@/lib/axiosInstance"

interface DashboardSummary {
  total_customers: number
  total_invoices: number
  total_revenue: number
  pending_invoices: number
  total_reminders: number
  pending_reminders: number
  active_customers: number
  paid_invoices: number
  pending_amount: number
  monthly_revenue: number
}

export function MetricCards() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axiosInstance.get('/dashboard')
        setSummary(response.data.summary)
      } catch (error) {
        console.error('Erreur lors du chargement du dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading || !summary) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-8 w-8 bg-muted rounded-lg animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse mb-1" />
              <div className="h-3 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const metrics = [
    {
      title: "CA du mois",
      value: formatCurrency(summary.monthly_revenue),
      change: "", // Peut être calculé dynamiquement si besoin
      icon: TrendingUp,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Factures totales",
      value: summary.total_invoices.toString(),
      change: `${summary.paid_invoices} payées`,
      icon: FileText,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Factures payées",
      value: summary.paid_invoices.toString(),
      change: `${((summary.paid_invoices / summary.total_invoices) * 100).toFixed(0)}% du total`,
      icon: CheckCircle2,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "En attente",
      value: formatCurrency(summary.pending_amount),
      change: `${summary.pending_invoices} factures`,
      icon: Clock,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title} className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${metric.iconBg}`}>
              <metric.icon className={`h-4 w-4 ${metric.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted-foreground">{metric.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
