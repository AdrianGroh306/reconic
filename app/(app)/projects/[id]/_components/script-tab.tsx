"use client"

import { useState, useEffect } from "react"
import { Clock, BookOpen, Sparkles } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { updateProject, scriptKey, type Project } from "@/lib/projects"

const DURATION_OPTIONS = [
  { value: "10", label: "10 min" },
  { value: "20", label: "20 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
]

const TARGET_WORDS: Record<string, number> = {
  "10": 1300,
  "20": 2600,
  "30": 3900,
  "45": 5850,
}

function suggestionsKey(projectId: string) {
  return scriptKey(projectId).replace(/:script:/, ":suggestions:")
}

function loadScriptOutline(projectId: string): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(suggestionsKey(projectId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed.scriptOutline) ? parsed.scriptOutline : []
  } catch {
    return []
  }
}

function buildScriptTemplate(outline: string[]): string {
  return outline.map((section) => `## ${section}\n\n\n`).join("\n")
}

export function ScriptTab({ project, onUpdate }: { project: Project; onUpdate: () => void }) {
  const storageKey = scriptKey(project.id)
  const [script, setScript] = useState("")
  const [targetDuration, setTargetDuration] = useState(project.targetDuration?.toString() ?? "20")
  const [scriptOutline, setScriptOutline] = useState<string[]>([])

  useEffect(() => {
    setScript(localStorage.getItem(storageKey) ?? "")
    setScriptOutline(loadScriptOutline(project.id))
  }, [storageKey, project.id])

  function handleChange(val: string) {
    setScript(val)
    localStorage.setItem(storageKey, val)
  }

  function handleDurationChange(val: string | null) {
    if (!val) return
    setTargetDuration(val)
    updateProject(project.id, { targetDuration: parseInt(val) })
    onUpdate()
  }

  function handleUseTemplate() {
    const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0
    if (wordCount >= 30) {
      const confirmed = window.confirm("This will replace your current script. Continue?")
      if (!confirmed) return
    }
    const template = buildScriptTemplate(scriptOutline)
    handleChange(template)
  }

  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0
  const readingMinutes = Math.ceil(wordCount / 130)
  const targetWords = TARGET_WORDS[targetDuration] ?? 2600
  const progress = Math.min(Math.round((wordCount / targetWords) * 100), 100)

  const chapters = script
    .split("\n")
    .filter((line) => line.trimStart().startsWith("## "))
    .map((line) => line.replace(/^#+\s*/, "").trim())

  const showBanner = scriptOutline.length > 0 && wordCount < 30

  return (
    <div className="space-y-4">
      {showBanner && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span>AI outline available</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleUseTemplate}>
            Use as template
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Select value={targetDuration} onValueChange={handleDurationChange}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <Clock className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label} target</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground flex items-center gap-1.5">
            <span>{wordCount.toLocaleString()} / {targetWords.toLocaleString()} words</span>
            <span className="text-xs">·</span>
            <span>{readingMinutes} min read</span>
            <span className="text-xs">·</span>
            <span className={progress >= 100 ? "text-green-600 font-medium" : ""}>{progress}%</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">auto-saved</p>
      </div>

      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${progress >= 100 ? "bg-green-500" : "bg-primary"}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex gap-4">
        <Textarea
          className="min-h-[500px] font-mono text-sm resize-none flex-1"
          placeholder={`Write your script here…\n\nTip: Use ## for chapter headings (e.g., ## The Hook)`}
          value={script}
          onChange={(e) => handleChange(e.target.value)}
        />

        {chapters.length > 0 && (
          <Card className="w-52 shrink-0 self-start">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-3 w-3" />
                Chapters
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <ol className="space-y-1.5">
                {chapters.map((chapter, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span className="font-mono shrink-0 text-muted-foreground/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="line-clamp-2">{chapter}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
