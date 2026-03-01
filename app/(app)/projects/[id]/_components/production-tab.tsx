"use client"

import { useState, useEffect, useRef } from "react"
import { Camera, Video, Wrench } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { patchProject, type Project } from "@/lib/projects"

function lineHash(line: string): string {
  let h = 0
  for (let i = 0; i < line.length; i++) {
    h = ((h << 5) - h + line.charCodeAt(i)) | 0
  }
  return String(h >>> 0)
}

function parseBrollLines(script: string): string[] {
  return script
    .split("\n")
    .filter((line) => /^\[B:/i.test(line.trim()))
    .map((line) => line.replace(/^\[B:/i, "").replace(/\]$/, "").trim())
    .filter(Boolean)
}

function parseArollLines(script: string): string[] {
  return script
    .split("\n")
    .filter((line) => /^\[A\]/i.test(line.trim()))
    .map((line) => line.replace(/^\[A\]\s*/i, "").trim())
    .filter(Boolean)
}

const GEAR_ITEMS = [
  "Camera body",
  "SD card (formatted)",
  "Battery (fully charged)",
  "Backup battery",
  "Lavalier / shotgun mic",
  "Tripod / gimbal",
  "Lighting (key light)",
  "Backdrop / tidy background",
  "Teleprompter / script notes",
]

export function ProductionTab({ project, onUpdate }: { project: Project; onUpdate: () => void }) {
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const brollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [brollChecked, setBrollChecked] = useState<Record<string, boolean>>(project.brollChecks ?? {})
  const [gearChecked, setGearChecked] = useState<Record<string, boolean>>({})
  const [editorNotes, setEditorNotes] = useState(project.editorNotes ?? "")

  useEffect(() => {
    setBrollChecked(project.brollChecks ?? {})
    setEditorNotes(project.editorNotes ?? "")
  }, [project.id, project.brollChecks, project.editorNotes])

  function toggleBroll(line: string) {
    const key = lineHash(line)
    setBrollChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      if (brollTimer.current) clearTimeout(brollTimer.current)
      brollTimer.current = setTimeout(() => {
        patchProject(project.id, { brollChecks: next }).then(onUpdate)
      }, 500)
      return next
    })
  }

  function toggleGear(item: string) {
    setGearChecked((prev) => ({ ...prev, [item]: !prev[item] }))
  }

  function handleEditorNotesChange(val: string) {
    setEditorNotes(val)
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(() => {
      patchProject(project.id, { editorNotes: val }).then(onUpdate)
    }, 800)
  }

  const script = project.script ?? ""
  const brollLines = parseBrollLines(script)
  const arollLines = parseArollLines(script)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Shot List */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Video className="h-4 w-4 text-muted-foreground" />
            Shot List
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {brollLines.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No B-roll shots yet. Add <code className="text-xs bg-muted px-1 py-0.5 rounded">[B: description]</code> lines in your script.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {brollLines.map((line, i) => {
                const key = lineHash(line)
                return (
                  <li key={i} className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-primary cursor-pointer"
                      checked={!!brollChecked[key]}
                      onChange={() => toggleBroll(line)}
                    />
                    <span className={`text-sm leading-snug ${brollChecked[key] ? "line-through text-muted-foreground/50" : ""}`}>
                      {line}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* A-Roll Outline */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Camera className="h-4 w-4 text-muted-foreground" />
            A-Roll Outline
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {arollLines.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No A-roll lines yet. Add <code className="text-xs bg-muted px-1 py-0.5 rounded">[A] talking point</code> lines in your script.
            </p>
          ) : (
            <ol className="space-y-2">
              {arollLines.map((line, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <span className="font-mono text-muted-foreground/60 shrink-0 text-xs mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="leading-snug">{line}</span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Gear Checklist */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            Gear Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <ul className="space-y-2.5">
            {GEAR_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 shrink-0 accent-primary cursor-pointer"
                  checked={!!gearChecked[item]}
                  onChange={() => toggleGear(item)}
                />
                <span className={`text-sm ${gearChecked[item] ? "line-through text-muted-foreground/50" : ""}`}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Editor Notes */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">Notes for Editor</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <Textarea
            className="min-h-[160px] resize-none text-sm"
            placeholder={"Jump cut at 2:30\nColor grade warm\nAdd lower third at intro\n…"}
            value={editorNotes}
            onChange={(e) => handleEditorNotesChange(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">auto-saved</p>
        </CardContent>
      </Card>
    </div>
  )
}
