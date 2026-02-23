"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useYouTubeSearch } from "@/hooks/use-youtube"
import { useDebounce } from "@/hooks/use-debounce"
import { VideoCard } from "@/components/youtube/video-card"
import { ChannelCard } from "@/components/youtube/channel-card"
import { ResultSkeletons } from "@/components/youtube/result-skeletons"
import type { YouTubeVideoResult, YouTubeChannelResult } from "@/lib/youtube"

export function ResearchTab({ initialQuery }: { initialQuery: string }) {
  const [inputValue, setInputValue] = useState(initialQuery)
  const query = useDebounce(inputValue, 400)

  const { data: videoData, isLoading: vLoading, isError: vError } = useYouTubeSearch(query, "video")
  const { data: channelData, isLoading: cLoading, isError: cError } = useYouTubeSearch(query, "channel")

  return (
    <div className="space-y-4">
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
            ) : (videoData as YouTubeVideoResult[])?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No videos found.</p>
            ) : (
              <div className="space-y-3">
                {(videoData as YouTubeVideoResult[]).map((v) => (
                  <VideoCard key={v.id} video={v} />
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
                  <ChannelCard key={c.id} channel={c} />
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
