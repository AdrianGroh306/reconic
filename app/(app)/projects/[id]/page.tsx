"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Search, Sparkles, Youtube } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getProject } from "@/lib/projects"
import { ProjectHeader } from "./_components/project-header"
import { SuggestionsTab } from "./_components/suggestions-tab"
import { ResearchTab } from "./_components/research-tab"
import { ScriptTab } from "./_components/script-tab"
import { PublishTab } from "./_components/publish-tab"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = params.id as string

  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: () => {
      const p = getProject(id)
      if (!p) router.replace("/projects")
      return p ?? null
    },
    staleTime: Infinity,
  })

  function handleProjectUpdate() {
    queryClient.invalidateQueries({ queryKey: ["project", id] })
    queryClient.invalidateQueries({ queryKey: ["projects"] })
  }

  if (!project) return null

  return (
    <div className="space-y-6">
      <ProjectHeader project={project} onUpdate={handleProjectUpdate} />

      <Tabs defaultValue="suggestions">
        <TabsList>
          <TabsTrigger value="suggestions">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            AI Suggestions
          </TabsTrigger>
          <TabsTrigger value="research">
            <Search className="mr-1.5 h-3.5 w-3.5" />
            Research
          </TabsTrigger>
          <TabsTrigger value="script">Script</TabsTrigger>
          <TabsTrigger value="publish">
            <Youtube className="mr-1.5 h-3.5 w-3.5" />
            Publish
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="mt-6">
          <SuggestionsTab project={project} onUpdate={handleProjectUpdate} />
        </TabsContent>
        <TabsContent value="research" className="mt-6">
          <ResearchTab initialQuery={project.topic} />
        </TabsContent>
        <TabsContent value="script" className="mt-6">
          <ScriptTab project={project} onUpdate={handleProjectUpdate} />
        </TabsContent>
        <TabsContent value="publish" className="mt-6">
          <PublishTab project={project} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
