"use client"

import { AdminAuthProvider, useAdminAuth } from "@/contexts/admin-auth-context"
import { AdminLoginForm } from "@/components/admin-login-form"
import { AdminDashboard } from "@/components/admin-dashboard"

function BackofficeContent() {
  const { admin, loading } = useAdminAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!admin) {
    return <AdminLoginForm />
  }

  return <AdminDashboard />
}

export default function BackofficePage() {
  return (
    <AdminAuthProvider>
      <BackofficeContent />
    </AdminAuthProvider>
  )
}
