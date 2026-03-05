"use client"

import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Youtube, CheckCircle2, LogOut, Loader2, Users, Video, RefreshCw, Clock, Tag, Target, Palette } from "lucide-react"
import { getYouTubeAccount, removeYouTubeAccount, type YouTubeAccount } from "@/lib/youtube-account"
import { getCanvaAccount, removeCanvaAccount, type CanvaAccount } from "@/lib/canva-account"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDuration } from "@/lib/youtube"
import { formatCount } from "@/lib/utils"

type AnalysisResult = {
  niche: string
  subNiches: string[]
  contentStyle: string
  targetAudience: string
}

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [connecting, setConnecting] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [canvaConnecting, setCanvaConnecting] = useState(false)

  const { data: account, isLoading: loading } = useQuery<YouTubeAccount | null>({
    queryKey: ["youtube-account"],
    queryFn: () => getYouTubeAccount(),
    staleTime: 5 * 60 * 1000,
  })

  const { data: canvaAccount, isLoading: canvaLoading } = useQuery<CanvaAccount | null>({
    queryKey: ["canva-account"],
    queryFn: () => getCanvaAccount(),
    staleTime: 5 * 60 * 1000,
  })

  // Auto-analyze on first load if account exists but hasn't been analyzed
  useEffect(() => {
    if (account && !account.niche && !analyzing && !analysisResult) {
      runAnalysis()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.channel_id])

  async function runAnalysis() {
    setAnalyzing(true)
    try {
      const res = await fetch("/api/youtube/analyze-channel", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setAnalysisResult(data)
        queryClient.invalidateQueries({ queryKey: ["youtube-account"] })
        toast.success("Channel analysis complete")
      } else {
        toast.error("Failed to analyze channel")
      }
    } catch {
      toast.error("Failed to analyze channel")
    } finally {
      setAnalyzing(false)
    }
  }

  function handleConnect() {
    setConnecting(true)
    window.location.href = "/api/youtube/connect"
  }

  async function handleDisconnect() {
    if (!account) return
    await removeYouTubeAccount(account.channel_id)
    queryClient.setQueryData(["youtube-account"], null)
    setAnalysisResult(null)
  }

  function handleCanvaConnect() {
    setCanvaConnecting(true)
    window.location.href = "/api/canva/connect"
  }

  async function handleCanvaDisconnect() {
    await removeCanvaAccount()
    queryClient.setQueryData(["canva-account"], null)
    toast.success("Canva disconnected")
  }

  const isConnected = !!account

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account connections and preferences.
        </p>
      </div>

      <div className="rounded-lg border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-500" />
          <h2 className="text-lg font-semibold">YouTube Account</h2>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : isConnected ? (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {account.channel_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={account.channel_avatar}
                    alt={account.channel_name}
                    className="h-12 w-12 rounded-full object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-muted shrink-0 flex items-center justify-center text-lg font-medium">
                    {account.channel_name[0]?.toUpperCase()}
                  </div>
                )}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="font-semibold">{account.channel_name}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {account.subscriber_count > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <Users className="h-3 w-3" />
                        {formatCount(account.subscriber_count)} subscribers
                      </Badge>
                    )}
                    {account.video_count > 0 && (
                      <Badge variant="secondary" className="gap-1">
                        <Video className="h-3 w-3" />
                        {account.video_count.toLocaleString()} videos
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleDisconnect}>
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                Disconnect
              </Button>
            </div>

            {/* Channel Profile / Analysis */}
            {analyzing ? (
              <div className="rounded-md border border-dashed p-4 flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Analyzing your channel…</span>
              </div>
            ) : account.niche || analysisResult ? (
              <div className="rounded-md border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Channel Profile</h3>
                  <Button variant="ghost" size="sm" onClick={runAnalysis} disabled={analyzing}>
                    <RefreshCw className="mr-1.5 h-3 w-3" />
                    Refresh
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {account.niche && (
                    <div className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Niche</p>
                        <p className="text-sm font-medium capitalize">{account.niche}</p>
                      </div>
                    </div>
                  )}
                  {account.upload_frequency && (
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Upload Frequency</p>
                        <p className="text-sm font-medium capitalize">{account.upload_frequency}</p>
                      </div>
                    </div>
                  )}
                  {account.avg_video_duration_seconds && (
                    <div className="flex items-start gap-2">
                      <Video className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Avg. Duration</p>
                        <p className="text-sm font-medium">{formatDuration(account.avg_video_duration_seconds)}</p>
                      </div>
                    </div>
                  )}
                  {analysisResult?.targetAudience && (
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Target Audience</p>
                        <p className="text-sm font-medium">{analysisResult.targetAudience}</p>
                      </div>
                    </div>
                  )}
                </div>
                {account.top_tags && account.top_tags.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Top Keywords</p>
                      <div className="flex flex-wrap gap-1.5">
                        {account.top_tags.slice(0, 10).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your YouTube account to publish videos and get personalized suggestions.
            </p>
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Youtube className="mr-2 h-4 w-4" />
              )}
              Connect YouTube Account
            </Button>
          </div>
        )}
      </div>

      {/* Canva Section */}
      <div className="rounded-lg border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-semibold">Canva</h2>
        </div>

        {canvaLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : canvaAccount ? (
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <div>
                <p className="font-medium text-sm">{canvaAccount.display_name ?? "Canva Account"}</p>
                <p className="text-xs text-muted-foreground">Connected — use "Open in Canva" in any project to create thumbnails</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleCanvaDisconnect}>
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect Canva to design YouTube thumbnails (1280×720) directly from your projects.
            </p>
            <Button onClick={handleCanvaConnect} disabled={canvaConnecting}>
              {canvaConnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Palette className="mr-2 h-4 w-4" />
              )}
              Connect Canva
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
