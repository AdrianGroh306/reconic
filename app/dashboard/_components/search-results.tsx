"use client"

import { useYouTubeSearch } from "@/hooks/use-youtube"
import { VideoCard } from "@/components/youtube/video-card"
import { ChannelCard } from "@/components/youtube/channel-card"
import { ResultSkeletons } from "@/components/youtube/result-skeletons"
import type { YouTubeVideoResult, YouTubeChannelResult } from "@/lib/youtube"

function EmptyState({ query }: { query: string }) {
  return (
    <div className="py-16 text-center text-muted-foreground">
      <p className="text-lg">No results found for &ldquo;{query}&rdquo;</p>
      <p className="mt-1 text-sm">Try a different search term.</p>
    </div>
  )
}

function ErrorState({ error }: { error: Error }) {
  const isKeyMissing =
    error.message.includes("API key not configured") ||
    error.message.includes("YOUTUBE_DATA_API_KEY")
  return (
    <div className="py-16 text-center">
      <p className="text-lg font-medium text-destructive">
        {isKeyMissing ? "YouTube API key not configured" : "Something went wrong"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {isKeyMissing
          ? "Add YOUTUBE_DATA_API_KEY to your .env.local file and restart the server."
          : error.message}
      </p>
    </div>
  )
}

export function VideoResults({ query }: { query: string }) {
  const { data, isLoading, isError, error } = useYouTubeSearch(query, "video")

  if (isLoading) return <ResultSkeletons />
  if (isError) return <ErrorState error={error as Error} />

  const videos = (data ?? []) as YouTubeVideoResult[]
  if (videos.length === 0) return <EmptyState query={query} />

  return (
    <div className="space-y-3">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} />
      ))}
    </div>
  )
}

export function ChannelResults({ query }: { query: string }) {
  const { data, isLoading, isError, error } = useYouTubeSearch(query, "channel")

  if (isLoading) return <ResultSkeletons />
  if (isError) return <ErrorState error={error as Error} />

  const channels = (data ?? []) as YouTubeChannelResult[]
  if (channels.length === 0) return <EmptyState query={query} />

  return (
    <div className="space-y-3">
      {channels.map((c) => (
        <ChannelCard key={c.id} channel={c} />
      ))}
    </div>
  )
}
