export type YouTubeVideoResult = {
  id: string
  title: string
  channelId?: string
  channelTitle: string
  publishedAt: string
  thumbnail: string
  description: string
  duration?: string
  durationSeconds?: number
  isLongform?: boolean
  viewCount?: string
}

export type YouTubeChannelResult = {
  id: string
  title: string
  description: string
  thumbnail: string
  subscriberCount?: string
}

function getApiKey(): string {
  const key = process.env.YOUTUBE_DATA_API_KEY
  if (!key) {
    throw new Error("YOUTUBE_DATA_API_KEY environment variable is not set")
  }
  return key
}

export function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const h = parseInt(match[1] ?? "0")
  const m = parseInt(match[2] ?? "0")
  const s = parseInt(match[3] ?? "0")
  return h * 3600 + m * 60 + s
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }
  return `${m}:${String(s).padStart(2, "0")}`
}

async function enrichWithDuration(
  apiKey: string,
  videoIds: string[]
): Promise<Map<string, { durationSeconds: number; duration: string; viewCount?: string }>> {
  if (videoIds.length === 0) return new Map()

  const url = new URL("https://www.googleapis.com/youtube/v3/videos")
  url.searchParams.set("part", "contentDetails,statistics")
  url.searchParams.set("id", videoIds.join(","))
  url.searchParams.set("key", apiKey)

  const res = await fetch(url.toString())
  const data = res.ok ? await res.json() : { items: [] }

  const map = new Map<string, { durationSeconds: number; duration: string; viewCount?: string }>()
  for (const item of (data.items ?? []) as Record<string, unknown>[]) {
    const id = item.id as string
    const contentDetails = item.contentDetails as Record<string, unknown>
    const statistics = item.statistics as Record<string, unknown>
    const isoDuration = contentDetails?.duration as string | undefined
    const durationSeconds = isoDuration ? parseDuration(isoDuration) : 0
    map.set(id, {
      durationSeconds,
      duration: durationSeconds > 0 ? formatDuration(durationSeconds) : "",
      viewCount: statistics?.viewCount as string | undefined,
    })
  }
  return map
}

export async function searchVideos(query: string): Promise<YouTubeVideoResult[]> {
  const apiKey = getApiKey()
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search")
  searchUrl.searchParams.set("part", "snippet")
  searchUrl.searchParams.set("type", "video")
  searchUrl.searchParams.set("maxResults", "12")
  searchUrl.searchParams.set("q", query)
  searchUrl.searchParams.set("key", apiKey)

  const res = await fetch(searchUrl.toString())
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `YouTube API error: ${res.status}`)
  }

  const data = await res.json()
  const items: Record<string, unknown>[] = data.items ?? []

  const videoIds = items
    .map((item) => (item.id as Record<string, unknown>).videoId as string)
    .filter(Boolean)

  const detailsMap = await enrichWithDuration(apiKey, videoIds)

  return items.map((item) => {
    const snippet = item.snippet as Record<string, unknown>
    const id = item.id as Record<string, unknown>
    const videoId = id.videoId as string
    const thumbnails = snippet.thumbnails as Record<string, { url: string }>
    const details = detailsMap.get(videoId)

    return {
      id: videoId,
      title: snippet.title as string,
      channelId: snippet.channelId as string,
      channelTitle: snippet.channelTitle as string,
      publishedAt: snippet.publishedAt as string,
      thumbnail: thumbnails?.medium?.url ?? thumbnails?.default?.url ?? "",
      description: snippet.description as string,
      duration: details?.duration || undefined,
      durationSeconds: details?.durationSeconds || undefined,
      isLongform: (details?.durationSeconds ?? 0) >= 600,
      viewCount: details?.viewCount,
    }
  })
}

export async function searchChannels(query: string): Promise<YouTubeChannelResult[]> {
  const apiKey = getApiKey()
  const url = new URL("https://www.googleapis.com/youtube/v3/search")
  url.searchParams.set("part", "snippet")
  url.searchParams.set("type", "channel")
  url.searchParams.set("maxResults", "12")
  url.searchParams.set("q", query)
  url.searchParams.set("key", apiKey)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `YouTube API error: ${res.status}`)
  }

  const data = await res.json()
  const items: Record<string, unknown>[] = data.items ?? []

  const channelIds = items
    .map((item) => ((item.id as Record<string, unknown>).channelId as string))
    .filter(Boolean)

  // Batch-fetch subscriber counts
  const statsMap = new Map<string, string>()
  if (channelIds.length > 0) {
    const statsUrl = new URL("https://www.googleapis.com/youtube/v3/channels")
    statsUrl.searchParams.set("part", "statistics")
    statsUrl.searchParams.set("id", channelIds.join(","))
    statsUrl.searchParams.set("key", apiKey)
    const statsRes = await fetch(statsUrl.toString())
    if (statsRes.ok) {
      const statsData = await statsRes.json()
      for (const ch of (statsData.items ?? []) as Record<string, unknown>[]) {
        const stats = ch.statistics as Record<string, unknown>
        if (stats?.subscriberCount) {
          statsMap.set(ch.id as string, stats.subscriberCount as string)
        }
      }
    }
  }

  return items.map((item) => {
    const snippet = item.snippet as Record<string, unknown>
    const id = item.id as Record<string, unknown>
    const channelId = id.channelId as string
    const thumbnails = snippet.thumbnails as Record<string, { url: string }>
    return {
      id: channelId,
      title: snippet.title as string,
      description: snippet.description as string,
      thumbnail:
        thumbnails?.medium?.url ??
        thumbnails?.default?.url ??
        "",
      subscriberCount: statsMap.get(channelId),
    }
  })
}

export async function getVideoDetails(videoId: string) {
  const apiKey = getApiKey()
  const url = new URL("https://www.googleapis.com/youtube/v3/videos")
  url.searchParams.set("part", "snippet,statistics,contentDetails")
  url.searchParams.set("id", videoId)
  url.searchParams.set("key", apiKey)

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`YouTube API error: ${res.status}`)
  }

  const data = await res.json()
  return data.items?.[0] ?? null
}

export async function getChannelDetails(channelId: string) {
  const apiKey = getApiKey()
  const url = new URL("https://www.googleapis.com/youtube/v3/channels")
  url.searchParams.set("part", "snippet,statistics")
  url.searchParams.set("id", channelId)
  url.searchParams.set("key", apiKey)

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`YouTube API error: ${res.status}`)
  }

  const data = await res.json()
  return data.items?.[0] ?? null
}

export async function getChannelVideos(
  channelId: string,
  maxResults = 12
): Promise<YouTubeVideoResult[]> {
  const apiKey = getApiKey()

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search")
  searchUrl.searchParams.set("part", "snippet")
  searchUrl.searchParams.set("type", "video")
  searchUrl.searchParams.set("channelId", channelId)
  searchUrl.searchParams.set("order", "date")
  searchUrl.searchParams.set("maxResults", String(maxResults))
  searchUrl.searchParams.set("key", apiKey)

  const res = await fetch(searchUrl.toString())
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `YouTube API error: ${res.status}`)
  }

  const data = await res.json()
  const items: Record<string, unknown>[] = data.items ?? []

  if (items.length === 0) return []

  const videoIds = items
    .map((item) => (item.id as Record<string, unknown>).videoId as string)
    .filter(Boolean)

  const detailsMap = await enrichWithDuration(apiKey, videoIds)

  return items.map((item) => {
    const snippet = item.snippet as Record<string, unknown>
    const id = item.id as Record<string, unknown>
    const videoId = id.videoId as string
    const thumbnails = snippet.thumbnails as Record<string, { url: string }>
    const details = detailsMap.get(videoId)

    return {
      id: videoId,
      title: snippet.title as string,
      channelId: snippet.channelId as string,
      channelTitle: snippet.channelTitle as string,
      publishedAt: snippet.publishedAt as string,
      thumbnail: thumbnails?.medium?.url ?? thumbnails?.default?.url ?? "",
      description: snippet.description as string,
      duration: details?.duration || undefined,
      durationSeconds: details?.durationSeconds || undefined,
      isLongform: (details?.durationSeconds ?? 0) >= 600,
      viewCount: details?.viewCount,
    }
  })
}
