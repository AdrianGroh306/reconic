import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title } = await request.json() as { title?: string }

  // Get Canva access token from DB (server-side read)
  const { data: account } = await supabase
    .from("canva_accounts")
    .select("access_token, refresh_token, token_expires_at")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!account) {
    return NextResponse.json({ error: "Canva not connected" }, { status: 403 })
  }

  // Use a fresh token (handle refresh inline on server)
  let accessToken = account.access_token
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null
  const isExpired = !expiresAt || expiresAt <= new Date(Date.now() + 5 * 60 * 1000)

  if (isExpired && account.refresh_token) {
    const refreshRes = await fetch("https://api.canva.com/rest/v1/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.CANVA_CLIENT_ID!,
        client_secret: process.env.CANVA_CLIENT_SECRET!,
        refresh_token: account.refresh_token,
      }),
    })
    if (refreshRes.ok) {
      const tokens = await refreshRes.json() as { access_token: string; expires_in: number }
      accessToken = tokens.access_token
      await supabase.from("canva_accounts").update({
        access_token: tokens.access_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id)
    }
  }

  const res = await fetch("https://api.canva.com/rest/v1/designs", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      design_type: {
        type: "custom",
        width: 1280,
        height: 720,
      },
      title: title ?? "YouTube Thumbnail",
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("Canva create design failed:", err)
    return NextResponse.json({ error: "Failed to create Canva design" }, { status: 500 })
  }

  const data = await res.json() as {
    design?: { id?: string; urls?: { edit_url?: string } }
  }

  const designId = data.design?.id
  const editUrl = data.design?.urls?.edit_url

  if (!designId || !editUrl) {
    return NextResponse.json({ error: "Unexpected Canva response" }, { status: 500 })
  }

  return NextResponse.json({ designId, editUrl })
}
