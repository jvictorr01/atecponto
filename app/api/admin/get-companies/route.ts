import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
  try {
    const { data: companies, error } = await supabaseAdmin
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    if (!companies) return NextResponse.json({ companies: [] })

    const userIds = companies.map((c) => c.user_id).filter(Boolean)

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .in("id", userIds)

    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const profile = profiles?.find((p) => p.id === company.user_id)

        const { count: employeeCount } = await supabaseAdmin
          .from("employees")
          .select("*", { count: "exact", head: true })
          .eq("company_id", company.id)

        return {
          ...company,
          email: profile?.email || company.email || "",
          whatsapp: profile?.whatsapp || company.whatsapp || "",
          cnpj: profile?.cnpj || company.cnpj || "",
          employee_count: employeeCount || 0,
        }
      })
    )

    return NextResponse.json({ companies: companiesWithStats })
  } catch (err) {
    console.error("[GET_COMPANIES_ERROR]", err)
    return NextResponse.json({ error: "Erro ao carregar empresas" }, { status: 500 })
  }
}