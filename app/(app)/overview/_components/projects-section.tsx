"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { type Project } from "@/lib/projects"
import { useProjects } from "@/hooks/use-projects"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ProjectCard } from "@/components/projects/project-card"
import { NewProjectDialog } from "@/app/(app)/projects/_components/new-project-dialog"

export function ProjectsSection() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading } = useProjects()
  const projects = (data ?? []).slice(0, 6)

  function handleProjectCreated(project: Project) {
    queryClient.invalidateQueries({ queryKey: ["projects"] })
    setDialogOpen(false)
    router.push(`/projects/${project.id}`)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Your Projects
        </h2>
        <div className="flex items-center gap-2">
          <Link href="/projects" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            View all
          </Link>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Project
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden pt-0 gap-3">
              <Skeleton className="aspect-video w-full rounded-none" />
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2 mt-1" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">No projects yet.</p>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Create first project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}

        </div>
      )}

      <NewProjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={handleProjectCreated}
      />
    </section>
  )
}
