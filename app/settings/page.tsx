"use client"

import { useEffect, useState } from "react"
import { Youtube, CheckCircle2, LogOut, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import type { Session } from "@supabase/supabase-js"

export default function SettingsPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
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
  }

  const isConnected = !!session?.provider_token
  const userName = session?.user?.user_metadata?.full_name ?? session?.user?.email

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {session?.user?.user_metadata?.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.user_metadata.avatar_url}
                  alt={userName ?? "User"}
                  className="h-9 w-9 rounded-full"
                />
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm">{userName}</span>
                </div>
                <p className="text-xs text-muted-foreground">Connected</p>
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
