import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MobileSidebar } from "./mobile-sidebar"
import { Plus, Bell } from "lucide-react"

interface HeaderProps {
  title: string
  showNewInvoice?: boolean
}

export function Header({ title, showNewInvoice = true }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <MobileSidebar />
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* New Invoice Button */}
        {showNewInvoice && (
          <Button asChild className="gap-2">
            <Link href="/invoices/new">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouvelle facture</span>
            </Link>
          </Button>
        )}
      </div>
    </header>
  )
}
