import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, FileText, CheckCircle2, Clock } from "lucide-react"
import { formatCurrency } from "@/lib/data"

const metrics = [
  {
    title: "CA du mois",
    value: formatCurrency(4150000),
    change: "+12%",
    icon: TrendingUp,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    title: "Factures envoyées",
    value: "24",
    change: "+3 ce mois",
    icon: FileText,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    title: "Factures payées",
    value: "18",
    change: "75% du total",
    icon: CheckCircle2,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    title: "En attente",
    value: formatCurrency(1080000),
    change: "4 factures",
    icon: Clock,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
]

export function MetricCards() {
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
            <div className="text-2xl font-bold text-foreground">{metric.value}</div>
            <p className="text-xs text-muted-foreground">{metric.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
