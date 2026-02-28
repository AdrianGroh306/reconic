"use client"

import Link from "next/link"
import { Bookmark, BookmarkCheck } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { saveFavoritedChannel, removeFavoritedChannel, isFavoritedChannel } from "@/lib/channels"
import { useState } from "react"
import type { YouTubeChannelResult } from "@/lib/youtube"

function formatSubscriberCount(count: string): string {
  const n = parseInt(count)
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`
  return String(n)
}

export function ChannelCard({
  channel,
  showFavorite = false,
}: {
  channel: YouTubeChannelResult
  showFavorite?: boolean
}) {
  const queryClient = useQueryClient()
  const [favorited, setFavorited] = useState(() => isFavoritedChannel(channel.id))

  function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (favorited) {
      removeFavoritedChannel(channel.id)
      setFavorited(false)
    } else {
      saveFavoritedChannel({
        id: channel.id,
        title: channel.title,
        thumbnail: channel.thumbnail ?? "",
        subscriberCount: channel.subscriberCount,
      })
      setFavorited(true)
    }
    queryClient.invalidateQueries({ queryKey: ["favorited-channels"] })
  }

  return (
    <Link href={`/channels/${channel.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer relative">
        {showFavorite && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 z-10"
            onClick={toggleFavorite}
            title={favorited ? "Remove from saved" : "Save channel"}
          >
            {favorited ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        )}
        <CardContent className="flex gap-4 p-4">
          {channel.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={channel.thumbnail}
              alt={channel.title}
              width={64}
              height={64}
              className="rounded-full shrink-0 object-cover"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="min-w-0">
            <p className="font-medium">{channel.title}</p>
            {channel.subscriberCount && (
              <p className="text-xs text-muted-foreground">
                {formatSubscriberCount(channel.subscriberCount)} subscribers
              </p>
            )}
            <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
              {channel.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
