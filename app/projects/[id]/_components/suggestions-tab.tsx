"use client"

import { useState, useCallback } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Project } from "@/lib/projects"

type Suggestions = {
  titles: string[]
  thumbnailConcepts: string[]
  scriptOutline: string[]
  hookVariants?: string[]
  chapterMarkers?: string[]
}

const DURATION_OPTIONS = [
  { value: "10", label: "10 min" },
  { value: "20", label: "20 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
]

export function SuggestionsTab({ project }: { project: Project }) {
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duration, setDuration] = useState("20")

  const generate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/ai/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: project.topic,
          description: project.description,
          duration: parseInt(duration),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Unknown error")
      setSuggestions(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [project, duration])

  if (!suggestions && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Sparkles className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium">Generate AI suggestions</p>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Get title ideas, thumbnail concepts, hook variants, and a longform script outline.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Select value={duration} onValueChange={(val) => { if (val) setDuration(val) }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={generate}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Generating longform suggestions…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive font-medium">{error}</p>
        <Button variant="outline" className="mt-4" onClick={generate}>Try again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Select value={duration} onValueChange={(val) => { if (val) setDuration(val) }}>
          <SelectTrigger className="w-28 h-8 text-sm">
            <SelectValue placeholder="Duration" />
          </SelectTrigger>
          <SelectContent>
            {DURATION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={generate}>
          <Sparkles className="mr-2 h-3.5 w-3.5" />
          Regenerate
        </Button>
      </div>

      <section className="space-y-3">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Titles</h3>
        <div className="space-y-2">
          {suggestions?.titles.map((title, i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-between gap-4 p-3">
                <p className="text-sm">{title}</p>
                <Badge variant="outline" className="shrink-0 text-xs">{i + 1}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {suggestions?.hookVariants && suggestions.hookVariants.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Hook Variants</h3>
          <div className="space-y-2">
            {suggestions.hookVariants.map((hook, i) => {
              const labels = ["Story", "Statistic", "Controversy"]
              return (
                <Card key={i}>
                  <CardContent className="p-3 space-y-1">
                    <Badge variant="outline" className="text-xs">{labels[i] ?? `Hook ${i + 1}`}</Badge>
                    <p className="text-sm mt-1">{hook}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Script Outline</h3>
        <div className="space-y-1.5">
          {suggestions?.scriptOutline.map((section, i) => (
            <div key={i} className="flex gap-3 rounded-md border px-3 py-2.5">
              <span className="shrink-0 text-xs font-mono text-muted-foreground mt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-sm">{section}</p>
            </div>
          ))}
        </div>
      </section>

      {suggestions?.chapterMarkers && suggestions.chapterMarkers.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Chapter Markers</h3>
          <Card>
            <CardContent className="p-3">
              <div className="space-y-1">
                {suggestions.chapterMarkers.map((chapter, i) => (
                  <p key={i} className="text-sm font-mono">{chapter}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Thumbnail Concepts</h3>
        <div className="space-y-2">
          {suggestions?.thumbnailConcepts.map((concept, i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <p className="text-sm">{concept}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
