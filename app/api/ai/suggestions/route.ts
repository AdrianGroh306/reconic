import { NextRequest } from "next/server"
import { google } from "@ai-sdk/google"
import { streamObject } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const suggestionsSchema = z.object({
  titles: z.array(z.string()).describe("5 compelling YouTube video titles"),
  thumbnailConcepts: z.array(z.string()).describe("3 thumbnail concept descriptions"),
  scriptOutline: z.array(z.string()).describe("Act-structured sections with time allocations"),
  hookVariants: z.array(z.string()).describe("3 alternative opening hooks"),
  chapterMarkers: z.array(z.string()).describe("YouTube chapter timestamps"),
})

async function getChannelContext(): Promise<string> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ""

    const { data: account } = await supabase
      .from("youtube_accounts")
      .select("channel_name, niche, avg_video_duration_seconds, upload_frequency, top_tags, subscriber_count, recent_video_titles")
      .eq("user_id", user.id)
      .limit(1)
      .single()

    if (!account?.niche) return ""

    const parts = [`\nCreator Profile (${account.channel_name}):`]
    parts.push(`- Niche: ${account.niche}`)
    if (account.subscriber_count) parts.push(`- Subscribers: ${account.subscriber_count.toLocaleString()}`)
    if (account.avg_video_duration_seconds) {
      const mins = Math.round(account.avg_video_duration_seconds / 60)
      parts.push(`- Typical video length: ~${mins} minutes`)
    }
    if (account.upload_frequency) parts.push(`- Upload cadence: ${account.upload_frequency}`)
    if (account.top_tags?.length) parts.push(`- Recurring topics/keywords: ${account.top_tags.join(", ")}`)
    if (account.recent_video_titles?.length) {
      parts.push(`- Recent videos (use to avoid repetition, match naming style, identify gaps):\n${account.recent_video_titles.slice(0, 20).map((t: string, i: number) => `  ${i + 1}. ${t}`).join("\n")}`)
    }

    return parts.join("\n")
  } catch {
    return ""
  }
}

export async function POST(request: NextRequest) {
  const { topic, description, duration } = await request.json()

  if (!topic?.trim()) {
    return new Response(JSON.stringify({ error: "Missing topic" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const targetDuration: number = Number(duration) || 20
  const targetWords = Math.round(targetDuration * 130)

  const context = description?.trim()
    ? `Topic: ${topic}\nDescription: ${description}`
    : `Topic: ${topic}`

  const channelContext = await getChannelContext()

  const result = streamObject({
    model: google("gemini-2.5-flash"),
    schema: suggestionsSchema,
    prompt: `You are a YouTube content strategist specializing in longform video (${targetDuration}-minute target, ~${targetWords} words).

${context}${channelContext}

Guidelines:
- titles: 5 punchy, curiosity-driven, specific titles — no clickbait without substance${channelContext ? ". Match the creator's existing style and niche" : ""}
- thumbnailConcepts: 3 thumbnail descriptions, each 1-2 sentences describing visual layout, text overlay, and style
- scriptOutline: act-structured sections with time allocations, e.g. "Hook (0:00–1:30): Grab attention with the core problem or surprising claim", covering the full ${targetDuration} minutes
- hookVariants: 3 alternative opening hooks — one story-based (personal anecdote), one statistic-based (striking data point), one controversy-based (bold claim) — each 2-3 sentences${channelContext ? ". Tailor to the creator's audience and content style" : ""}
- chapterMarkers: 5–8 YouTube chapter timestamps in format "0:00 Introduction", "2:30 The Core Problem", etc.`,
  })

  return result.toTextStreamResponse()
}
