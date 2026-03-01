"use client"

import { useQuery } from "@tanstack/react-query"
import type { Project } from "@/lib/projects"

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects")
  if (!res.ok) throw new Error("Failed to fetch projects")
  return res.json()
}

async function fetchProject(id: string): Promise<Project | null> {
  const res = await fetch(`/api/projects/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error("Failed to fetch project")
  return res.json()
}

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    staleTime: 30 * 1000,
  })
}

export function useProject(id: string) {
  return useQuery<Project | null>({
    queryKey: ["project", id],
    queryFn: () => fetchProject(id),
    staleTime: 30 * 1000,
  })
}
