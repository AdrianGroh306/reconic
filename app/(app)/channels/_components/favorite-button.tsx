"use client"

import { Bookmark, BookmarkCheck } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { fetchFavoritedChannels, addFavoritedChannel, deleteFavoritedChannel } from "@/lib/channels"

type Props = {
  channelId: string
  channelTitle: string
  channelThumbnail: string
  subscriberCount?: string
}

export function FavoriteButton({ channelId, channelTitle, channelThumbnail, subscriberCount }: Props) {
  const queryClient = useQueryClient()
  const { data: channels = [] } = useQuery({
    queryKey: ["favorited-channels"],
    queryFn: fetchFavoritedChannels,
    staleTime: 30 * 1000,
  })

  const favorited = channels.some((c) => c.channelId === channelId)

  async function toggle() {
    if (favorited) {
      await deleteFavoritedChannel(channelId)
    } else {
      await addFavoritedChannel({
        channelId,
        title: channelTitle,
        thumbnail: channelThumbnail,
        subscriberCount: subscriberCount ?? null,
      })
    }
    queryClient.invalidateQueries({ queryKey: ["favorited-channels"] })
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} className="gap-2">
      {favorited ? (
        <>
          <BookmarkCheck className="h-4 w-4 text-primary" />
          Saved
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4" />
          Save Channel
        </>
      )}
    </Button>
  )
}
