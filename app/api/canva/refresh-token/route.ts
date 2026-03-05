import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: account } = await supabase
    .from("canva_accounts")
    .select("access_token, refresh_token, token_expires_at")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!account) return NextResponse.json({ error: "No Canva account" }, { status: 404 })
  if (!account.refresh_token) {
    return NextResponse.json({ access_token: account.access_token })
  }

  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null
  const isExpired = !expiresAt || expiresAt <= new Date(Date.now() + 5 * 60 * 1000)
  if (!isExpired) {
    return NextResponse.json({ access_token: account.access_token })
  }

  const res = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.CANVA_CLIENT_ID!,
      client_secret: process.env.CANVA_CLIENT_SECRET!,
      refresh_token: account.refresh_token,
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ access_token: account.access_token })
  }

  const tokens = await res.json() as { access_token: string; expires_in: number }

  await supabase
    .from("canva_accounts")
    .update({
      access_token: tokens.access_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)

  return NextResponse.json({ access_token: tokens.access_token })
}
