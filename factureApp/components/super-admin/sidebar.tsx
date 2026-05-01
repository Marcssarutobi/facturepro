"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Activity, LogOut, ShieldCheck } from "lucide-react"
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

export function SuperAdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<StoredUser | null>(null)
  const [loading, setLoading] = useState(false)

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
      router.replace("/login")
      setLoading(false)
    }
  }

  return (
    <aside className="hidden w-72 flex-shrink-0 border-r bg-stone-950 text-stone-50 lg:flex lg:flex-col">
      <div className="border-b border-stone-800 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-stone-950">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-300">Super Admin</p>
            <h2 className="text-lg font-semibold">Console FacturaPro</h2>
          </div>
        </div>
        <p className="mt-4 text-sm text-stone-300">
          Vue globale du SaaS, des abonnements et de l&apos;activite plateforme.
        </p>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.name}
              href={item.href}
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

      <div className="border-t border-stone-800 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-stone-900 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 font-semibold text-stone-950">
            {getInitials(user?.fullname)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-stone-50">{user?.fullname ?? "Super Admin"}</p>
            <p className="truncate text-xs text-stone-400">{user?.email ?? "Acces prive"}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="text-stone-400 transition hover:text-stone-50"
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
    </aside>
  )
}
