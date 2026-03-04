"use client"

import { useState } from "react"
import Link from "next/link"
import { BookmarkX, Bookmark } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchFavoritedChannels, deleteFavoritedChannel } from "@/lib/channels"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCount } from "@/lib/utils"

export default function ChannelsPage() {
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const { data: channels, isLoading } = useQuery({
    queryKey: ["favorited-channels"],
    queryFn: fetchFavoritedChannels,
    staleTime: 30 * 1000,
  })

  async function confirmDelete() {
    if (!deleteTarget) return
    await deleteFavoritedChannel(deleteTarget)
    queryClient.invalidateQueries({ queryKey: ["favorited-channels"] })
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Saved Channels</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Channels you&apos;ve saved as inspiration sources.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex gap-4 p-4">
                <Skeleton className="h-14 w-14 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !channels || channels.length === 0 ? (
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
                onClick={() => setDeleteTarget(channel.channelId)}
                title="Remove channel"
              >
                <BookmarkX className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Link href={`/channels/${channel.channelId}`}>
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
                        {formatCount(parseInt(channel.subscriberCount))} subscribers
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

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove channel?</DialogTitle>
            <DialogDescription>
              This channel will be removed from your saved channels.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
