"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Search, Sparkles, Youtube, Clapperboard } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProject } from "@/hooks/use-projects"
import { ProjectHeader } from "./_components/project-header"
import { ConceptTab } from "./_components/concept-tab"
import { ResearchTab } from "./_components/research-tab"
import { ScriptTab } from "./_components/script-tab"
import { ProductionTab } from "./_components/production-tab"
import { PublishTab } from "./_components/publish-tab"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = params.id as string

  const { data: project, isLoading } = useProject(id)
  const [headerCollapsed, setHeaderCollapsed] = useState(false)

  if (isLoading) return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-1.5">
        <div className="h-4 w-20 rounded bg-muted" />
      </div>
      <div className="flex items-start gap-5">
        <div className="shrink-0 rounded-lg bg-muted" style={{ width: 320, height: 220 }} />
        <div className="flex-1 space-y-3">
          <div className="h-7 w-3/4 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
          <div className="flex gap-2 pt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-7 w-20 rounded-full bg-muted" />
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded bg-muted" />
        ))}
      </div>
    </div>
  )
  if (!project) {
    router.replace("/projects")
    return null
  }

  function handleProjectUpdate() {
    queryClient.invalidateQueries({ queryKey: ["project", id] })
    queryClient.invalidateQueries({ queryKey: ["projects"] })
  }

  return (
    <div className="space-y-6">
      <ProjectHeader
        project={project}
        onUpdate={handleProjectUpdate}
        collapsed={headerCollapsed}
        onToggleCollapse={() => setHeaderCollapsed((p) => !p)}
      />

      <Tabs defaultValue="concept">
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="concept">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Concept
          </TabsTrigger>
          <TabsTrigger value="research">
            <Search className="mr-1.5 h-3.5 w-3.5" />
            Inspiration
          </TabsTrigger>
          <TabsTrigger value="script">Script</TabsTrigger>
          <TabsTrigger value="production">
            <Clapperboard className="mr-1.5 h-3.5 w-3.5" />
            Production
          </TabsTrigger>
          <TabsTrigger value="publish">
            <Youtube className="mr-1.5 h-3.5 w-3.5" />
            Publish
          </TabsTrigger>
        </TabsList>

        <TabsContent value="concept" className="mt-6">
          <ConceptTab project={project} onUpdate={handleProjectUpdate} />
        </TabsContent>
        <TabsContent value="research" className="mt-6">
          <ResearchTab initialQuery={project.topic} projectId={project.id} />
        </TabsContent>
        <TabsContent value="script" className="mt-6">
          <ScriptTab project={project} onUpdate={handleProjectUpdate} />
        </TabsContent>
        <TabsContent value="production" className="mt-6">
          <ProductionTab project={project} onUpdate={handleProjectUpdate} />
        </TabsContent>
        <TabsContent value="publish" className="mt-6">
          <PublishTab project={project} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
