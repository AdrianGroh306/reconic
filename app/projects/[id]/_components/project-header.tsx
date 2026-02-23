"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getProjectThumbnail, setProjectThumbnail, type Project } from "@/lib/projects"

interface ProjectHeaderProps {
  project: Project
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    setThumbnail(getProjectThumbnail(project.id))
  }, [project.id])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setProjectThumbnail(project.id, base64)
      setThumbnail(base64)
    }
    reader.readAsDataURL(file)
    // Reset input so the same file can be re-selected
    e.target.value = ""
  }

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        onClick={() => router.push("/projects")}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Projects
      </Button>

      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-tight">{project.title}</h1>
          <p className="mt-1 text-muted-foreground">{project.topic}</p>
          {project.description && (
            <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>

        {/* Thumbnail upload area */}
        <div
          className="relative shrink-0 cursor-pointer overflow-hidden rounded-lg"
          style={{ width: 240, height: 135 }}
          onClick={() => fileInputRef.current?.click()}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          {thumbnail ? (
            <>
              <img
                src={thumbnail}
                alt="Project thumbnail"
                className="h-full w-full object-cover"
              />
              {hovering && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 text-white">
                  <Upload className="h-5 w-5" />
                  <span className="text-xs font-medium">Change</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60 hover:text-muted-foreground/80 transition-colors">
              <Upload className="h-5 w-5" />
              <span className="text-xs font-medium">Upload thumbnail</span>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
