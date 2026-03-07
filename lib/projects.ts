export type ProjectStatus = 'idea' | 'scripted' | 'filming' | 'editing' | 'published'

export type AiSuggestions = {
  titles?: string[]
  thumbnailConcepts?: string[]
  scriptOutline?: string[]
  hookVariants?: string[]
  chapterMarkers?: string[]
  savedConcepts?: string[]
  generatedAt?: string
}

export type Project = {
  id: string
  title: string
  topic: string
  description: string
  createdAt: string
  chosenTitle?: string
  status?: ProjectStatus
  notes?: string
  targetDuration?: number
  thumbnail?: string
  script?: string
  aiSuggestions?: AiSuggestions
  brollChecks?: Record<string, boolean>
  gearChecks?: Record<string, boolean>
  editorNotes?: string
  canvaDesignId?: string
}

export const STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string }> = {
  idea:      { label: 'Idea',      className: 'bg-muted text-muted-foreground border-muted' },
  scripted:  { label: 'Scripted',  className: 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400' },
  filming:   { label: 'Filming',   className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:text-yellow-400' },
  editing:   { label: 'Editing',   className: 'bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-400' },
  published: { label: 'Published', className: 'bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-500' },
}

export function computeStatus(project: Project): ProjectStatus {
  if (project.status) return project.status
  const script = project.script ?? ''
  const wordCount = script.trim().split(/\s+/).filter(Boolean).length
  if (wordCount > 50) return 'scripted'
  return 'idea'
}

// ─── Row → Project mapper (used by API routes) ──────────────────────────────

export function toProject(row: Record<string, unknown>): Project {
  return {
    id:             row.id as string,
    title:          row.title as string,
    topic:          row.topic as string,
    description:    (row.description as string) ?? "",
    createdAt:      row.created_at as string,
    chosenTitle:    (row.chosen_title as string | null) ?? undefined,
    status:         (row.status as Project["status"]) ?? undefined,
    notes:          (row.notes as string | null) ?? undefined,
    targetDuration: (row.target_duration as number | null) ?? undefined,
    thumbnail:      (row.thumbnail as string | null) ?? undefined,
    script:         (row.script as string | null) ?? undefined,
    aiSuggestions:  (row.ai_suggestions as Project["aiSuggestions"]) ?? undefined,
    brollChecks:    (row.broll_checks as Project["brollChecks"]) ?? undefined,
    gearChecks:     (row.gear_checks as Project["gearChecks"]) ?? undefined,
    editorNotes:    (row.editor_notes as string | null) ?? undefined,
    canvaDesignId:  (row.canva_design_id as string | null) ?? undefined,
  }
}

// ─── API helpers ──────────────────────────────────────────────────────────────

export async function createProject(
  data: Pick<Project, 'title' | 'topic' | 'description'>
): Promise<Project> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create project')
  return res.json()
}

export async function patchProject(id: string, changes: Partial<Project>): Promise<void> {
  // Convert undefined values to null so JSON.stringify preserves the keys
  // (the PATCH handler checks `"key" in changes` to know what to update)
  const body: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(changes)) {
    body[k] = v === undefined ? null : v
  }

  const res = await fetch(`/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to update project')
}

export async function removeProject(id: string): Promise<void> {
  const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete project')
}
