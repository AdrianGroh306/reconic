"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ImageIcon, Plus } from "lucide-react"
import { loadProjects, getProjectThumbnail, type Project } from "@/lib/projects"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { NewProjectDialog } from "@/app/projects/_components/new-project-dialog"

function ProjectCard({ project, thumbnail }: { project: Project; thumbnail?: string }) {
  const router = useRouter()
  return (
    <Card
      className="cursor-pointer overflow-hidden pt-0 gap-3 transition-shadow hover:shadow-md"
      onClick={() => router.push(`/projects/${project.id}`)}
    >
      <div className="aspect-video w-full bg-muted relative overflow-hidden">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={project.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <CardContent className="px-4 pb-4">
        <p className="font-semibold leading-snug line-clamp-1">{project.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{project.topic}</p>
      </CardContent>
    </Card>
  )
}

export function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([])
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const all = loadProjects()
    setProjects(all.slice(0, 6))
    const thumbs: Record<string, string> = {}
    for (const p of all) {
      const t = getProjectThumbnail(p.id)
      if (t) thumbs[p.id] = t
    }
    setThumbnails(thumbs)
  }, [])

  function handleProjectCreated(project: Project) {
    setProjects(loadProjects().slice(0, 6))
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

      {projects.length === 0 ? (
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
            <ProjectCard key={p.id} project={p} thumbnail={thumbnails[p.id]} />
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
