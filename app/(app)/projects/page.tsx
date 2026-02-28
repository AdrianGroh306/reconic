"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, FolderOpen, MoreVertical, Trash2, ExternalLink, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { loadProjects, deleteProject, getProjectThumbnail, computeStatus, STATUS_CONFIG, type Project } from "@/lib/projects"
import { Badge } from "@/components/ui/badge"
import { NewProjectDialog } from "./_components/new-project-dialog"

function loadProjectsWithThumbnails() {
  const all = loadProjects()
  const thumbs: Record<string, string> = {}
  for (const p of all) {
    const t = getProjectThumbnail(p.id)
    if (t) thumbs[p.id] = t
  }
  return { projects: all, thumbnails: thumbs }
}

export default function ProjectsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const { data } = useQuery({
    queryKey: ["projects"],
    queryFn: loadProjectsWithThumbnails,
    staleTime: Infinity,
  })

  const projects = data?.projects ?? []
  const thumbnails = data?.thumbnails ?? {}

  function handleCreate(project: Project) {
    queryClient.invalidateQueries({ queryKey: ["projects"] })
    setDialogOpen(false)
    router.push(`/projects/${project.id}`)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deleteProject(deleteTarget)
    queryClient.invalidateQueries({ queryKey: ["projects"] })
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
          <FolderOpen className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium">No projects yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create your first video project to get started.</p>
          <Button className="mt-4" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer overflow-hidden pt-0 gap-3 transition-shadow hover:shadow-md"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <div className="aspect-video w-full bg-muted relative overflow-hidden">
                {thumbnails[project.id] ? (
                  <img
                    src={thumbnails[project.id]}
                    alt={project.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute bottom-2 right-2">
                  {(() => {
                    const status = computeStatus(project)
                    const cfg = STATUS_CONFIG[status]
                    return (
                      <Badge variant="outline" className={`text-xs font-medium ${cfg.className} backdrop-blur-sm`}>
                        {cfg.label}
                      </Badge>
                    )
                  })()}
                </div>
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{project.title}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground"
                          onClick={(e) => e.stopPropagation()}
                        />
                      }
                    >
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/projects/${project.id}`)
                        }}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(project.id)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="line-clamp-1">{project.topic}</CardDescription>
              </CardHeader>
              {project.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <NewProjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={handleCreate}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              This will permanently delete the project and all its data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
