"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Upload, Pencil, ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  patchProject,
  computeStatus,
  type Project,
  type ProjectStatusLabel,
} from "@/lib/projects"

interface ProjectHeaderProps {
  project: Project
  onUpdate: () => void
}

const WORKFLOW_STEPS: Array<{ value: ProjectStatusLabel; label: string }> = [
  { value: "idea",      label: "Idea" },
  { value: "scripted",  label: "Scripted" },
  { value: "filming",   label: "Filming" },
  { value: "editing",   label: "Editing" },
  { value: "published", label: "Published" },
]

const STEP_ORDER: ProjectStatusLabel[] = ["idea", "scripted", "filming", "editing", "published"]

const MANUAL_STATUS_MAP: Partial<Record<ProjectStatusLabel, Project["status"]>> = {
  filming:   "filming",
  editing:   "editing",
  published: "published",
}

export function ProjectHeader({ project, onUpdate }: ProjectHeaderProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [hovering, setHovering] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [notes, setNotes] = useState(project.notes ?? "")
  const [editingVideoTitle, setEditingVideoTitle] = useState(false)
  const [editingTopic, setEditingTopic] = useState(false)
  const [videoTitleDraft, setVideoTitleDraft] = useState(project.chosenTitle ?? project.title)
  const [topicDraft, setTopicDraft] = useState(project.topic)

  useEffect(() => {
    setNotes(project.notes ?? "")
    setVideoTitleDraft(project.chosenTitle ?? project.title)
    setTopicDraft(project.topic)
  }, [project.id, project.notes, project.chosenTitle, project.title, project.topic])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      patchProject(project.id, { thumbnail: base64 })
      onUpdate()
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  function handleStepClick(step: ProjectStatusLabel) {
    if (step === "idea" || step === "scripted") {
      patchProject(project.id, { status: undefined })
    } else {
      patchProject(project.id, { status: MANUAL_STATUS_MAP[step] })
    }
    onUpdate()
  }

  function handleNotesBlur() {
    patchProject(project.id, { notes })
    onUpdate()
  }

  const currentStatus = computeStatus(project)
  const currentIdx = STEP_ORDER.indexOf(currentStatus)

  // What to display as the H1 — chosen title has priority, falls back to folder name
  const displayTitle = project.chosenTitle ?? project.title
  const isPlaceholder = !project.chosenTitle

  return (
    <div className="space-y-4">
      {/* Breadcrumb back button — shows the internal folder name */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground"
          onClick={() => router.push("/projects")}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Projects
        </Button>
        <span className="text-muted-foreground/40 text-xs">/</span>
        <span className="text-xs text-muted-foreground/60 truncate max-w-[200px]">{project.title}</span>
      </div>

      <div className="flex items-start gap-5">
        {/* Thumbnail — left, 16:9 */}
        <div
          className="relative shrink-0 cursor-pointer overflow-hidden rounded-lg"
          style={{ width: 320, height: 180 }}
          onClick={() => fileInputRef.current?.click()}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          {project.thumbnail ? (
            <>
              <img
                src={project.thumbnail}
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
        <div className="flex-1 min-w-0 flex flex-col gap-2">

          {/* Video title — primary H1 */}
          {editingVideoTitle ? (
            <input
              autoFocus
              className="text-2xl font-bold leading-tight bg-transparent border-b border-foreground/20 focus:border-foreground/60 outline-none w-full"
              placeholder="Video title…"
              value={videoTitleDraft}
              onChange={(e) => setVideoTitleDraft(e.target.value)}
              onBlur={() => {
                const trimmed = videoTitleDraft.trim()
                patchProject(project.id, { chosenTitle: trimmed || undefined })
                onUpdate()
                setEditingVideoTitle(false)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur()
                if (e.key === "Escape") {
                  setVideoTitleDraft(project.chosenTitle ?? project.title)
                  setEditingVideoTitle(false)
                }
              }}
            />
          ) : (
            <h1
              className={[
                "text-2xl font-bold leading-tight cursor-pointer transition-colors",
                isPlaceholder
                  ? "text-muted-foreground hover:text-foreground"
                  : "hover:text-foreground/70",
              ].join(" ")}
              onClick={() => {
                setVideoTitleDraft(project.chosenTitle ?? project.title)
                setEditingVideoTitle(true)
              }}
              title="Click to edit video title"
            >
              {displayTitle}
              {isPlaceholder && (
                <span className="ml-2 text-sm font-normal text-muted-foreground/40">— click to set video title</span>
              )}
            </h1>
          )}

          {/* Topic */}
          {editingTopic ? (
            <input
              autoFocus
              className="text-sm text-muted-foreground bg-transparent border-b border-foreground/20 focus:border-foreground/60 outline-none w-full"
              value={topicDraft}
              onChange={(e) => setTopicDraft(e.target.value)}
              onBlur={() => {
                const trimmed = topicDraft.trim()
                if (trimmed && trimmed !== project.topic) {
                  patchProject(project.id, { topic: trimmed })
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
              title="Click to edit topic"
            >
              {project.topic}
            </p>
          )}

          {project.description && (
            <p className="text-sm text-muted-foreground/60 line-clamp-2">{project.description}</p>
          )}

          {/* Workflow stepper */}
          <div className="flex items-center gap-0 pt-1">
            {WORKFLOW_STEPS.map((step, idx) => {
              const isCompleted = idx < currentIdx
              const isCurrent = idx === currentIdx
              const isLast = idx === WORKFLOW_STEPS.length - 1

              return (
                <div key={step.value} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleStepClick(step.value)}
                    className={[
                      "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      isCurrent
                        ? "bg-foreground text-background"
                        : isCompleted
                          ? "bg-muted text-foreground/70 hover:bg-muted/80"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    ].join(" ")}
                  >
                    {isCompleted && <Check className="h-3 w-3" />}
                    {step.label}
                  </button>
                  {!isLast && (
                    <div className={`h-px w-4 shrink-0 ${idx < currentIdx ? "bg-foreground/30" : "bg-muted-foreground/20"}`} />
                  )}
                </div>
              )
            })}
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
