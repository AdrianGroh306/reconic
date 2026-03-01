"use client"

import { useParams, useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Search, Sparkles, Youtube, Clapperboard } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProject } from "@/hooks/use-projects"
import { ProjectHeader } from "./_components/project-header"
import { SuggestionsTab } from "./_components/suggestions-tab"
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

  if (isLoading) return null
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
      <ProjectHeader project={project} onUpdate={handleProjectUpdate} />

      <Tabs defaultValue="concept">
        <TabsList>
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
          <SuggestionsTab project={project} onUpdate={handleProjectUpdate} />
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
