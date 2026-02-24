"use client"

import { useState, useEffect } from "react"
import { Clock, BookOpen } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Project } from "@/lib/projects"

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

export function ScriptTab({ project }: { project: Project }) {
  const storageKey = `reconic:script:${project.id}`
  const durationKey = `reconic:script-duration:${project.id}`
  const [script, setScript] = useState("")
  const [targetDuration, setTargetDuration] = useState("20")

  useEffect(() => {
    setScript(localStorage.getItem(storageKey) ?? "")
    setTargetDuration(localStorage.getItem(durationKey) ?? "20")
  }, [storageKey, durationKey])

  function handleChange(val: string) {
    setScript(val)
    localStorage.setItem(storageKey, val)
  }

  function handleDurationChange(val: string | null) {
    if (!val) return
    setTargetDuration(val)
    localStorage.setItem(durationKey, val)
  }

  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0
  const readingMinutes = Math.ceil(wordCount / 130)
  const targetWords = TARGET_WORDS[targetDuration] ?? 2600
  const progress = Math.min(Math.round((wordCount / targetWords) * 100), 100)

  const chapters = script
    .split("\n")
    .filter((line) => line.trimStart().startsWith("## "))
    .map((line) => line.replace(/^#+\s*/, "").trim())

  return (
    <div className="space-y-4">
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
