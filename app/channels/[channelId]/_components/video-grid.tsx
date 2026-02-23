"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { YouTubeVideoResult } from "@/lib/youtube"

function VideoCard({ video }: { video: YouTubeVideoResult }) {
  const date = new Date(video.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <Link href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="flex gap-4 p-4">
          {video.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.thumbnail}
              alt={video.title}
              width={200}
              height={113}
              className="rounded shrink-0 object-cover"
            />
          )}
          <div className="min-w-0">
            <p className="font-medium text-sm line-clamp-2 leading-snug">{video.title}</p>
            <div className="flex items-center gap-2 flex-wrap mt-1.5">
              <p className="text-xs text-muted-foreground">{date}</p>
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
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function ChannelVideoGrid({ videos }: { videos: YouTubeVideoResult[] }) {
  const [longformOnly, setLongformOnly] = useState(false)

  const filtered = longformOnly ? videos.filter((v) => v.isLongform) : videos
  const longformCount = videos.filter((v) => v.isLongform).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">
          Recent Videos
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({longformCount} longform)
          </span>
        </h2>
        <Button
          variant={longformOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setLongformOnly(!longformOnly)}
        >
          Longform only
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No longform videos found.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </div>
  )
}
