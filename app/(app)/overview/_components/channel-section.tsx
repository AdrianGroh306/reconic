"use client"

import Link from "next/link"
import { Users, Video, Calendar, Youtube, Loader2, ExternalLink } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { getYouTubeAccount, type YouTubeAccount } from "@/lib/youtube-account"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { YouTubeVideoResult } from "@/lib/youtube"

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toString()
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
              referrerPolicy="no-referrer"
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

async function fetchChannelVideos(channelId: string): Promise<YouTubeVideoResult[]> {
  const res = await fetch(`/api/youtube/channel-videos?channelId=${channelId}`)
  if (!res.ok) return []
  return res.json()
}

export function ChannelSection() {
  const { data: account, isLoading: accountLoading } = useQuery<YouTubeAccount | null>({
    queryKey: ["youtube-account"],
    queryFn: () => getYouTubeAccount(),
    staleTime: 5 * 60 * 1000,
  })

  const { data: videos = [], isLoading: videosLoading } = useQuery<YouTubeVideoResult[]>({
    queryKey: ["channel-videos", account?.channel_id],
    queryFn: () => fetchChannelVideos(account!.channel_id),
    enabled: !!account?.channel_id,
    staleTime: 5 * 60 * 1000,
  })

  const loading = accountLoading
  const connected = account !== undefined ? !!account : null

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
      ) : account ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            {account.channel_avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={account.channel_avatar}
                alt={account.channel_name}
                className="h-16 w-16 rounded-full object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{account.channel_name}</h3>
                <Link
                  href={`https://www.youtube.com/channel/${account.channel_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {account.subscriber_count > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {formatCount(account.subscriber_count)} subscribers
                  </Badge>
                )}
                {account.video_count > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <Video className="h-3 w-3" />
                    {account.video_count.toLocaleString()} videos
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Recent Videos</h3>
              <Link href={`/channels/${account.channel_id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
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
