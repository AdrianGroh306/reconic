"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ChevronLeft, Upload, Check, ExternalLink, RefreshCw, X, Palette, Loader2, ImageIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  patchProject,
  computeStatus,
  type Project,
  type ProjectStatusLabel,
} from "@/lib/projects"
import { getCanvaAccount, type CanvaAccount } from "@/lib/canva-account"

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
  scripted:  "scripted",
  filming:   "filming",
  editing:   "editing",
  published: "published",
}

export function ProjectHeader({ project, onUpdate }: ProjectHeaderProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: canvaAccount } = useQuery<CanvaAccount | null>({
    queryKey: ["canva-account"],
    queryFn: () => getCanvaAccount(),
    staleTime: 5 * 60 * 1000,
  })

  const [canvaLoading, setCanvaLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const canvaConnected = !!canvaAccount
  const hasDesign = !!project.canvaDesignId

  // Local thumbnail state for immediate display (bypasses React Query propagation delay)
  const [thumbnail, setThumbnail] = useState<string | undefined>(project.thumbnail)

  // Optimistic update: update both caches immediately, PATCH runs in background.
  // No refetch triggered — avoids the race condition where refetch beats the PATCH.
  function applyChanges(changes: Partial<Project>) {
    queryClient.setQueryData<Project | null>(["project", project.id], (old) =>
      old ? { ...old, ...changes } : old
    )
    queryClient.setQueryData<Project[]>(["projects"], (old) =>
      old ? old.map((p) => (p.id === project.id ? { ...p, ...changes } : p)) : old
    )
    patchProject(project.id, changes).catch(() => toast.error("Failed to save"))
  }

  function updateThumbnail(dataUrl: string | undefined) {
    setThumbnail(dataUrl)
    applyChanges({ thumbnail: dataUrl })
  }

  const [editingVideoTitle, setEditingVideoTitle] = useState(false)
  const [editingTopic, setEditingTopic] = useState(false)
  const [videoTitleDraft, setVideoTitleDraft] = useState(project.chosenTitle ?? project.title)
  const [topicDraft, setTopicDraft] = useState(project.topic)

  useEffect(() => {
    setVideoTitleDraft(project.chosenTitle ?? project.title)
    setTopicDraft(project.topic)
    setThumbnail(project.thumbnail)
  }, [project.id, project.chosenTitle, project.title, project.topic, project.thumbnail])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1280
      let w = img.naturalWidth, h = img.naturalHeight
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX }
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(objectUrl)
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
      updateThumbnail(dataUrl)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      toast.error("Failed to read image")
    }
    img.src = objectUrl
  }

  function handleStepClick(step: ProjectStatusLabel) {
    const status = step === "idea" ? undefined : MANUAL_STATUS_MAP[step]
    applyChanges({ status })
  }

  async function handleOpenInCanva() {
    if (!canvaConnected) {
      router.push("/settings?canva=connect")
      return
    }

    if (hasDesign) {
      // Re-open existing design — we need the edit URL from Canva
      // Simply create a new export isn't possible without the edit URL; redirect to Canva designs page
      window.open(`https://www.canva.com/design/${project.canvaDesignId}/edit`, "_blank")
      return
    }

    setCanvaLoading(true)
    try {
      const res = await fetch("/api/canva/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: project.chosenTitle ?? project.title }),
      })

      if (!res.ok) {
        toast.error("Failed to create Canva design")
        return
      }

      const { designId, editUrl } = await res.json() as { designId: string; editUrl: string }
      applyChanges({ canvaDesignId: designId })
      window.open(editUrl, "_blank")
    } catch {
      toast.error("Failed to create Canva design")
    } finally {
      setCanvaLoading(false)
    }
  }

  async function handleSyncFromCanva() {
    if (!project.canvaDesignId) return
    setSyncing(true)
    try {
      const res = await fetch("/api/canva/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId: project.canvaDesignId }),
      })

      if (!res.ok) {
        toast.error("Failed to sync from Canva")
        return
      }

      const { thumbnail: synced } = await res.json() as { thumbnail: string }
      updateThumbnail(synced)
      toast.success("Thumbnail synced from Canva")
    } catch {
      toast.error("Failed to sync from Canva")
    } finally {
      setSyncing(false)
    }
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
        {/* Thumbnail card — unified frame with toolbar */}
        <div
          className="group/thumb shrink-0 rounded-lg border border-border"
          style={{ width: 320 }}
        >
          {/* Image zone — 16:9 */}
          <div className="relative bg-muted/20 rounded-t-lg overflow-hidden" style={{ height: 180 }}>
            {thumbnail ? (
              <>
                <img
                  src={thumbnail}
                  alt="Project thumbnail"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-6 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                  {/* Replace — transparent input sits on top of the button area */}
                  <div className="relative flex flex-col items-center gap-1 text-white hover:text-white/70 transition-colors cursor-pointer">
                    <Upload className="h-4 w-4 pointer-events-none" />
                    <span className="text-xs font-medium pointer-events-none">Replace</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => updateThumbnail(undefined)}
                    className="flex flex-col items-center gap-1 text-white hover:text-white/70 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span className="text-xs font-medium">Remove</span>
                  </button>
                </div>
              </>
            ) : (
              /* Empty state — transparent input covers full area */
              <div className="relative flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-muted/30 transition-colors">
                <ImageIcon className="h-7 w-7 pointer-events-none" />
                <span className="text-xs pointer-events-none">Click to upload thumbnail</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
            )}
          </div>

          {/* Toolbar — Canva only */}
          <div className="flex items-center border-t border-border bg-muted/20 px-1.5 h-9 gap-0.5 rounded-b-lg">
            <button
              type="button"
              onClick={handleOpenInCanva}
              disabled={canvaLoading}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              title={
                !canvaConnected ? "Connect Canva in Settings first" :
                hasDesign ? "Edit design in Canva" :
                "Create thumbnail in Canva (1280×720)"
              }
            >
              {canvaLoading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Palette className="h-3.5 w-3.5" />
              }
              <span>{hasDesign ? "Edit in Canva" : "Open in Canva"}</span>
              {!canvaLoading && <ExternalLink className="h-3 w-3 opacity-40" />}
            </button>

            {hasDesign && (
              <>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={handleSyncFromCanva}
                  disabled={syncing}
                  className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                  title="Sync thumbnail from Canva"
                >
                  {syncing
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <RefreshCw className="h-3.5 w-3.5" />
                  }
                  <span>Sync</span>
                </button>
              </>
            )}
          </div>
        </div>

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
                applyChanges({ chosenTitle: trimmed || undefined })
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
                  applyChanges({ topic: trimmed })
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

        </div>
      </div>
    </div>
  )
}
