export type ProjectStatus = 'filming' | 'editing' | 'published'
export type ProjectStatusLabel = 'published' | 'editing' | 'filming' | 'scripted' | 'idea'

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
  editorNotes?: string
}

export const STATUS_CONFIG: Record<ProjectStatusLabel, { label: string; className: string }> = {
  idea:      { label: 'Idea',      className: 'bg-muted text-muted-foreground border-muted' },
  scripted:  { label: 'Scripted',  className: 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400' },
  filming:   { label: 'Filming',   className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:text-yellow-400' },
  editing:   { label: 'Editing',   className: 'bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-400' },
  published: { label: 'Published', className: 'bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-500' },
}

export function computeStatus(project: Project): ProjectStatusLabel {
  if (project.status) return project.status
  const script = project.script ?? ''
  const wordCount = script.trim().split(/\s+/).filter(Boolean).length
  if (wordCount > 50) return 'scripted'
  return 'idea'
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
  const res = await fetch(`/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  })
  if (!res.ok) throw new Error('Failed to update project')
}

export async function removeProject(id: string): Promise<void> {
  const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete project')
}
