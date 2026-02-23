"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { saveProject, type Project } from "@/lib/projects"

interface NewProjectDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (project: Project) => void
}

export function NewProjectDialog({ open, onClose, onCreate }: NewProjectDialogProps) {
  const [title, setTitle] = useState("")
  const [topic, setTopic] = useState("")
  const [description, setDescription] = useState("")

  function handleCreate() {
    if (!title.trim() || !topic.trim()) return
    const project: Project = {
      id: crypto.randomUUID(),
      title: title.trim(),
      topic: topic.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
    }
    saveProject(project)
    onCreate(project)
    setTitle("")
    setTopic("")
    setDescription("")
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Project name</label>
            <Input
              placeholder="e.g. 24h Website Challenge"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Video topic</label>
            <Input
              placeholder="e.g. I built a website in 24 hours"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea
              placeholder="More context about the video..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!title.trim() || !topic.trim()}>
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
