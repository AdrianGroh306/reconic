"use client"

import { useState, useCallback } from "react"
import { Search, BookmarkPlus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useYouTubeSearch } from "@/hooks/use-youtube"
import { useDebounce } from "@/hooks/use-debounce"
import { VideoCard } from "@/components/youtube/video-card"
import { ChannelCard } from "@/components/youtube/channel-card"
import { ResultSkeletons } from "@/components/youtube/result-skeletons"
import type { YouTubeVideoResult, YouTubeChannelResult } from "@/lib/youtube"

type Inspiration = {
  id: string
  video_id: string
  thumbnail_url: string
  title: string
}

export function ResearchTab({ initialQuery, projectId }: { initialQuery: string; projectId: string }) {
  const [inputValue, setInputValue] = useState(initialQuery)
  const query = useDebounce(inputValue, 400)
  const queryClient = useQueryClient()

  const { data: inspirations = [] } = useQuery<Inspiration[]>({
    queryKey: ["inspirations", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/inspirations`)
      if (!res.ok) throw new Error("Failed to load inspirations")
      return res.json()
    },
    staleTime: 30 * 1000,
  })

  const { data: videoData, isLoading: vLoading, isError: vError } = useYouTubeSearch(query, "video")
  const { data: channelData, isLoading: cLoading, isError: cError } = useYouTubeSearch(query, "channel")

  const addInspiration = useCallback(async (video: YouTubeVideoResult) => {
    if (!video.thumbnail) return
    await fetch(`/api/projects/${projectId}/inspirations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: video.id, thumbnailUrl: video.thumbnail, title: video.title }),
    })
    queryClient.invalidateQueries({ queryKey: ["inspirations", projectId] })
  }, [projectId, queryClient])

  const removeInspiration = useCallback(async (videoId: string) => {
    await fetch(`/api/projects/${projectId}/inspirations`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    })
    queryClient.invalidateQueries({ queryKey: ["inspirations", projectId] })
  }, [projectId, queryClient])

  const savedVideoIds = new Set(inspirations.map((i) => i.video_id))
  const videos = (videoData as YouTubeVideoResult[])?.filter(
    (v) => (v.durationSeconds ?? Infinity) >= 60
  ) ?? []

  return (
    <div className="space-y-4">
      {/* Inspiration Board */}
      {inspirations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Inspiration Board
          </p>
          <div className="grid grid-cols-3 gap-2">
            {inspirations.map((inspo) => (
              <div key={inspo.video_id} className="relative group rounded-md overflow-hidden aspect-video bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={inspo.thumbnail_url}
                  alt={inspo.title}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                <button
                  type="button"
                  onClick={() => removeInspiration(inspo.video_id)}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5"
                  title="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
                <p className="absolute bottom-0 inset-x-0 px-1.5 py-1 text-[10px] text-white leading-snug line-clamp-1 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  {inspo.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Search YouTube..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>

      {query.trim().length >= 2 ? (
        <Tabs defaultValue="videos">
          <TabsList>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
          </TabsList>
          <TabsContent value="videos" className="mt-4">
            {vLoading ? <ResultSkeletons count={4} /> : vError ? (
              <p className="text-sm text-destructive">Failed to load results.</p>
            ) : videos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No videos found.</p>
            ) : (
              <div className="space-y-3">
                {videos.map((v) => (
                  <div key={v.id} className="relative group">
                    <VideoCard video={v} />
                    {v.thumbnail && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm" variant="secondary" className="h-7 gap-1 text-xs shadow"
                          onClick={() => addInspiration(v)}
                          disabled={savedVideoIds.has(v.id)}
                        >
                          <BookmarkPlus className="h-3.5 w-3.5" />
                          {savedVideoIds.has(v.id) ? "Saved" : "Use as Inspiration"}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="channels" className="mt-4">
            {cLoading ? <ResultSkeletons count={4} /> : cError ? (
              <p className="text-sm text-destructive">Failed to load results.</p>
            ) : (channelData as YouTubeChannelResult[])?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No channels found.</p>
            ) : (
              <div className="space-y-3">
                {(channelData as YouTubeChannelResult[]).map((c) => (
                  <ChannelCard key={c.id} channel={c} showFavorite={true} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          <Search className="mx-auto mb-3 h-8 w-8 opacity-30" />
          <p className="text-sm">Type at least 2 characters to search</p>
        </div>
      )}
    </div>
  )
}
