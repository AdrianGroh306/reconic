import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

function base64urlEncode(buffer: ArrayBuffer): string {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(
      new URL("/login", process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000")
    )
  }

  const clientId = process.env.CANVA_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "CANVA_CLIENT_ID not configured" }, { status: 500 })
  }

  // Generate PKCE code_verifier (random 32 bytes → base64url)
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32))
  const codeVerifier = base64urlEncode(verifierBytes.buffer)

  // Derive code_challenge = SHA-256(code_verifier) → base64url
  const encoder = new TextEncoder()
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(codeVerifier))
  const codeChallenge = base64urlEncode(digest)

  // CSRF state
  const state = crypto.randomUUID()

  const cookieStore = await cookies()
  cookieStore.set("canva_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  })
  cookieStore.set("canva_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  })

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000"}/api/canva/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "design:content:read design:content:write",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  })

  return NextResponse.redirect(`https://www.canva.com/api/oauth/authorize?${params.toString()}`)
}
