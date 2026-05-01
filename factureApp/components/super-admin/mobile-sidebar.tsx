"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Activity, LogOut, Menu, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import axiosInstance from "@/lib/axiosInstance"
import { cn } from "@/lib/utils"
import { clearStoredSession, getStoredUser, type StoredUser } from "@/lib/auth"

const navigation = [
  { name: "Pilotage SaaS", href: "/super-admin", icon: Activity },
]

const getInitials = (fullname?: string) =>
  (fullname ?? "Super Admin")
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

export function SuperAdminMobileSidebar() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<StoredUser | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  const handleLogout = async () => {
    setLoading(true)

    try {
      await axiosInstance.post("/logout")
    } catch (error) {
      console.error(error)
    } finally {
      clearStoredSession()
      setOpen(false)
      router.replace("/login")
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 border-stone-800 bg-stone-950 p-0 text-stone-50">
        <SheetHeader className="border-b border-stone-800 px-6 py-5 text-left">
          <SheetTitle className="flex items-center gap-3 text-stone-50">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400 text-stone-950">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Super Admin</p>
              <span className="text-base font-semibold">Console FacturaPro</span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <nav className="space-y-2 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-amber-400 text-stone-950"
                    : "text-stone-300 hover:bg-stone-900 hover:text-stone-50"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-stone-800 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-stone-900 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 font-semibold text-stone-950">
              {getInitials(user?.fullname)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-stone-50">{user?.fullname ?? "Super Admin"}</p>
              <p className="truncate text-xs text-stone-400">{user?.email ?? "Acces prive"}</p>
            </div>
            <button
              className="text-stone-400 transition hover:text-stone-50"
              onClick={handleLogout}
              disabled={loading}
              aria-label="Deconnexion"
            >
              {loading ? (
                <span className="block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
