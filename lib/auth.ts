import { supabase } from "./supabase"
import bcrypt from "bcryptjs"

export interface RegisterData {
  email: string
  cnpj: string
  whatsapp: string
  password: string
}

export interface LoginData {
  email: string
  password: string
}

export async function registerUser(data: RegisterData) {
  try {
    // Verificar se já existe usuário com este CNPJ
    const { data: existingUser } = await supabase.from("users").select("id").eq("cnpj", data.cnpj).single()

    if (existingUser) {
      throw new Error("CNPJ já cadastrado")
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(data.password, 10)

    // Criar usuário
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        email: data.email,
        cnpj: data.cnpj,
        whatsapp: data.whatsapp,
        password_hash: passwordHash,
      })
      .select()
      .single()

    if (error) throw error

    return { user, error: null }
  } catch (error) {
    return { user: null, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

export async function loginUser(data: LoginData) {
  try {
    // Buscar usuário
    const { data: user, error } = await supabase.from("users").select("*").eq("email", data.email).single()

    if (error || !user) {
      throw new Error("Email ou senha incorretos")
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(data.password, user.password_hash)
    if (!isValidPassword) {
      throw new Error("Email ou senha incorretos")
    }

    // Verificar limite de sessões ativas
    const { data: activeSessions } = await supabase
      .from("user_sessions")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)

    if (activeSessions && activeSessions.length >= 2) {
      throw new Error("Limite de dispositivos conectados atingido (máximo 2)")
    }

    // Criar nova sessão
    await supabase.from("user_sessions").insert({
      user_id: user.id,
      device_info: navigator.userAgent,
      ip_address: "127.0.0.1", // Em produção, pegar IP real
      is_active: true,
    })

    return { user, error: null }
  } catch (error) {
    return { user: null, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

export async function logoutUser(userId: string) {
  await supabase.from("user_sessions").update({ is_active: false }).eq("user_id", userId).eq("is_active", true)
}
