"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { clearStoredSession, getDefaultRouteForUser, getStoredUser } from "@/lib/auth"

type AuthGuardProps = {
  children: React.ReactNode
  requireSuperAdmin?: boolean
  forbidSuperAdmin?: boolean
}

export default function AuthGuard({
  children,
  requireSuperAdmin = false,
  forbidSuperAdmin = false,
}: AuthGuardProps) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const user = getStoredUser()

    if (!token || !user) {
      clearStoredSession()
      router.replace("/login")
      return
    }

    if (user.status && user.status !== "actif") {
      clearStoredSession()
      router.replace("/login")
      return
    }

    if (requireSuperAdmin && user.role !== "superAdmin") {
      router.replace(getDefaultRouteForUser(user))
      return
    }

    if (forbidSuperAdmin && user.role === "superAdmin") {
      router.replace("/super-admin")
      return
    }

    setChecked(true)
  }, [forbidSuperAdmin, requireSuperAdmin, router])

  if (!checked) return null

  return <>{children}</>
}
