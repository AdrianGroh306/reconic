import { createClient } from "@/lib/supabase/client"

export type YouTubeAccount = {
  id: string
  user_id: string
  channel_id: string
  channel_name: string
  channel_avatar: string | null
  subscriber_count: number
  video_count: number
  access_token: string
  refresh_token: string | null
  token_expires_at: string | null
  niche: string | null
  avg_video_duration_seconds: number | null
  upload_frequency: string | null
  top_tags: string[] | null
  last_synced_at: string
}

/** Get the user's linked YouTube account (first one) */
export async function getYouTubeAccount(): Promise<YouTubeAccount | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("youtube_accounts")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  return data as YouTubeAccount | null
}

/** Save or update YouTube account after OAuth */
export async function upsertYouTubeAccount(params: {
  channelId: string
  channelName: string
  channelAvatar?: string
  subscriberCount?: number
  videoCount?: number
  accessToken: string
  refreshToken?: string
}): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  await supabase
    .from("youtube_accounts")
    .upsert(
      {
        user_id: user.id,
        channel_id: params.channelId,
        channel_name: params.channelName,
        channel_avatar: params.channelAvatar ?? null,
        subscriber_count: params.subscriberCount ?? 0,
        video_count: params.videoCount ?? 0,
        access_token: params.accessToken,
        refresh_token: params.refreshToken ?? null,
        updated_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id,channel_id" }
    )
}

/** Update channel metadata (niche, tags, etc.) */
export async function updateChannelMetadata(
  channelId: string,
  metadata: {
    niche?: string
    avg_video_duration_seconds?: number
    upload_frequency?: string
    top_tags?: string[]
  }
): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from("youtube_accounts")
    .update({
      ...metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("channel_id", channelId)
}

/** Remove YouTube account link */
export async function removeYouTubeAccount(channelId: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from("youtube_accounts")
    .delete()
    .eq("user_id", user.id)
    .eq("channel_id", channelId)
}

/** Get the access token for YouTube API calls, refreshing if expired */
export async function getYouTubeAccessToken(): Promise<string | null> {
  const account = await getYouTubeAccount()
  if (!account) return null

  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null
  const isExpired = !expiresAt || expiresAt <= new Date(Date.now() + 5 * 60 * 1000)

  if (!isExpired) return account.access_token

  // Trigger server-side refresh
  try {
    const res = await fetch("/api/youtube/refresh-token", { method: "POST" })
    if (res.ok) {
      const data = await res.json() as { access_token?: string }
      return data.access_token ?? account.access_token
    }
  } catch {
    // Network error — fall through to old token
  }

  return account.access_token
}
