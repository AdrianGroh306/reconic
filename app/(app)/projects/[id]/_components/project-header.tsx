"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Upload, Clapperboard, Scissors, CheckCircle, Pencil, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  getProjectThumbnail,
  setProjectThumbnail,
  updateProject,
  computeStatus,
  STATUS_CONFIG,
  type Project,
} from "@/lib/projects"

interface ProjectHeaderProps {
  project: Project
  onUpdate: () => void
}

const MANUAL_PHASES: Array<{
  value: 'filming' | 'editing' | 'published'
  label: string
  icon: React.ReactNode
}> = [
  { value: 'filming',   label: 'Filming',   icon: <Clapperboard className="h-3 w-3" /> },
  { value: 'editing',   label: 'Editing',   icon: <Scissors className="h-3 w-3" /> },
  { value: 'published', label: 'Published', icon: <CheckCircle className="h-3 w-3" /> },
]

export function ProjectHeader({ project, onUpdate }: ProjectHeaderProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [hovering, setHovering] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [notes, setNotes] = useState(project.notes ?? "")
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingTopic, setEditingTopic] = useState(false)
  const [titleDraft, setTitleDraft] = useState(project.title)
  const [topicDraft, setTopicDraft] = useState(project.topic)

  useEffect(() => {
    setThumbnail(getProjectThumbnail(project.id))
  }, [project.id])

  useEffect(() => {
    setNotes(project.notes ?? "")
    setTitleDraft(project.title)
    setTopicDraft(project.topic)
  }, [project.id, project.notes, project.title, project.topic])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setProjectThumbnail(project.id, base64)
      setThumbnail(base64)
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  function handlePhaseClick(phase: 'filming' | 'editing' | 'published') {
    const next = project.status === phase ? undefined : phase
    updateProject(project.id, { status: next })
    onUpdate()
  }

  function handleNotesBlur() {
    updateProject(project.id, { notes })
    onUpdate()
  }

  const currentStatus = computeStatus(project)
  const statusCfg = STATUS_CONFIG[currentStatus]

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        onClick={() => router.push("/projects")}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Projects
      </Button>

      <div className="flex items-start gap-5">
        {/* Thumbnail — left, 16:9 */}
        <div
          className="relative shrink-0 cursor-pointer overflow-hidden rounded-lg"
          style={{ width: 320, height: 180 }}
          onClick={() => fileInputRef.current?.click()}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          {thumbnail ? (
            <>
              <img
                src={thumbnail}
                alt="Project thumbnail"
                className="h-full w-full object-cover"
              />
              {hovering && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 text-white">
                  <Upload className="h-5 w-5" />
                  <span className="text-xs font-medium">Change</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60 hover:text-muted-foreground/80 transition-colors">
              <Upload className="h-5 w-5" />
              <span className="text-xs font-medium">Upload thumbnail</span>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Right column */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
          <div className="space-y-1">
            {editingTitle ? (
              <input
                autoFocus
                className="text-2xl font-bold leading-tight bg-transparent border-b border-foreground/20 focus:border-foreground/60 outline-none w-full"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={() => {
                  const trimmed = titleDraft.trim()
                  if (trimmed && trimmed !== project.title) {
                    updateProject(project.id, { title: trimmed })
                    onUpdate()
                  }
                  setEditingTitle(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur()
                  if (e.key === "Escape") { setTitleDraft(project.title); setEditingTitle(false) }
                }}
              />
            ) : (
              <h1
                className="text-2xl font-bold leading-tight cursor-pointer hover:text-foreground/70 transition-colors"
                onClick={() => setEditingTitle(true)}
                title="Click to edit"
              >
                {project.title}
              </h1>
            )}

            {project.chosenTitle && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground shrink-0">Video title:</span>
                <span className="font-medium text-foreground/80 truncate">{project.chosenTitle}</span>
              </div>
            )}

            {editingTopic ? (
              <input
                autoFocus
                className="text-sm text-muted-foreground bg-transparent border-b border-foreground/20 focus:border-foreground/60 outline-none w-full"
                value={topicDraft}
                onChange={(e) => setTopicDraft(e.target.value)}
                onBlur={() => {
                  const trimmed = topicDraft.trim()
                  if (trimmed && trimmed !== project.topic) {
                    updateProject(project.id, { topic: trimmed })
                    onUpdate()
                  }
                  setEditingTopic(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur()
                  if (e.key === "Escape") { setTopicDraft(project.topic); setEditingTopic(false) }
                }}
              />
            ) : (
              <p
                className="text-muted-foreground text-sm cursor-pointer hover:text-muted-foreground/50 transition-colors"
                onClick={() => setEditingTopic(true)}
                title="Click to edit"
              >
                {project.topic}
              </p>
            )}

            {project.description && (
              <p className="text-sm text-muted-foreground/70 line-clamp-2">{project.description}</p>
            )}
          </div>

          {/* Status row */}
          <div className="flex items-center gap-3 flex-wrap pt-1">
            <Badge
              variant="outline"
              className={`text-xs font-medium ${statusCfg.className}`}
            >
              {statusCfg.label}
            </Badge>

            <div className="flex items-center gap-1.5">
              {MANUAL_PHASES.map((phase) => (
                <Button
                  key={phase.value}
                  variant="outline"
                  size="sm"
                  className={[
                    "h-7 px-2.5 gap-1.5 text-xs",
                    project.status === phase.value
                      ? "border-foreground/40 bg-foreground/5 font-semibold"
                      : "text-muted-foreground",
                  ].join(" ")}
                  onClick={() => handlePhaseClick(phase.value)}
                >
                  {phase.icon}
                  {phase.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Notes section */}
          <div className="pt-1 border-t border-border/50">
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setNotesOpen((v) => !v)}
            >
              <Pencil className="h-3 w-3" />
              <span>Notes</span>
              <ChevronDown
                className={`h-3 w-3 transition-transform ${notesOpen ? "rotate-180" : ""}`}
              />
              {!notesOpen && notes && (
                <span className="ml-1 truncate max-w-[200px] text-muted-foreground/70">
                  {notes.split("\n")[0]}
                </span>
              )}
              {!notesOpen && !notes && (
                <span className="ml-1 text-muted-foreground/50">Add notes…</span>
              )}
            </button>

            {notesOpen && (
              <textarea
                className="mt-2 w-full min-h-[80px] resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Competitors, tone, research notes…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleNotesBlur}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
