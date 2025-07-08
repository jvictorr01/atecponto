import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: NextRequest) {
  const { companyId } = await req.json()

  try {
    const { data: company, error: fetchError } = await supabaseAdmin
      .from("companies")
      .select("user_id")
      .eq("id", companyId)
      .single()

    if (fetchError || !company) {
      throw new Error("Empresa não encontrada")
    }

    const userId = company.user_id

    const { error: deleteCompanyError } = await supabaseAdmin.from("companies").delete().eq("id", companyId)
    if (deleteCompanyError) throw deleteCompanyError

    const { error: deleteProfileError } = await supabaseAdmin.from("profiles").delete().eq("id", userId)
    if (deleteProfileError) throw deleteProfileError

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteAuthError) throw deleteAuthError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir empresa:", error)
    return NextResponse.json({ error: "Erro ao excluir empresa" }, { status: 500 })
  }
}