"use client"

import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { setCurrentUser } from "@/lib/projects"
import { setChannelsUser } from "@/lib/channels"

export function UserProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const prevUserId = useRef<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id ?? ""
      setCurrentUser(id)
      setChannelsUser(id)
      prevUserId.current = id
      // Clear cached project data so new user sees their own
      queryClient.removeQueries({ queryKey: ["projects"] })
      queryClient.removeQueries({ queryKey: ["project"] })
      queryClient.removeQueries({ queryKey: ["favorited-channels"] })
    })

    // Also listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const id = session?.user?.id ?? ""
      if (id !== prevUserId.current) {
        setCurrentUser(id)
        setChannelsUser(id)
        prevUserId.current = id
        queryClient.removeQueries({ queryKey: ["projects"] })
        queryClient.removeQueries({ queryKey: ["project"] })
        queryClient.removeQueries({ queryKey: ["youtube-account"] })
        queryClient.removeQueries({ queryKey: ["youtube-access-token"] })
        queryClient.removeQueries({ queryKey: ["channel-videos"] })
        queryClient.removeQueries({ queryKey: ["favorited-channels"] })
      }
    })

    return () => subscription.unsubscribe()
  }, [queryClient])

  return <>{children}</>
}
