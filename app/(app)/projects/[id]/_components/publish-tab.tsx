"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ExternalLink, Loader2, Upload, Youtube } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { getYouTubeAccessToken } from "@/lib/youtube-account"
import { getProjectThumbnail, type Project } from "@/lib/projects"
import {
  initiateUpload,
  uploadVideo,
  setThumbnail,
} from "@/lib/youtube-upload"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type PrivacyStatus = "public" | "unlisted" | "private"
type UploadState =
  | { kind: "idle" }
  | { kind: "uploading"; progress: number }
  | { kind: "success"; videoId: string }
  | { kind: "error"; message: string }

interface Props {
  project: Project
}

export function PublishTab({ project }: Props) {
  const [title, setTitle] = useState(project.title)
  const [description, setDescription] = useState(project.description ?? "")
  const [privacy, setPrivacy] = useState<PrivacyStatus>("unlisted")
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<UploadState>({ kind: "idle" })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: accessToken, isLoading } = useQuery<string | null>({
    queryKey: ["youtube-access-token"],
    queryFn: () => getYouTubeAccessToken(),
    staleTime: 30 * 60 * 1000,
  })

  const connected = !isLoading && accessToken !== undefined ? !!accessToken : null

  async function handlePublish() {
    if (!file || !accessToken) return

    setState({ kind: "uploading", progress: 0 })

    try {
      const uploadUrl = await initiateUpload(
        accessToken,
        { title, description, privacyStatus: privacy },
        file.size
      )

      const videoId = await uploadVideo(uploadUrl, file, (pct) => {
        setState({ kind: "uploading", progress: pct })
      })

      const thumbnail = getProjectThumbnail(project.id)
      if (thumbnail) {
        try {
          await setThumbnail(accessToken, videoId, thumbnail)
        } catch {
          // Thumbnail failure is non-fatal
        }
      }

      setState({ kind: "success", videoId })
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Upload failed",
      })
    }
  }

  if (connected === null) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center space-y-3">
        <Youtube className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Connect your YouTube account to publish videos from Reconic.
        </p>
        <Link href="/settings" className={buttonVariants({ variant: "outline" })}>
          Go to Settings
        </Link>
      </div>
    )
  }

  if (state.kind === "success") {
    return (
      <div className="rounded-lg border p-8 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-green-600">
          <Youtube className="h-6 w-6" />
          <span className="text-lg font-semibold">Published!</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Your video is live on YouTube.
        </p>
        <a
          href={`https://youtu.be/${state.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants()}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          View on YouTube
        </a>
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setState({ kind: "idle" })}
          >
            Publish another
          </Button>
        </div>
      </div>
    )
  }

  const isUploading = state.kind === "uploading"

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isUploading}
            maxLength={100}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isUploading}
            rows={5}
            maxLength={5000}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Privacy</label>
          <Select
            value={privacy}
            onValueChange={(v) => setPrivacy(v as PrivacyStatus)}
            disabled={isUploading}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="unlisted">Unlisted</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Video File</label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Choose file
            </Button>
            {file && (
              <span className="text-sm text-muted-foreground">
                {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
              </span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      {state.kind === "uploading" && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Uploading…</span>
            <span>{state.progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}

      {state.kind === "error" && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <Button
        onClick={handlePublish}
        disabled={!file || !title.trim() || isUploading}
      >
        {isUploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Youtube className="mr-2 h-4 w-4" />
        )}
        {isUploading ? "Uploading…" : "Publish to YouTube"}
      </Button>
    </div>
  )
}
