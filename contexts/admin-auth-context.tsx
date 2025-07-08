"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { loginAdmin, type AdminUser } from "@/lib/admin-auth"

interface AdminAuthContextType {
  admin: AdminUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<{ error: string | null }>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se há admin logado no localStorage
    const savedAdmin = localStorage.getItem("admin_user")
    if (savedAdmin) {
      try {
        setAdmin(JSON.parse(savedAdmin))
      } catch (error) {
        localStorage.removeItem("admin_user")
      }
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const { admin: adminData, error } = await loginAdmin({ username, password })

      if (error) {
        return { error }
      }

      if (adminData) {
        const adminUser: AdminUser = {
          id: adminData.id,
          username: adminData.username,
          email: adminData.email,
          is_active: adminData.is_active,
        }

        setAdmin(adminUser)
        localStorage.setItem("admin_user", JSON.stringify(adminUser))
      }

      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Erro ao fazer login" }
    }
  }

  const logout = () => {
    setAdmin(null)
    localStorage.removeItem("admin_user")
  }

  return <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider")
  }
  return context
}
