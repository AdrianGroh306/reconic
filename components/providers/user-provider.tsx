"use client"

import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export function UserProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const prevUserId = useRef<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const id = session?.user?.id ?? ""
      if (id !== prevUserId.current) {
        prevUserId.current = id
        // Clear all cached data when user changes
        queryClient.clear()
      }
    })

    return () => subscription.unsubscribe()
  }, [queryClient])

  return <>{children}</>
}
