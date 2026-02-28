import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Fetch the current account record
  const { data: account } = await supabase
    .from("youtube_accounts")
    .select("access_token, refresh_token, token_expires_at")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (!account) return NextResponse.json({ error: "No YouTube account" }, { status: 404 })
  if (!account.refresh_token) {
    return NextResponse.json({ access_token: account.access_token })
  }

  // Check if actually expired (with 5 min buffer)
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null
  const isExpired = !expiresAt || expiresAt <= new Date(Date.now() + 5 * 60 * 1000)
  if (!isExpired) {
    return NextResponse.json({ access_token: account.access_token })
  }

  // Call Google token endpoint to refresh
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
    }),
  })

  if (!res.ok) {
    // Refresh failed — return existing token as fallback
    return NextResponse.json({ access_token: account.access_token })
  }

  const tokens = await res.json() as { access_token: string; expires_in: number }

  // Persist the new token to DB
  await supabase
    .from("youtube_accounts")
    .update({
      access_token: tokens.access_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)

  return NextResponse.json({ access_token: tokens.access_token })
}
