export type StoredUser = {
  fullname?: string
  email?: string
  role?: string
  status?: string
  organization_id?: number | null
  organization?: Record<string, unknown> | null
}

export function parseStoredUser(raw: string | null): StoredUser | null {
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") {
    return null
  }

  return parseStoredUser(localStorage.getItem("user"))
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return
  }

  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

export function getDefaultRouteForUser(user: Pick<StoredUser, "role"> | null | undefined): string {
  return user?.role === "superAdmin" ? "/super-admin" : "/dashboard"
}
