export type Project = {
  id: string
  title: string
  topic: string
  description: string
  createdAt: string
}

const KEY = "reconic:projects"

export function loadProjects(): Project[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]")
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
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function deleteProject(id: string): void {
  const all = loadProjects().filter((p) => p.id !== id)
  localStorage.setItem(KEY, JSON.stringify(all))
  deleteProjectThumbnail(id)
}

export function getProjectThumbnail(id: string): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(`reconic:thumbnail:${id}`)
}

export function setProjectThumbnail(id: string, base64: string): void {
  localStorage.setItem(`reconic:thumbnail:${id}`, base64)
}

export function deleteProjectThumbnail(id: string): void {
  localStorage.removeItem(`reconic:thumbnail:${id}`)
}

export function getProject(id: string): Project | undefined {
  return loadProjects().find((p) => p.id === id)
}
