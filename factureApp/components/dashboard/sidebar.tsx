"use client"

import Link from "next/link"
import { usePathname, useRouter  } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  UserCog,
  LogOut,
} from "lucide-react"
import axiosInstance from "@/lib/axiosInstance"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Factures", href: "/invoices", icon: FileText },
  { name: "Clients", href: "/customers", icon: Users },
  { name: "Organisation", href: "/organization", icon: Building2 },
  { name: "Membres", href: "/members", icon: UserCog },
]

type User = {
  fullname: string
  email:    string
  role:     string
}

const getRoleLabel = (role: string) => ({
  member:     'Membre',
  admin:      'Admin',
  superAdmin: 'Super Admin',
}[role] ?? role)

const getInitials = (fullname: string) =>
  fullname.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

export function Sidebar() {
  const pathname = usePathname()
  const router          = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  // Récupérer l'utilisateur connecté depuis le localStorage
  useEffect(() => {
    const userRaw = localStorage.getItem('user')
    if (userRaw) {
      setUser(JSON.parse(userRaw))
    }
  }, [])

  const handleLogout = async () => {
    setLoading(true)
    try {
      // Appel API pour invalider le token côté Laravel
      await axiosInstance.post('/logout')
    } catch (error) {
      // Même si l'API échoue, on déconnecte quand même côté client
      console.error(error)
    } finally {
      // Nettoyer le localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Rediriger vers login
      router.replace('/login')
      setLoading(false)
    }
  }

  return (
    <aside className="hidden w-60 flex-shrink-0 border-r bg-card lg:flex lg:flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <img src="/logoFacture.png" alt="Logo FacturaPro" width="150" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <span className="text-sm font-semibold text-primary">{user ? getInitials(user.fullname) : '..'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{user?.fullname ?? '...'}</p>
            <p className="truncate text-xs text-muted-foreground">{user ? getRoleLabel(user.role) : '...'}</p>
          </div>
          <button onClick={handleLogout} disabled={loading} className="text-muted-foreground hover:text-foreground" aria-label="Déconnexion">
            {loading
              ? <span className="h-4 w-4 animate-spin block border-2 border-current border-t-transparent rounded-full" />
              : <LogOut className="h-4 w-4" />
            }
          </button>
        </div>
      </div>
    </aside>
  )
}
