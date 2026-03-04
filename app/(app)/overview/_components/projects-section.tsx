"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { ImageIcon, Plus } from "lucide-react"
import { type Project, computeStatus, STATUS_CONFIG } from "@/lib/projects"
import { useProjects } from "@/hooks/use-projects"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { NewProjectDialog } from "@/app/(app)/projects/_components/new-project-dialog"

function ProjectCard({ project }: { project: Project }) {
  const router = useRouter()
  const status = computeStatus(project)
  const cfg = STATUS_CONFIG[status]
  return (
    <Card
      className="cursor-pointer overflow-hidden pt-0 gap-3 transition-shadow hover:shadow-md"
      onClick={() => router.push(`/projects/${project.id}`)}
    >
      <div className="aspect-video w-full bg-muted relative overflow-hidden">
        {project.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnail}
            alt={project.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute bottom-2 right-2">
          <Badge variant="outline" className={`text-xs font-medium ${cfg.className} backdrop-blur-sm`}>
            {cfg.label}
          </Badge>
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-base leading-snug">{project.chosenTitle ?? project.title}</CardTitle>
        <CardDescription className="line-clamp-1">{project.topic}</CardDescription>
      </CardHeader>
      {project.description && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        </CardContent>
      )}
    </Card>
  )
}

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
