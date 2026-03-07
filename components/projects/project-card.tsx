"use client"

import { useRouter } from "next/navigation"
import { ImageIcon, MoreVertical, ExternalLink, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { computeStatus, STATUS_CONFIG, type Project } from "@/lib/projects"

interface ProjectCardProps {
  project: Project
  onDelete?: (id: string) => void
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const router = useRouter()
  const status = computeStatus(project)
  const cfg = STATUS_CONFIG[status]

  return (
    <Card
      className="cursor-pointer overflow-hidden pt-0 gap-3 transition-shadow hover:shadow-md"
      onClick={() => router.push(`/projects/${project.id}`)}
    >
      <div className="aspect-video w-full bg-muted relative overflow-hidden">
        {project.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnail}
            alt={project.title}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute bottom-2 right-2">
          <Badge variant="outline" className={`text-xs font-medium ${cfg.className} backdrop-blur-sm`}>
            {cfg.label}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{project.chosenTitle ?? project.title}</CardTitle>
          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground"
                    onClick={(e) => e.stopPropagation()}
                  />
                }
              >
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/projects/${project.id}`)
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(project.id)
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <CardDescription className="line-clamp-1">{project.topic}</CardDescription>
      </CardHeader>

      {project.description && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        </CardContent>
      )}
    </Card>
  )
}
