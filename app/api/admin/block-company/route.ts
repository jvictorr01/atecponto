import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: NextRequest) {
  const { companyId, reason } = await req.json()

  try {
    const { error } = await supabaseAdmin
      .from("companies")
      .update({
        status: "blocked",
        blocked_at: new Date().toISOString(),
        blocked_reason: reason,
      })
      .eq("id", companyId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao bloquear empresa" }, { status: 500 })
  }
}