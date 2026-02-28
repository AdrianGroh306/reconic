"use client"

import Link from "next/link"
import { BookmarkX, Bookmark } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { loadFavoritedChannels, removeFavoritedChannel } from "@/lib/channels"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

function formatSubscriberCount(count: string): string {
  const n = parseInt(count)
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`
  return String(n)
}

export default function ChannelsPage() {
  const queryClient = useQueryClient()
  const { data: channels = [] } = useQuery({
    queryKey: ["favorited-channels"],
    queryFn: loadFavoritedChannels,
    staleTime: Infinity,
  })

  function handleRemove(id: string) {
    removeFavoritedChannel(id)
    queryClient.invalidateQueries({ queryKey: ["favorited-channels"] })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Saved Channels</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Channels you&apos;ve saved as inspiration sources.
        </p>
      </div>

      {channels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <Bookmark className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">
            No saved channels yet. Find channels in Research and save them.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => (
            <Card key={channel.id} className="relative hover:bg-muted/50 transition-colors">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 z-10"
                onClick={() => handleRemove(channel.id)}
                title="Remove channel"
              >
                <BookmarkX className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Link href={`/channels/${channel.id}`}>
                <CardContent className="flex gap-4 p-4">
                  {channel.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={channel.thumbnail}
                      alt={channel.title}
                      width={56}
                      height={56}
                      className="rounded-full shrink-0 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-muted shrink-0 flex items-center justify-center text-lg font-semibold">
                      {channel.title[0]}
                    </div>
                  )}
                  <div className="min-w-0 pr-6">
                    <p className="font-medium truncate">{channel.title}</p>
                    {channel.subscriberCount && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatSubscriberCount(channel.subscriberCount)} subscribers
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Saved {new Date(channel.savedAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
