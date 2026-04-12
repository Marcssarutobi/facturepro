import { Header } from "@/components/dashboard/header"
import { MetricCards } from "@/components/dashboard/metric-cards"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { RecentInvoices } from "@/components/dashboard/recent-invoices"

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="space-y-6">
          {/* Metric Cards */}
          <MetricCards />

          {/* Charts and Table */}
          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueChart />
            <RecentInvoices />
          </div>
        </div>
      </main>
    </>
  )
}
