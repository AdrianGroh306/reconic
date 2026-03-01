"use client"

import { useState, useEffect, useRef } from "react"
import { Clock, BookOpen, Sparkles, Camera, Video } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { patchProject, type Project } from "@/lib/projects"

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

/** Stable hash for a broll line string (for checkbox state keying) */
function lineHash(line: string): string {
  let h = 0
  for (let i = 0; i < line.length; i++) {
    h = ((h << 5) - h + line.charCodeAt(i)) | 0
  }
  return String(h >>> 0)
}

/** Parse [B: ...] lines from script */
function parseBrollLines(script: string): string[] {
  return script
    .split("\n")
    .filter((line) => /^\[B:/i.test(line.trim()))
    .map((line) => line.replace(/^\[B:/i, "").replace(/\]$/, "").trim())
}

export function ScriptTab({ project, onUpdate }: { project: Project; onUpdate: () => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scriptTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const brollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [script, setScript] = useState(project.script ?? "")
  const [targetDuration, setTargetDuration] = useState(project.targetDuration?.toString() ?? "20")
  const [brollChecked, setBrollChecked] = useState<Record<string, boolean>>(project.brollChecks ?? {})

  // Sync when project data changes (e.g. after invalidation)
  useEffect(() => {
    setScript(project.script ?? "")
    setBrollChecked(project.brollChecks ?? {})
    setTargetDuration(project.targetDuration?.toString() ?? "20")
  }, [project.id, project.script, project.brollChecks, project.targetDuration])

  function handleChange(val: string) {
    setScript(val)
    if (scriptTimer.current) clearTimeout(scriptTimer.current)
    scriptTimer.current = setTimeout(() => {
      patchProject(project.id, { script: val }).then(onUpdate)
    }, 800)
  }

  function handleDurationChange(val: string | null) {
    if (!val) return
    setTargetDuration(val)
    patchProject(project.id, { targetDuration: parseInt(val) }).then(onUpdate)
  }

  function handleUseTemplate() {
    const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0
    if (wordCount >= 30) {
      const confirmed = window.confirm("This will replace your current script. Continue?")
      if (!confirmed) return
    }
    const outline = project.aiSuggestions?.scriptOutline ?? []
    const template = outline.map((section) => `## ${section}\n\n\n`).join("\n")
    handleChange(template)
  }

  function insertMarker(marker: string) {
    const ta = textareaRef.current
    if (!ta) {
      handleChange(script + "\n" + marker)
      return
    }
    const start = ta.selectionStart
    const before = script.slice(0, start)
    const lineStart = before.lastIndexOf("\n") + 1
    const newScript = script.slice(0, lineStart) + marker + script.slice(lineStart)
    handleChange(newScript)
    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = lineStart + marker.length
      ta.focus()
    }, 0)
  }

  function toggleBroll(line: string) {
    const key = lineHash(line)
    setBrollChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      if (brollTimer.current) clearTimeout(brollTimer.current)
      brollTimer.current = setTimeout(() => {
        patchProject(project.id, { brollChecks: next })
      }, 500)
      return next
    })
  }

  const spokenLines = script.split("\n").filter((line) => !/^\[B:/i.test(line.trim()))
  const spokenText = spokenLines.join(" ")
  const wordCount = spokenText.trim() ? spokenText.trim().split(/\s+/).filter(Boolean).length : 0
  const readingMinutes = Math.ceil(wordCount / 130)
  const targetWords = TARGET_WORDS[targetDuration] ?? 2600
  const progress = Math.min(Math.round((wordCount / targetWords) * 100), 100)

  const chapters = script
    .split("\n")
    .filter((line) => line.trimStart().startsWith("## "))
    .map((line) => line.replace(/^#+\s*/, "").trim())

  const brollLines = parseBrollLines(script)
  const hasOutline = (project.aiSuggestions?.scriptOutline?.length ?? 0) > 0
  const showBanner = hasOutline && wordCount < 30

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
        <div className="flex items-center gap-2">
          <Button
            size="sm" variant="outline" className="h-7 gap-1.5 text-xs"
            onClick={() => insertMarker("[A] ")}
            title="Insert A-Roll marker (talking head)"
          >
            <Camera className="h-3 w-3" />
            A-Roll
          </Button>
          <Button
            size="sm" variant="outline" className="h-7 gap-1.5 text-xs"
            onClick={() => insertMarker("[B: ]")}
            title="Insert B-Roll marker (cutaway footage)"
          >
            <Video className="h-3 w-3" />
            B-Roll
          </Button>
          <p className="text-xs text-muted-foreground">auto-saved</p>
        </div>
      </div>

      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${progress >= 100 ? "bg-green-500" : "bg-primary"}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex gap-4">
        <Textarea
          ref={textareaRef}
          className="min-h-125 font-mono text-sm resize-none flex-1"
          placeholder={`Write your script here…\n\nTip: Use ## for chapter headings\n     [A] for talking head lines\n     [B: description] for B-roll shots`}
          value={script}
          onChange={(e) => handleChange(e.target.value)}
        />

        {(chapters.length > 0 || brollLines.length > 0) && (
          <div className="w-52 shrink-0 space-y-3 self-start">
            {chapters.length > 0 && (
              <Card>
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

            {brollLines.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <Video className="h-3 w-3" />
                    B-Roll Shots
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <ul className="space-y-2">
                    {brollLines.map((line, i) => {
                      const key = lineHash(line)
                      return (
                        <li key={i} className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            className="mt-0.5 h-3 w-3 shrink-0 accent-primary cursor-pointer"
                            checked={!!brollChecked[key]}
                            onChange={() => toggleBroll(line)}
                          />
                          <span className={`text-xs leading-snug line-clamp-2 ${brollChecked[key] ? "line-through text-muted-foreground/50" : "text-muted-foreground"}`}>
                            {line}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
