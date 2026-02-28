export type ProjectStatusLabel = 'published' | 'editing' | 'filming' | 'scripted' | 'idea'

export type Project = {
  id: string
  title: string
  topic: string
  description: string
  createdAt: string
  chosenTitle?: string
  status?: 'filming' | 'editing' | 'published'
  notes?: string
  targetDuration?: number
}

export const STATUS_CONFIG: Record<ProjectStatusLabel, { label: string; className: string }> = {
  idea:      { label: 'Idea',      className: 'bg-muted text-muted-foreground border-muted' },
  scripted:  { label: 'Scripted',  className: 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400' },
  filming:   { label: 'Filming',   className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:text-yellow-400' },
  editing:   { label: 'Editing',   className: 'bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-400' },
  published: { label: 'Published', className: 'bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-500' },
}

let _userId = ""

export function setCurrentUser(id: string): void {
  _userId = id
}

function projectsKey() {
  return _userId ? `reconic:${_userId}:projects` : "reconic:projects"
}

function thumbnailKey(id: string) {
  return _userId ? `reconic:${_userId}:thumbnail:${id}` : `reconic:thumbnail:${id}`
}

export function scriptKey(projectId: string) {
  return _userId ? `reconic:${_userId}:script:${projectId}` : `reconic:script:${projectId}`
}

export function computeStatus(project: Project): ProjectStatusLabel {
  if (project.status) return project.status
  if (typeof window !== 'undefined') {
    const script = localStorage.getItem(scriptKey(project.id)) ?? ''
    const wordCount = script.trim().split(/\s+/).filter(Boolean).length
    if (wordCount > 50) return 'scripted'
  }
  return 'idea'
}

export function loadProjects(): Project[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(projectsKey()) ?? "[]")
  } catch {
    return []
  }
}

export function saveProject(project: Project): void {
  const all = loadProjects()
  const idx = all.findIndex((p) => p.id === project.id)
  if (idx >= 0) {
    all[idx] = project
  } else {
    all.unshift(project)
  }
  localStorage.setItem(projectsKey(), JSON.stringify(all))
}

export function deleteProject(id: string): void {
  const all = loadProjects().filter((p) => p.id !== id)
  localStorage.setItem(projectsKey(), JSON.stringify(all))
  deleteProjectThumbnail(id)
}

export function getProjectThumbnail(id: string): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(thumbnailKey(id))
}

export function setProjectThumbnail(id: string, base64: string): void {
  localStorage.setItem(thumbnailKey(id), base64)
}

export function deleteProjectThumbnail(id: string): void {
  localStorage.removeItem(thumbnailKey(id))
}

export function getProject(id: string): Project | undefined {
  return loadProjects().find((p) => p.id === id)
}

export function updateProject(id: string, changes: Partial<Project>): Project | null {
  const all = loadProjects()
  const idx = all.findIndex((p) => p.id === id)
  if (idx < 0) return null
  all[idx] = { ...all[idx], ...changes }
  localStorage.setItem(projectsKey(), JSON.stringify(all))
  return all[idx]
}
