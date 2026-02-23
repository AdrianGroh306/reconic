"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import type { YouTubeChannelResult } from "@/lib/youtube"

function formatSubscriberCount(count: string): string {
  const n = parseInt(count)
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`
  return String(n)
}

export function ChannelCard({ channel }: { channel: YouTubeChannelResult }) {
  return (
    <Link href={`/channels/${channel.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="flex gap-4 p-4">
          {channel.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={channel.thumbnail}
              alt={channel.title}
              width={64}
              height={64}
              className="rounded-full shrink-0 object-cover"
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
