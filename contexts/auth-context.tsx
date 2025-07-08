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

      // --- AQUI COMEÇA A LÓGICA DE LIMITAÇÃO DE DISPOSITIVOS ---
      function getDeviceId() {
        let deviceId = localStorage.getItem("deviceId");
        if (!deviceId) {
          deviceId = crypto.randomUUID();
          localStorage.setItem("deviceId", deviceId);
        }
        return deviceId;
      }
      
      const deviceId = getDeviceId();
      const deviceInfo = typeof navigator !== "undefined" ? navigator.userAgent : "unknown-device";
      const ipAddress = "127.0.0.1"; // ou real via backend/api
      
      const { data: sessions, error: sessionsError } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", authData.user.id)
        .eq("is_active", true);
      
      if (sessionsError) throw sessionsError;
      
      const alreadyRegistered = sessions.some(s => s.device_info === deviceInfo);
      
      if (!alreadyRegistered && sessions.length >= 2) {
        await supabase.auth.signOut();
        throw new Error("Limite de dispositivos atingido. Faça logout em outro dispositivo.");
      }
      
      if (!alreadyRegistered) {
        await supabase.from("user_sessions").insert([
          {
            user_id: authData.user.id,
            device_info: deviceInfo,
            ip_address: ipAddress,
            is_active: true,
            last_activity: new Date().toISOString(),
          }
        ]);
      } else {
        await supabase.from("user_sessions")
          .update({ last_activity: new Date().toISOString() })
          .eq("user_id", authData.user.id)
          .eq("device_info", deviceInfo);
      }
      // --- FIM DA LÓGICA DE LIMITAÇÃO DE DISPOSITIVOS ---

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
      const { data: existingCompany } = await supabase
        .from("companies")
        .select("id")
        .eq("cnpj", cnpjNumbers)
        .maybeSingle()

      if (existingCompany) {
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
    const deviceInfo = navigator.userAgent;
  
    if (user) {
      await supabase.from("user_sessions")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("device_info", deviceInfo);
    }
  
    await supabase.auth.signOut();
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
