"use client"

import { QueryClient } from "@tanstack/react-query"
import { QueryClientProvider } from "@tanstack/react-query"
import { persistQueryClient } from "@tanstack/query-persist-client-core"
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import { useState, useEffect } from "react"

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,   // 5 min — don't refetch if data is fresh
        gcTime: 1000 * 60 * 60 * 24, // 24 h — keep cache alive in localStorage
      },
    },
  })
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const persister = createSyncStoragePersister({ storage: window.localStorage })
    persistQueryClient({ queryClient, persister })
    setReady(true)
  }, [queryClient])

  if (!ready) return null

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
