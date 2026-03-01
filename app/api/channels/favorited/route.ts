import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { FavoritedChannel } from "@/lib/channels"

function toChannel(row: Record<string, unknown>): FavoritedChannel {
  return {
    id:              row.id as string,
    channelId:       row.channel_id as string,
    title:           row.title as string,
    thumbnail:       (row.thumbnail as string | null) ?? null,
    subscriberCount: (row.subscriber_count as string | null) ?? null,
    savedAt:         row.saved_at as string,
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("favorited_channels")
    .select("*")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json((data ?? []).map(toChannel))
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { channelId, title, thumbnail, subscriberCount } = await req.json()

  const { error } = await supabase
    .from("favorited_channels")
    .upsert(
      { user_id: user.id, channel_id: channelId, title, thumbnail, subscriber_count: subscriberCount },
      { onConflict: "user_id,channel_id" }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { channelId } = await req.json()

  const { error } = await supabase
    .from("favorited_channels")
    .delete()
    .eq("user_id", user.id)
    .eq("channel_id", channelId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
