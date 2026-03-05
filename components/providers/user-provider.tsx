"use client"

import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export function UserProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const prevUserId = useRef<string | null | "unset">("unset")

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const id = session?.user?.id ?? null
      // Skip the initial fire — only clear on actual user switches
      if (prevUserId.current !== "unset" && id !== prevUserId.current) {
        queryClient.clear()
      }
      prevUserId.current = id
    })

    return () => subscription.unsubscribe()
  }, [queryClient])

  return <>{children}</>
}
