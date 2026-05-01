"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  Building2,
  CircleDollarSign,
  FileText,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, type InvoiceStatus } from "@/lib/data"
import { getApiErrorMessage } from "@/lib/utils"

type Summary = {
  total_organizations: number
  active_organizations: number
  suspended_organizations: number
  expired_organizations: number
  expiring_organizations: number
  organizations_this_month: number
  total_users: number
  active_users: number
  suspended_users: number
  inactive_users: number
  users_this_month: number
  total_invoices: number
  paid_invoices: number
  overdue_invoices: number
  invoices_this_month: number
  estimated_mrr: number
  collected_revenue: number
  monthly_revenue: number
  overdue_amount: number
}

type MonthlyActivityPoint = {
  month: string
  organizations: number
  users: number
  invoices: number
  revenue: number
}

type PlanDistributionPoint = {
  plan: "free" | "pro" | "business"
  count: number
}

type InvoiceStatusPoint = {
  status: InvoiceStatus
  count: number
}

type OrganizationRow = {
  id: number
  name: string
  email?: string
  country?: string
  plan: "free" | "pro" | "business"
  is_active: boolean
  is_expired: boolean
  users_count: number
  invoices_count: number
  total_revenue?: number
  plan_expires_at: string | null
  days_until_expiration: number | null
}

type RecentUser = {
  id: number
  fullname: string
  email: string
  role: string
  status: "actif" | "suspendu" | "inactif"
  organization: string
  created_at: string
}

type RecentInvoice = {
  id: number
  number: string
  organization: string
  customer: string
  amount: number
  status: InvoiceStatus
  created_at: string
}

type DashboardData = {
  summary: Summary
  charts: {
    monthly_activity: MonthlyActivityPoint[]
    plan_distribution: PlanDistributionPoint[]
    invoice_statuses: InvoiceStatusPoint[]
  }
  latest_organizations: OrganizationRow[]
  attention_required_organizations: OrganizationRow[]
  recent_users: RecentUser[]
  recent_invoices: RecentInvoice[]
}

const PLAN_LABELS: Record<PlanDistributionPoint["plan"], string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
}

const PLAN_COLORS: Record<PlanDistributionPoint["plan"], string> = {
  free: "#94a3b8",
  pro: "#f59e0b",
  business: "#0f766e",
}

const getRoleLabel = (role: string) =>
  ({
    member: "Membre",
    admin: "Admin",
    superAdmin: "Super Admin",
  }[role] ?? role)

const getUserStatusBadgeClass = (status: RecentUser["status"]) =>
  ({
    actif: "bg-emerald-100 text-emerald-700",
    suspendu: "bg-amber-100 text-amber-700",
    inactif: "bg-rose-100 text-rose-700",
  }[status])

const getUserStatusLabel = (status: RecentUser["status"]) =>
  ({
    actif: "Actif",
    suspendu: "Suspendu",
    inactif: "Inactif",
  }[status])

function getOrganizationHealth(item: {
  is_active: boolean
  is_expired: boolean
  days_until_expiration: number | null
}) {
  if (!item.is_active) {
    return {
      label: "Suspendue",
      className: "bg-rose-100 text-rose-700",
    }
  }

  if (item.is_expired) {
    return {
      label: "Expiree",
      className: "bg-rose-100 text-rose-700",
    }
  }

  if (item.days_until_expiration !== null && item.days_until_expiration <= 7) {
    return {
      label: "A surveiller",
      className: "bg-amber-100 text-amber-700",
    }
  }

  return {
    label: "Stable",
    className: "bg-emerald-100 text-emerald-700",
  }
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
        setError(getApiErrorMessage(err, "Impossible de charger la console super admin."))
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const summary = dashboard?.summary
  const monthlyActivity = dashboard?.charts.monthly_activity ?? []
  const planDistribution = dashboard?.charts.plan_distribution ?? []
  const invoiceStatuses = dashboard?.charts.invoice_statuses ?? []

  const summaryCards = summary
    ? [
        {
          title: "Organisations",
          value: summary.total_organizations.toString(),
          detail: `${summary.active_organizations} actives`,
          icon: Building2,
        },
        {
          title: "Utilisateurs",
          value: summary.total_users.toString(),
          detail: `${summary.active_users} actifs`,
          icon: Users,
        },
        {
          title: "CA encaisse",
          value: formatCurrency(summary.collected_revenue),
          detail: `${formatCurrency(summary.monthly_revenue)} ce mois`,
          icon: CircleDollarSign,
        },
        {
          title: "MRR estime",
          value: formatCurrency(summary.estimated_mrr),
          detail: "Base sur les plans actifs",
          icon: TrendingUp,
        },
        {
          title: "Factures",
          value: summary.total_invoices.toString(),
          detail: `${summary.invoices_this_month} ce mois`,
          icon: FileText,
        },
        {
          title: "Alertes",
          value: (summary.expiring_organizations + summary.suspended_organizations + summary.expired_organizations).toString(),
          detail: `${summary.overdue_invoices} factures en retard`,
          icon: ShieldAlert,
        },
      ]
    : []

  return (
    <>
      <SuperAdminHeader
        title="Pilotage SaaS"
        subtitle="Suivez vos abonnements, votre activite et les signaux critiques depuis une seule console."
      />

      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {loading ? (
          <div className="space-y-6">
            <div className="h-40 animate-pulse rounded-3xl bg-muted" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
            <div className="grid gap-6 xl:grid-cols-3">
              <div className="h-96 animate-pulse rounded-2xl bg-muted xl:col-span-2" />
              <div className="h-96 animate-pulse rounded-2xl bg-muted" />
            </div>
          </div>
        ) : error || !dashboard || !summary ? (
          <Card className="border-rose-200">
            <CardHeader>
              <CardTitle className="text-rose-700">Chargement impossible</CardTitle>
              <CardDescription>{error || "La console super admin n'a pas pu etre chargee."}</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 text-stone-50 shadow-xl">
              <CardContent className="p-6 lg:p-8">
                <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                  <div className="space-y-4">
                    <Badge variant="secondary" className="w-fit bg-white/10 text-amber-200">
                      Vue plateforme
                    </Badge>
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight lg:text-3xl">
                        Votre SaaS garde le cap, avec les points sensibles visibles tout de suite.
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm text-stone-300">
                        Cette console centralise la sante des organisations, la dynamique des utilisateurs, le revenu encaisse
                        et les alertes d&apos;abonnement a traiter.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Nouvelles orgs</p>
                      <p className="mt-2 text-3xl font-semibold">{summary.organizations_this_month}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Nouveaux users</p>
                      <p className="mt-2 text-3xl font-semibold">{summary.users_this_month}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Factures du mois</p>
                      <p className="mt-2 text-3xl font-semibold">{summary.invoices_this_month}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {summaryCards.map((card) => (
                <Card key={card.title} className="border-border/60">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                      <div className="mt-3 text-2xl font-semibold text-foreground">{card.value}</div>
                    </div>
                    <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                      <card.icon className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{card.detail}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <Card className="border-border/60 xl:col-span-2">
                <CardHeader>
                  <CardTitle>Revenus mensuels</CardTitle>
                  <CardDescription>Evolution des montants encaisses sur les 6 derniers mois.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyActivity}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                        <Tooltip
                          cursor={{ fill: "hsl(var(--muted))" }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Bar dataKey="revenue" radius={[10, 10, 0, 0]} fill="#d97706" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {monthlyActivity.slice(-3).map((item) => (
                      <div key={item.month} className="rounded-xl bg-muted/50 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.month}</p>
                        <p className="mt-2 font-semibold text-foreground">{formatCurrency(item.revenue)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.organizations} orgs, {item.users} users, {item.invoices} factures
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>Mix abonnements</CardTitle>
                  <CardDescription>Repartition actuelle des plans et volume de statuts facture.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={planDistribution}
                          dataKey="count"
                          nameKey="plan"
                          innerRadius={48}
                          outerRadius={80}
                          paddingAngle={4}
                        >
                          {planDistribution.map((entry) => (
                            <Cell key={entry.plan} fill={PLAN_COLORS[entry.plan]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2">
                    {planDistribution.map((item) => (
                      <div key={item.plan} className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
                        <div className="flex items-center gap-3">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: PLAN_COLORS[item.plan] }} />
                          <span className="font-medium text-foreground">{PLAN_LABELS[item.plan]}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{item.count}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Statuts facture</p>
                    {invoiceStatuses.map((item) => (
                      <div key={item.status} className="flex items-center justify-between rounded-xl border px-3 py-2">
                        <Badge variant="secondary" className={getStatusColor(item.status)}>
                          {getStatusLabel(item.status)}
                        </Badge>
                        <span className="text-sm font-medium text-foreground">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <Card className="border-border/60 xl:col-span-2">
                <CardHeader>
                  <CardTitle>Dernieres organisations</CardTitle>
                  <CardDescription>Vision rapide des clients SaaS recemment crees.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organisation</TableHead>
                        <TableHead className="hidden md:table-cell">Plan</TableHead>
                        <TableHead className="hidden lg:table-cell">Equipe</TableHead>
                        <TableHead className="hidden lg:table-cell">Factures</TableHead>
                        <TableHead>Sante</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboard.latest_organizations.map((organization) => {
                        const health = getOrganizationHealth(organization)

                        return (
                          <TableRow key={organization.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-foreground">{organization.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {organization.country || "Pays non renseigne"} • {organization.email || "Email non renseigne"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{PLAN_LABELS[organization.plan]}</TableCell>
                            <TableCell className="hidden lg:table-cell">{organization.users_count}</TableCell>
                            <TableCell className="hidden lg:table-cell">{organization.invoices_count}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={health.className}>
                                {health.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Points d&apos;attention
                  </CardTitle>
                  <CardDescription>Organisations a traiter rapidement.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboard.attention_required_organizations.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                      Aucun signal critique pour le moment.
                    </div>
                  ) : (
                    dashboard.attention_required_organizations.map((organization) => {
                      const health = getOrganizationHealth(organization)

                      return (
                        <div key={organization.id} className="rounded-2xl border p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">{organization.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Plan {PLAN_LABELS[organization.plan]} • {organization.users_count} users
                              </p>
                            </div>
                            <Badge variant="secondary" className={health.className}>
                              {health.label}
                            </Badge>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                            <span>{organization.invoices_count} factures</span>
                            <span>
                              {organization.plan_expires_at
                                ? `Echeance ${formatDate(organization.plan_expires_at)}`
                                : "Sans date d'expiration"}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>Derniers utilisateurs</CardTitle>
                  <CardDescription>Creation et statut des comptes les plus recents.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead className="hidden md:table-cell">Organisation</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboard.recent_users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{user.fullname}</p>
                              <p className="text-sm text-muted-foreground">
                                {user.email} • {getRoleLabel(user.role)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{user.organization}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={getUserStatusBadgeClass(user.status)}>
                              {getUserStatusLabel(user.status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>Dernieres factures</CardTitle>
                  <CardDescription>Activite recente sur l&apos;ensemble du SaaS.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Facture</TableHead>
                        <TableHead className="hidden md:table-cell">Organisation</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboard.recent_invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{invoice.number}</p>
                              <p className="text-sm text-muted-foreground">
                                {invoice.customer} • {formatCurrency(invoice.amount)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{invoice.organization}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={getStatusColor(invoice.status)}>
                              {getStatusLabel(invoice.status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Abonnements sensibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold text-foreground">
                    {summary.expiring_organizations + summary.expired_organizations}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {summary.expiring_organizations} arrivent a echeance, {summary.expired_organizations} sont deja expires.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Utilisateurs bloques</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold text-foreground">
                    {summary.suspended_users + summary.inactive_users}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {summary.suspended_users} suspendus et {summary.inactive_users} inactifs.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Factures payees</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold text-foreground">{summary.paid_invoices}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    sur {summary.total_invoices} emises au total.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Montants en retard</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold text-foreground">{formatCurrency(summary.overdue_amount)}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    relies a {summary.overdue_invoices} factures a relancer.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
