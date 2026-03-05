import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const POLL_INTERVAL_MS = 500
const POLL_MAX_MS = 30_000

async function poll(
  jobId: string,
  accessToken: string,
  deadline: number
): Promise<string | null> {
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))

    const res = await fetch(`https://api.canva.com/rest/v1/exports/${jobId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) return null

    const data = await res.json() as {
      job?: { status?: string; urls?: string[] }
    }

    const job = data.job
    if (job?.status === "success" && job.urls?.[0]) {
      return job.urls[0]
    }
    if (job?.status === "failed") return null
  }
  return null
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { designId } = await request.json() as { designId: string }
  if (!designId) return NextResponse.json({ error: "designId required" }, { status: 400 })

  const { data: account } = await supabase
    .from("canva_accounts")
    .select("access_token, refresh_token, token_expires_at")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!account) {
    return NextResponse.json({ error: "Canva not connected" }, { status: 403 })
  }

  let accessToken = account.access_token
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null
  const isExpired = !expiresAt || expiresAt <= new Date(Date.now() + 5 * 60 * 1000)

  if (isExpired && account.refresh_token) {
    const refreshRes = await fetch("https://api.canva.com/rest/v1/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.CANVA_CLIENT_ID!,
        client_secret: process.env.CANVA_CLIENT_SECRET!,
        refresh_token: account.refresh_token,
      }),
    })
    if (refreshRes.ok) {
      const tokens = await refreshRes.json() as { access_token: string; expires_in: number }
      accessToken = tokens.access_token
      await supabase.from("canva_accounts").update({
        access_token: tokens.access_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id)
    }
  }

  // Start export job
  const exportRes = await fetch("https://api.canva.com/rest/v1/exports", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      design_id: designId,
      format: { type: "jpg", quality: 90 },
    }),
  })

  if (!exportRes.ok) {
    const err = await exportRes.text()
    console.error("Canva export start failed:", err)
    return NextResponse.json({ error: "Failed to start export" }, { status: 500 })
  }

  const exportData = await exportRes.json() as { job?: { id?: string } }
  const jobId = exportData.job?.id
  if (!jobId) return NextResponse.json({ error: "No export job ID" }, { status: 500 })

  // Poll until done
  const imageUrl = await poll(jobId, accessToken, Date.now() + POLL_MAX_MS)
  if (!imageUrl) {
    return NextResponse.json({ error: "Export timed out or failed" }, { status: 500 })
  }

  // Download and convert to base64 data URI
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) {
    return NextResponse.json({ error: "Failed to download image" }, { status: 500 })
  }

  const arrayBuffer = await imgRes.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString("base64")
  const thumbnail = `data:image/jpeg;base64,${base64}`

  return NextResponse.json({ thumbnail })
}
