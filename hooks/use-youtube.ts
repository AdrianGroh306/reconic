import { useQuery } from "@tanstack/react-query"
import type { YouTubeVideoResult, YouTubeChannelResult } from "@/lib/youtube"

export function useYouTubeSearch(query: string, type: "video" | "channel") {
  return useQuery<YouTubeVideoResult[] | YouTubeChannelResult[]>({
    queryKey: ["youtube", "search", type, query],
    queryFn: async () => {
      const params = new URLSearchParams({ q: query, type })
      const res = await fetch(`/api/youtube/search?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error ?? `Request failed: ${res.status}`)
      }
      return res.json()
    },
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 5,
  })
}
