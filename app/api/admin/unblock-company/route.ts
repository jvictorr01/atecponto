import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: NextRequest) {
  const { companyId } = await req.json()

  try {
    const { error } = await supabaseAdmin
      .from("companies")
      .update({
        status: "active",
        blocked_at: null,
        blocked_reason: null,
      })
      .eq("id", companyId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao desbloquear empresa" }, { status: 500 })
  }
}