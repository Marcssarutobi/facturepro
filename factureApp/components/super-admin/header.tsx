import { Badge } from "@/components/ui/badge"
import { SuperAdminMobileSidebar } from "./mobile-sidebar"

type SuperAdminHeaderProps = {
  title: string
  subtitle: string
}

export function SuperAdminHeader({ title, subtitle }: SuperAdminHeaderProps) {
  return (
    <header className="border-b bg-card px-4 py-4 lg:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <SuperAdminMobileSidebar />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{title}</h1>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                Super Admin
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
