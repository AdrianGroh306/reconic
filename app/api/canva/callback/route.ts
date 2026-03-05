import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000"
const CANVA_TOKEN_URL = "https://api.canva.com/rest/v1/oauth/token"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(`${SITE_URL}/settings?error=canva_denied`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${SITE_URL}/settings?error=canva_missing_params`)
  }

  const cookieStore = await cookies()
  const savedState = cookieStore.get("canva_oauth_state")?.value
  const codeVerifier = cookieStore.get("canva_code_verifier")?.value
  cookieStore.delete("canva_oauth_state")
  cookieStore.delete("canva_code_verifier")

  if (state !== savedState || !codeVerifier) {
    return NextResponse.redirect(`${SITE_URL}/settings?error=canva_invalid_state`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${SITE_URL}/login`)
  }

  try {
    const redirectUri = `${SITE_URL}/api/canva/callback`

    // Exchange code for tokens
    const tokenRes = await fetch(CANVA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.CANVA_CLIENT_ID!,
        client_secret: process.env.CANVA_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        code,
        code_verifier: codeVerifier,
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error("Canva token exchange failed:", err)
      return NextResponse.redirect(`${SITE_URL}/settings?error=canva_token_exchange`)
    }

    const tokens = await tokenRes.json() as {
      access_token: string
      refresh_token?: string
      expires_in: number
    }

    // Fetch Canva user info
    const meRes = await fetch("https://api.canva.com/rest/v1/users/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    let canvaUserId = "unknown"
    let displayName: string | null = null

    if (meRes.ok) {
      const me = await meRes.json() as { user?: { id?: string; display_name?: string } }
      canvaUserId = me.user?.id ?? "unknown"
      displayName = me.user?.display_name ?? null
    }

    await supabase.from("canva_accounts").upsert(
      {
        user_id: user.id,
        canva_user_id: canvaUserId,
        display_name: displayName,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    return NextResponse.redirect(`${SITE_URL}/settings?canva=connected`)
  } catch (err) {
    console.error("Canva OAuth callback error:", err)
    return NextResponse.redirect(`${SITE_URL}/settings?error=canva_callback`)
  }
}
