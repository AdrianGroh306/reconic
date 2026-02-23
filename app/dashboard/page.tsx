"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDebounce } from "@/hooks/use-debounce"
import { VideoResults, ChannelResults } from "./_components/search-results"

export default function DashboardPage() {
  const [inputValue, setInputValue] = useState("")
  const query = useDebounce(inputValue, 400)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Research</h1>
        <p className="mt-1 text-muted-foreground">
          Analyze YouTube trends, track competitors, and discover content opportunities.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Search YouTube videos and channels..."
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
            <VideoResults query={query} />
          </TabsContent>
          <TabsContent value="channels" className="mt-4">
            <ChannelResults query={query} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          <Search className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p>Type at least 2 characters to search</p>
        </div>
      )}
    </div>
  )
}
