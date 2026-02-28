import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

async function exchangeCodeForTokens(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${SITE_URL}/api/youtube/callback`,
      grant_type: "authorization_code",
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange failed: ${err}`)
  }

  return res.json() as Promise<{
    access_token: string
    refresh_token?: string
    expires_in: number
  }>
}

async function fetchChannelInfo(accessToken: string) {
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) return null
  const data = await res.json()
  const item = data.items?.[0]
  if (!item) return null

  const snippet = item.snippet as Record<string, unknown>
  const stats = item.statistics as Record<string, unknown>
  const thumbs = snippet.thumbnails as Record<string, { url: string }>

  return {
    channelId: item.id as string,
    channelName: snippet.title as string,
    channelAvatar: thumbs?.high?.url ?? thumbs?.medium?.url ?? thumbs?.default?.url ?? "",
    subscriberCount: parseInt((stats?.subscriberCount as string) ?? "0"),
    videoCount: parseInt((stats?.videoCount as string) ?? "0"),
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  // User denied consent or other error
  if (error) {
    return NextResponse.redirect(`${SITE_URL}/settings?error=youtube_denied`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${SITE_URL}/settings?error=missing_params`)
  }

  // Verify CSRF state
  const cookieStore = await cookies()
  const savedState = cookieStore.get("yt_oauth_state")?.value
  cookieStore.delete("yt_oauth_state")

  if (state !== savedState) {
    return NextResponse.redirect(`${SITE_URL}/settings?error=invalid_state`)
  }

  // Ensure user is authenticated via Supabase
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${SITE_URL}/login`)
  }

  try {
    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code)

    // Fetch YouTube channel info
    const channelInfo = await fetchChannelInfo(tokens.access_token)
    if (!channelInfo) {
      return NextResponse.redirect(`${SITE_URL}/settings?error=no_channel`)
    }

    // Upsert into youtube_accounts table
    await supabase.from("youtube_accounts").upsert(
      {
        user_id: user.id,
        channel_id: channelInfo.channelId,
        channel_name: channelInfo.channelName,
        channel_avatar: channelInfo.channelAvatar,
        subscriber_count: channelInfo.subscriberCount,
        video_count: channelInfo.videoCount,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id,channel_id" }
    )

    return NextResponse.redirect(`${SITE_URL}/settings`)
  } catch (err) {
    console.error("YouTube OAuth callback error:", err)
    return NextResponse.redirect(`${SITE_URL}/settings?error=token_exchange`)
  }
}
