"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { YouTubeVideoResult } from "@/lib/youtube"

export function VideoCard({ video }: { video: YouTubeVideoResult }) {
  const date = new Date(video.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <Card>
      <CardContent className="flex gap-4 p-4">
        {video.thumbnail && (
          <div className="w-[160px] aspect-video shrink-0 rounded overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={video.thumbnail}
              alt={video.title}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium leading-snug line-clamp-2">{video.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {video.channelTitle} · {date}
            </p>
            {video.duration && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 font-mono">
                {video.duration}
              </Badge>
            )}
          </div>
          {video.viewCount && (
            <p className="text-xs text-muted-foreground mt-1">
              {parseInt(video.viewCount).toLocaleString()} views
            </p>
          )}
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {video.description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
