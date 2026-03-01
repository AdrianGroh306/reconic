export type FavoritedChannel = {
  id: string           // Supabase row UUID
  channelId: string    // YouTube channel ID
  title: string
  thumbnail: string | null
  subscriberCount: string | null
  savedAt: string
}

// ─── API helpers ──────────────────────────────────────────────────────────────

export async function fetchFavoritedChannels(): Promise<FavoritedChannel[]> {
  const res = await fetch("/api/channels/favorited")
  if (!res.ok) throw new Error("Failed to fetch favorited channels")
  return res.json()
}

export async function addFavoritedChannel(
  channel: Pick<FavoritedChannel, "channelId" | "title" | "thumbnail" | "subscriberCount">
): Promise<void> {
  const res = await fetch("/api/channels/favorited", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(channel),
  })
  if (!res.ok) throw new Error("Failed to save channel")
}

export async function deleteFavoritedChannel(channelId: string): Promise<void> {
  const res = await fetch("/api/channels/favorited", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channelId }),
  })
  if (!res.ok) throw new Error("Failed to remove channel")
}
