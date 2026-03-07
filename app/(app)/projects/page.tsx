"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Plus, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { removeProject, type Project } from "@/lib/projects"
import { useProjects } from "@/hooks/use-projects"
import { ProjectCard } from "@/components/projects/project-card"
import { NewProjectDialog } from "./_components/new-project-dialog"

export default function ProjectsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const { data } = useProjects()
  const projects = data ?? []

  function handleCreate(project: Project) {
    queryClient.invalidateQueries({ queryKey: ["projects"] })
    setDialogOpen(false)
    router.push(`/projects/${project.id}`)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await removeProject(deleteTarget)
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
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={setDeleteTarget}
            />
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
