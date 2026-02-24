"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Users, Video, Calendar, Youtube, Loader2, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { YouTubeVideoResult } from "@/lib/youtube"

type ChannelInfo = {
  id: string
  name: string
  avatar: string
  subscriberCount?: string
  videoCount?: string
}

function formatCount(n: string): string {
  const num = parseInt(n)
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${Math.round(num / 1_000)}K`
  return n
}

function VideoThumb({ video }: { video: YouTubeVideoResult }) {
  const date = new Date(video.publishedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  return (
    <Link
      href={`https://www.youtube.com/watch?v=${video.id}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Card className="hover:bg-muted/50 pt-0 transition-colors overflow-hidden">
        <div className="aspect-video w-full bg-muted relative overflow-hidden">
          {video.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.thumbnail}
              alt={video.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {video.duration && (
            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-mono text-white">
              {video.duration}
            </span>
          )}
        </div>
        <CardContent className="p-3">
          <p className="text-sm font-medium line-clamp-2 leading-snug">{video.title}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{date}</span>
            {video.viewCount && (
              <>
                <span>·</span>
                <span>{parseInt(video.viewCount).toLocaleString()} views</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function ChannelSection() {
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null)
  const [videos, setVideos] = useState<YouTubeVideoResult[]>([])
  const [loading, setLoading] = useState(true)
  const [videosLoading, setVideosLoading] = useState(false)
  const [connected, setConnected] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.provider_token
      if (token) {
        setConnected(true)
        loadChannel(token)
      } else {
        setConnected(false)
        setLoading(false)
      }
    })
  }, [])

  async function loadChannel(token: string) {
    try {
      const res = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error()
      const data = await res.json()
      const item = data.items?.[0]
      if (!item) throw new Error()

      const snippet = item.snippet as Record<string, unknown>
      const stats = item.statistics as Record<string, unknown>
      const thumbs = snippet.thumbnails as Record<string, { url: string }>
      const info: ChannelInfo = {
        id: item.id as string,
        name: snippet.title as string,
        avatar: thumbs?.high?.url ?? thumbs?.medium?.url ?? thumbs?.default?.url ?? "",
        subscriberCount: stats?.subscriberCount as string | undefined,
        videoCount: stats?.videoCount as string | undefined,
      }
      setChannelInfo(info)
      loadVideos(info.id)
    } catch {
      setLoading(false)
    }
  }

  async function loadVideos(channelId: string) {
    setVideosLoading(true)
    try {
      const res = await fetch(`/api/youtube/channel-videos?channelId=${channelId}`)
      if (res.ok) setVideos(await res.json())
    } finally {
      setLoading(false)
      setVideosLoading(false)
    }
  }

  return (
    <section className="space-y-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Your Channel
      </h2>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading channel…</span>
        </div>
      ) : !connected ? (
        <div className="rounded-lg border border-dashed p-8 flex flex-col items-center gap-3 text-center">
          <Youtube className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Connect your YouTube account to see your channel here.
          </p>
          <Link href="/settings" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Youtube className="mr-1.5 h-3.5 w-3.5" />
            Connect in Settings
          </Link>
        </div>
      ) : channelInfo ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            {channelInfo.avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={channelInfo.avatar}
                alt={channelInfo.name}
                className="h-16 w-16 rounded-full object-cover shrink-0"
              />
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{channelInfo.name}</h3>
                <Link
                  href={`https://www.youtube.com/channel/${channelInfo.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {channelInfo.subscriberCount && (
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {formatCount(channelInfo.subscriberCount)} subscribers
                  </Badge>
                )}
                {channelInfo.videoCount && (
                  <Badge variant="secondary" className="gap-1">
                    <Video className="h-3 w-3" />
                    {parseInt(channelInfo.videoCount).toLocaleString()} videos
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Recent Videos</h3>
              <Link href={`/channels/${channelInfo.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                View all
              </Link>
            </div>
            {videosLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-lg bg-muted aspect-video animate-pulse" />
                ))}
              </div>
            ) : videos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {videos.map((v) => (
                  <VideoThumb key={v.id} video={v} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No videos found.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}
