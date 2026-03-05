import { createClient } from "@/lib/supabase/client"

export type CanvaAccount = {
  id: string
  user_id: string
  canva_user_id: string
  display_name: string | null
  access_token: string
  refresh_token: string | null
  token_expires_at: string | null
}

export async function getCanvaAccount(): Promise<CanvaAccount | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("canva_accounts")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  return data as CanvaAccount | null
}

export async function removeCanvaAccount(): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from("canva_accounts")
    .delete()
    .eq("user_id", user.id)
}

/** Get a valid Canva access token, refreshing if expired */
export async function getCanvaAccessToken(): Promise<string | null> {
  const account = await getCanvaAccount()
  if (!account) return null

  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null
  const isExpired = !expiresAt || expiresAt <= new Date(Date.now() + 5 * 60 * 1000)

  if (!isExpired) return account.access_token

  try {
    const res = await fetch("/api/canva/refresh-token", { method: "POST" })
    if (res.ok) {
      const data = await res.json() as { access_token?: string }
      return data.access_token ?? account.access_token
    }
  } catch {
    // Network error — fall through to old token
  }

  return account.access_token
}
