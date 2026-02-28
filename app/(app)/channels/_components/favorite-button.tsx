"use client"

import { useState } from "react"
import { Bookmark, BookmarkCheck } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { saveFavoritedChannel, removeFavoritedChannel, isFavoritedChannel } from "@/lib/channels"

type Props = {
  channelId: string
  channelTitle: string
  channelThumbnail: string
  subscriberCount?: string
}

export function FavoriteButton({ channelId, channelTitle, channelThumbnail, subscriberCount }: Props) {
  const queryClient = useQueryClient()
  const [favorited, setFavorited] = useState(() => isFavoritedChannel(channelId))

  function toggle() {
    if (favorited) {
      removeFavoritedChannel(channelId)
      setFavorited(false)
    } else {
      saveFavoritedChannel({ id: channelId, title: channelTitle, thumbnail: channelThumbnail, subscriberCount })
      setFavorited(true)
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
