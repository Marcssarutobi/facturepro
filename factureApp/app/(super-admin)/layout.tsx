import AuthGuard from "@/components/AuthGuard"
import { SuperAdminSidebar } from "@/components/super-admin/sidebar"

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard requireSuperAdmin>
      <div className="flex h-screen bg-stone-100">
        <SuperAdminSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </AuthGuard>
  )
}
