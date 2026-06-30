"use client"

import { useEffect, useState } from "react"
import {
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { SuperAdminHeader } from "@/components/super-admin/header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import axiosInstance from "@/lib/axiosInstance"
import { formatCurrency, formatDate } from "@/lib/data"
import { getApiErrorMessage } from "@/lib/utils"

type Plan = "free" | "pro" | "business"

type Summary = {
  total_organizations: number
  organizations_this_month: number
  total_invoices: number
  invoices_this_month: number
  free_accounts: number
  pro_accounts: number
  business_accounts: number
  estimated_mrr: number
  subscription_revenue: number
  subscription_revenue_this_month: number
  subscription_payments_this_month: number
}

type MonthlyActivityPoint = {
  month: string
  organizations: number
  users: number
  invoices: number
  revenue: number
}

type SubscriptionPaymentPoint = {
  month: string
  amount: number
  payments: number
  pro_payments: number
  business_payments: number
}

type PlanDistributionPoint = {
  plan: Plan
  count: number
}

type LatestSubscription = {
  id: number
  customer_name: string
  phone?: string | null
  amount: number
  months: number
  plan: Plan
  org_name: string
  org_email: string
  org_phone: string
  created_at: string | null
}

type DashboardData = {
  summary: Summary
  charts: {
    monthly_activity: MonthlyActivityPoint[]
    subscription_payments: SubscriptionPaymentPoint[]
    plan_distribution: PlanDistributionPoint[]
  }
  latest_subscriptions: LatestSubscription[]
}

const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  pro: "Pro",
  business: "Plan indisponible",
}

const PLAN_BADGES: Record<Plan, string> = {
  free: "bg-zinc-100 text-zinc-700",
  pro: "bg-emerald-100 text-emerald-700",
  business: "bg-indigo-100 text-indigo-700",
}

const PLAN_COLORS: Record<Plan, string> = {
  free: "bg-zinc-500",
  pro: "bg-emerald-500",
  business: "bg-indigo-500",
}

function MoneyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value?: number | string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">{formatCurrency(Number(payload[0]?.value ?? 0))}</p>
    </div>
  )
}

function CountTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value?: number | string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">{Number(payload[0]?.value ?? 0)} factures</p>
    </div>
  )
}

export default function SuperAdminPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axiosInstance.get("/super-admin/dashboard")
        setDashboard(response.data)
      } catch (err) {
        setError(getApiErrorMessage(err, "Impossible de charger le dashboard super-admin."))
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const summary = dashboard?.summary
  const monthlyActivity = dashboard?.charts.monthly_activity ?? []
  const subscriptionPayments = dashboard?.charts.subscription_payments ?? []
  const planDistribution = dashboard?.charts.plan_distribution ?? []
  const latestSubscriptions = (dashboard?.latest_subscriptions ?? []).filter(
    (subscription) => subscription.plan !== "business"
  )
  const visiblePlanDistribution = planDistribution.filter((item) => item.plan !== "business")
  const paidAccounts = summary?.pro_accounts ?? 0
  const totalOrganizations = summary?.total_organizations ?? 0

  const planRows = visiblePlanDistribution.length
    ? visiblePlanDistribution
    : ([
        { plan: "free", count: summary?.free_accounts ?? 0 },
        { plan: "pro", count: summary?.pro_accounts ?? 0 },
      ] satisfies PlanDistributionPoint[])

  const summaryCards = summary
    ? [
        {
          title: "Organisations inscrites",
          value: summary.total_organizations.toString(),
          detail: `${summary.organizations_this_month} nouvelles ce mois`,
          icon: Building2,
          accent: "bg-indigo-50 text-indigo-700",
        },
        {
          title: "Factures creees ce mois",
          value: summary.invoices_this_month.toString(),
          detail: `${summary.total_invoices} factures au total`,
          icon: FileText,
          accent: "bg-cyan-50 text-cyan-700",
        },
        {
          title: "Comptes Free",
          value: summary.free_accounts.toString(),
          detail: "Organisations en plan gratuit",
          icon: Users,
          accent: "bg-zinc-100 text-zinc-700",
        },
        {
          title: "Comptes Pro",
          value: summary.pro_accounts.toString(),
          detail: "Organisations en plan payant disponible",
          icon: TrendingUp,
          accent: "bg-emerald-50 text-emerald-700",
        },
        {
          title: "Paiements ce mois",
          value: formatCurrency(summary.subscription_revenue_this_month),
          detail: `${summary.subscription_payments_this_month} paiements recus`,
          icon: CreditCard,
          accent: "bg-amber-50 text-amber-700",
        },
        {
          title: "MRR estime",
          value: formatCurrency(summary.estimated_mrr),
          detail: `${formatCurrency(summary.subscription_revenue)} encaisses au total`,
          icon: WalletCards,
          accent: "bg-rose-50 text-rose-700",
        },
      ]
    : []

  return (
    <>
      <SuperAdminHeader
        title="Dashboard super-admin"
        subtitle="Vue des organisations, factures et abonnements payants."
      />

      <main className="flex-1 overflow-y-auto bg-zinc-50 p-4 lg:p-6">
        {loading ? (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
            <div className="grid gap-5 xl:grid-cols-5">
              <div className="h-96 animate-pulse rounded-lg bg-muted xl:col-span-3" />
              <div className="h-96 animate-pulse rounded-lg bg-muted xl:col-span-2" />
            </div>
          </div>
        ) : error || !dashboard || !summary ? (
          <Card className="rounded-lg border-rose-200">
            <CardHeader>
              <CardTitle className="text-rose-700">Chargement impossible</CardTitle>
              <CardDescription>{error || "Le dashboard super-admin n'a pas pu etre charge."}</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-5">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {summaryCards.map((card) => (
                <Card key={card.title} className="rounded-lg border-zinc-200 bg-white">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                      <div className="mt-3 break-words text-2xl font-semibold text-foreground">{card.value}</div>
                    </div>
                    <div className={`rounded-lg p-2 ${card.accent}`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{card.detail}</p>
                  </CardContent>
                </Card>
              ))}
            </section>

            <section className="grid gap-5 xl:grid-cols-5">
              <Card className="rounded-lg border-zinc-200 bg-white xl:col-span-3">
                <CardHeader>
                  <CardTitle>Paiements d'abonnement recus par mois</CardTitle>
                  <CardDescription>Montants encaisses sur les 6 derniers mois.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subscriptionPayments}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                        <Tooltip content={<MoneyTooltip />} cursor={{ fill: "#f4f4f5" }} />
                        <Bar dataKey="amount" fill="#059669" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {subscriptionPayments.slice(-3).map((item) => (
                      <div key={item.month} className="rounded-lg border bg-zinc-50 p-3">
                        <p className="text-xs font-medium uppercase text-muted-foreground">{item.month}</p>
                        <p className="mt-2 font-semibold text-foreground">{formatCurrency(item.amount)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.payments} paiement(s)</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-lg border-zinc-200 bg-white xl:col-span-2">
                <CardHeader>
                  <CardTitle>Factures creees par mois</CardTitle>
                  <CardDescription>Volume de factures creees sur la plateforme.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyActivity}>
                        <defs>
                          <linearGradient id="invoiceFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                        <Tooltip content={<CountTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="invoices"
                          stroke="#4f46e5"
                          fill="url(#invoiceFill)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2">
                      <span className="text-sm font-medium text-indigo-800">Factures ce mois</span>
                      <span className="text-sm font-semibold text-indigo-900">{summary.invoices_this_month}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-cyan-50 px-3 py-2">
                      <span className="text-sm font-medium text-cyan-800">Total historique</span>
                      <span className="text-sm font-semibold text-cyan-900">{summary.total_invoices}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-5 xl:grid-cols-5">
              <Card className="rounded-lg border-zinc-200 bg-white xl:col-span-2">
                <CardHeader>
                  <CardTitle>Comptes par plan</CardTitle>
                  <CardDescription>Repartition actuelle des organisations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border bg-zinc-50 p-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Comptes payants</p>
                        <p className="mt-2 text-3xl font-semibold text-foreground">{paidAccounts}</p>
                      </div>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                        {totalOrganizations ? Math.round((paidAccounts / totalOrganizations) * 100) : 0}%
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {planRows.map((item) => {
                      const width = totalOrganizations ? Math.round((item.count / totalOrganizations) * 100) : 0

                      return (
                        <div key={item.plan} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${PLAN_COLORS[item.plan]}`} />
                              <span className="font-medium text-foreground">{PLAN_LABELS[item.plan]}</span>
                            </div>
                            <span className="text-muted-foreground">{item.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-zinc-100">
                            <div className={`h-2 rounded-full ${PLAN_COLORS[item.plan]}`} style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-lg border-zinc-200 bg-white xl:col-span-3">
                <CardHeader>
                  <CardTitle>Derniers abonnements effectues</CardTitle>
                  <CardDescription>Paiements d'abonnement les plus recents.</CardDescription>
                </CardHeader>
                <CardContent>
                  {latestSubscriptions.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                      Aucun paiement d'abonnement enregistre.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Organisation</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead className="hidden md:table-cell">Duree</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead className="hidden lg:table-cell">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {latestSubscriptions.map((subscription) => (
                          <TableRow key={subscription.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-foreground">{subscription.org_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {subscription.customer_name || "Client"} - {subscription.org_email}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={PLAN_BADGES[subscription.plan]}>
                                {PLAN_LABELS[subscription.plan]}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{subscription.months} mois</TableCell>
                            <TableCell className="font-medium">{formatCurrency(subscription.amount)}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="h-4 w-4" />
                                {subscription.created_at ? formatDate(subscription.created_at) : "Date inconnue"}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        )}
      </main>
    </>
  )
}
