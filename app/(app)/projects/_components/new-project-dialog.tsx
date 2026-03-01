"use client"

import { useState, useRef, useEffect } from "react"
import { Sparkles, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { createProject, type Project } from "@/lib/projects"

interface NewProjectDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (project: Project) => void
}

export function NewProjectDialog({ open, onClose, onCreate }: NewProjectDialogProps) {
  const [vision, setVision] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setVision("")
      setError(null)
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [open])

  async function handleCreate() {
    const trimmed = vision.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)

    let title = trimmed
    let topic = trimmed
    let description = ""

    try {
      const res = await fetch("/api/ai/parse-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vision: trimmed }),
      })
      const data = await res.json()
      if (res.ok) {
        title = data.title ?? title
        topic = data.topic ?? topic
        description = data.description ?? description
      }
    } catch {
      // AI parsing failed — fall back to raw input
    }

    try {
      const project = await createProject({ title, topic, description })
      setVision("")
      onCreate(project)
    } catch {
      setError("Couldn't create project. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      handleCreate()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !loading && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            New Project
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Was soll dein nächstes Video sein?
            </label>
            <p className="text-xs text-muted-foreground">
              Beschreib die Idee einfach — Thema, Winkel, Format, was auch immer dir in den Sinn kommt.
            </p>
            <Textarea
              ref={textareaRef}
              placeholder="z.B. Ich will zeigen wie ich in 30 Tagen mein erstes SaaS gebaut habe — mit allem was schiefgelaufen ist, dem finalen Launch und was ich anders machen würde."
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={5}
              disabled={loading}
              className="resize-none text-sm leading-relaxed"
            />
            <p className="text-xs text-muted-foreground/60">⌘ + Enter to create</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!vision.trim() || loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  Create Project
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
