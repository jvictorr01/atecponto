"use client"

import { useAuth } from "@/contexts/auth-context"
import { LoginForm } from "@/components/login-form"
import { Dashboard } from "@/components/dashboard"
import { RegisterForm } from "@/components/register-form"
import { CreateCompanyForm } from "@/components/create-company-form"
import { BlockedCompanyMessage } from "@/components/blocked-company-message"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const { user, profile, loading } = useAuth()
  const [showRegister, setShowRegister] = useState(false)
  const [hasCompany, setHasCompany] = useState(false)
  const [checkingCompany, setCheckingCompany] = useState(true)
  const [companyBlocked, setCompanyBlocked] = useState<{ blocked: boolean; reason?: string }>({ blocked: false })

  useEffect(() => {
    if (user) {
      checkUserCompany()
    } else {
      setCheckingCompany(false)
    }
  }, [user])

  const checkUserCompany = async () => {
    if (!user) return

    try {
      const { data: company } = await supabase
        .from("companies")
        .select("id, status, blocked_reason")
        .eq("user_id", user.id)
        .single()

      if (company) {
        setHasCompany(true)
        if (company.status === "blocked") {
          setCompanyBlocked({
            blocked: true,
            reason: company.blocked_reason || "Não informado",
          })
        } else {
          setCompanyBlocked({ blocked: false })
        }
      } else {
        setHasCompany(false)
      }
    } catch (error) {
      setHasCompany(false)
    } finally {
      setCheckingCompany(false)
    }
  }

  if (loading || checkingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#09893E]"></div>
      </div>
    )
  }

  // Se a empresa está bloqueada, mostrar mensagem
  if (user && companyBlocked.blocked) {
    return (
      <BlockedCompanyMessage
        reason={companyBlocked.reason}
        onBackToLogin={() => {
          // Fazer logout e voltar ao login
          supabase.auth.signOut()
        }}
      />
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {showRegister ? (
            <RegisterForm onToggle={() => setShowRegister(false)} />
          ) : (
            <LoginForm onToggle={() => setShowRegister(true)} />
          )}
        </div>
      </div>
    )
  }

  if (!hasCompany) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <CreateCompanyForm onCompanyCreated={() => setHasCompany(true)} />
        </div>
      </div>
    )
  }

  return <Dashboard />
}
