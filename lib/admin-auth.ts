import bcrypt from "bcryptjs"
import { supabase } from "./supabase"

export interface AdminLoginData {
  username: string
  password: string
}

export interface AdminUser {
  id: string
  username: string
  email: string
  is_active: boolean
}

// ✅ FUNÇÃO SEGURA, PODE RODAR NO CLIENT
export async function loginAdmin(data: AdminLoginData) {
  try {
    const { data: admin, error } = await supabase
      .from("system_admins")
      .select("*")
      .eq("username", data.username)
      .eq("is_active", true)
      .single()

    if (error || !admin) {
      throw new Error("Usuário ou senha incorretos")
    }

    const isValidPassword = await bcrypt.compare(data.password, admin.password_hash)
    if (!isValidPassword) {
      throw new Error("Usuário ou senha incorretos")
    }

    return { admin, error: null }
  } catch (error) {
    return { admin: null, error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

export async function getCompaniesStats() {
  try {
    console.log("Iniciando busca de empresas...")

    // Buscar empresas e profiles separadamente para evitar problemas de relacionamento
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false })

    if (companiesError) {
      console.error("Erro ao buscar empresas:", companiesError)
      throw companiesError
    }

    console.log("Empresas encontradas:", companies?.length || 0)

    if (!companies || companies.length === 0) {
      return { companies: [], error: null }
    }

    // Buscar todos os profiles dos usuários das empresas
    const userIds = companies.map((c) => c.user_id).filter(Boolean)
    const { data: profiles, error: profilesError } = await supabase.from("profiles").select("*").in("id", userIds)

    if (profilesError) {
      console.warn("Erro ao buscar perfis:", profilesError)
    }

    console.log("Perfis encontrados:", profiles?.length || 0)

    // Para cada empresa, buscar dados do perfil e quantidade de funcionários
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        try {
          // Encontrar perfil correspondente
          const profile = profiles?.find((p) => p.id === company.user_id)

          // Buscar quantidade de funcionários
          const { count: employeeCount, error: employeeError } = await supabase
            .from("employees")
            .select("*", { count: "exact", head: true })
            .eq("company_id", company.id)

          if (employeeError) {
            console.warn(`Erro ao buscar funcionários para empresa ${company.id}:`, employeeError)
          }

          return {
            ...company,
            employee_count: employeeCount || 0,
            // Usar dados do profile como prioridade
            profile: {
              email: profile?.email || "N/A",
              cnpj: profile?.cnpj || company.cnpj || "N/A",
              whatsapp: profile?.whatsapp || company.whatsapp || "N/A",
            },
          }
        } catch (error) {
          console.error(`Erro ao processar empresa ${company.id}:`, error)
          return {
            ...company,
            employee_count: 0,
            profile: {
              email: "N/A",
              cnpj: company.cnpj || "N/A",
              whatsapp: company.whatsapp || "N/A",
            },
          }
        }
      }),
    )

    console.log("Empresas processadas com sucesso:", companiesWithStats.length)
    return { companies: companiesWithStats, error: null }
  } catch (error) {
    console.error("Erro detalhado ao carregar empresas:", error)
    return {
      companies: [],
      error: error instanceof Error ? error.message : "Erro ao carregar dados das empresas",
    }
  }
}

export async function blockCompany(companyId: string, reason: string) {
  try {
    const { error } = await supabase
      .from("companies")
      .update({
        status: "blocked",
        blocked_at: new Date().toISOString(),
        blocked_reason: reason,
      })
      .eq("id", companyId)

    if (error) throw error

    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

export async function unblockCompany(companyId: string) {
  try {
    const { error } = await supabase
      .from("companies")
      .update({
        status: "active",
        blocked_at: null,
        blocked_reason: null,
      })
      .eq("id", companyId)

    if (error) throw error

    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

export async function deleteCompany(companyId: string) {
  try {
    // Buscar user_id da empresa
    const { data: company, error: companyFetchError } = await supabase
      .from("companies")
      .select("user_id")
      .eq("id", companyId)
      .single()

    if (companyFetchError || !company) {
      throw new Error("Empresa não encontrada")
    }

    const userId = company.user_id

    // Deletar empresa
    const { error: deleteCompanyError } = await supabase
      .from("companies")
      .delete()
      .eq("id", companyId)

    if (deleteCompanyError) throw deleteCompanyError

    // Deletar perfil do usuário
    const { error: deleteProfileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId)

    if (deleteProfileError) throw deleteProfileError

    // Deletar do auth.users via service role
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId)

    if (deleteAuthError) throw deleteAuthError

    return { error: null }
  } catch (error) {
    console.error("Erro ao deletar empresa e usuário:", error)
    return {
      error: error instanceof Error ? error.message : "Erro ao excluir empresa e usuário",
    }
  }
}
