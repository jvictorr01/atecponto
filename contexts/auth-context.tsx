"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

interface UserProfile {
  id: string
  email: string
  cnpj: string
  whatsapp: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  blockedCompany: { reason: string | null } | null
  login: (email: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
  register: (data: any) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [blockedCompany, setBlockedCompany] = useState<{
    reason: string | null
  } | null>(null)
  

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        loadProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error("Erro ao carregar perfil:", error)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Verificar se a empresa está bloqueada
      if (authData.user) {
        const { data: company } = await supabase
          .from("companies")
          .select("status, blocked_reason")
          .eq("user_id", authData.user.id)
          .single()

          if (company && company.status === "blocked") {
            setBlockedCompany({
              reason: company.blocked_reason || "Não informado",
            })
            return { error: null } // não lança erro — apenas sinaliza estado bloqueado
          }
      }

      return { error: null }
    } catch (error: any) {
      return { error: error.message || "Erro ao fazer login" }
    }
  }

  const register = async (data: any) => {
    try {
      const cnpjNumbers = data.cnpj.replace(/\D/g, "")
      const whatsappNumbers = data.whatsapp.replace(/\D/g, "")
  
      // Verificar duplicidade de CNPJ
      const [profileCheck, companyCheck] = await Promise.all([
        supabase.from("profiles").select("id").eq("cnpj", cnpjNumbers).maybeSingle(),
        supabase.from("companies").select("id").eq("cnpj", cnpjNumbers).maybeSingle(),
      ])
  
      if (profileCheck.data || companyCheck.data) {
        throw new Error("CNPJ já cadastrado")
      }
  
      // Criar usuário no Supabase Auth
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            cnpj: cnpjNumbers,
            whatsapp: whatsappNumbers,
          },
        },
      })
  
      if (error || !authData.user) {
        throw new Error(error?.message || "Erro ao criar conta")
      }
  
      const userId = authData.user.id
  
      // Inserir na tabela companies
      const { error: insertError } = await supabase.from("companies").insert([
        {
          user_id: userId,
          name: data.name, // ← importante: obrigatório
          email: data.email,
          cnpj: cnpjNumbers,
          whatsapp: whatsappNumbers,
          status: "active",
        },
      ])
  
      if (insertError) {
        throw new Error("Erro ao salvar dados da empresa: " + insertError.message)
      }
  
      return { error: null }
    } catch (error: any) {
      if (error.message.includes("CNPJ já cadastrado") || error.message.includes("duplicate key")) {
        return { error: "CNPJ já cadastrado" }
      }
      return { error: error.message || "Erro ao criar conta" }
    }
  }  
  

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, blockedCompany, login, logout, register }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
