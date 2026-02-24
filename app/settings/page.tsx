"use client"

import { useEffect, useState } from "react"
import { Youtube, CheckCircle2, LogOut, Loader2, Users, Video } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Session } from "@supabase/supabase-js"

type ChannelInfo = {
  name: string
  avatar: string
  subscriberCount?: string
  videoCount?: string
}

function formatCount(n: string): string {
  const num = parseInt(n)
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${Math.round(num / 1_000)}K`
  return n
}

async function fetchChannelInfo(token: string): Promise<ChannelInfo | null> {
  try {
    const res = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const item = data.items?.[0]
    if (!item) return null
    const snippet = item.snippet as Record<string, unknown>
    const stats = item.statistics as Record<string, unknown>
    const thumbs = snippet.thumbnails as Record<string, { url: string }>
    return {
      name: snippet.title as string,
      avatar:
        thumbs?.high?.url ?? thumbs?.medium?.url ?? thumbs?.default?.url ?? "",
      subscriberCount: stats?.subscriberCount as string | undefined,
      videoCount: stats?.videoCount as string | undefined,
    }
  } catch {
    return null
  }
}

export default function SettingsPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
      if (data.session?.provider_token) {
        fetchChannelInfo(data.session.provider_token).then(setChannelInfo)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s?.provider_token) {
        fetchChannelInfo(s.provider_token).then(setChannelInfo)
      } else {
        setChannelInfo(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleConnect() {
    setConnecting(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes:
          "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
        redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    })
    setConnecting(false)
  }

  async function handleDisconnect() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setChannelInfo(null)
  }

  const isConnected = !!session?.provider_token

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
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {channelInfo?.avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={channelInfo.avatar}
                  alt={channelInfo.name}
                  className="h-12 w-12 rounded-full object-cover shrink-0"
                />
              )}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="font-semibold">
                    {channelInfo?.name ?? session?.user?.user_metadata?.full_name}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {channelInfo?.subscriberCount && (
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {formatCount(channelInfo.subscriberCount)} subscribers
                    </Badge>
                  )}
                  {channelInfo?.videoCount && (
                    <Badge variant="secondary" className="gap-1">
                      <Video className="h-3 w-3" />
                      {parseInt(channelInfo.videoCount).toLocaleString()} videos
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
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your YouTube account to publish videos directly from Reconic.
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
    </div>
  )
}
