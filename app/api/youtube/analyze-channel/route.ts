import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getChannelVideos } from "@/lib/youtube"
import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"

const channelProfileSchema = z.object({
  niche: z.string().describe("Primary content niche, e.g. 'tech reviews', 'personal finance', 'cooking', 'gaming'"),
  subNiches: z.array(z.string()).describe("2-3 specific sub-topics the channel covers"),
  contentStyle: z.string().describe("Brief description of the creator's style, e.g. 'educational with humor', 'fast-paced entertainment'"),
  targetAudience: z.string().describe("Who the content is for, e.g. 'beginner developers', 'fitness enthusiasts aged 20-35'"),
})

function computeUploadFrequency(dates: Date[]): string {
  if (dates.length < 2) return "unknown"
  const sorted = dates.sort((a, b) => b.getTime() - a.getTime())
  const gaps: number[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    gaps.push((sorted[i].getTime() - sorted[i + 1].getTime()) / (1000 * 60 * 60 * 24))
  }
  const avgDays = gaps.reduce((a, b) => a + b, 0) / gaps.length
  if (avgDays <= 1.5) return "daily"
  if (avgDays <= 4) return "2-3x/week"
  if (avgDays <= 8) return "weekly"
  if (avgDays <= 16) return "biweekly"
  return "monthly"
}

function extractTopTags(titles: string[]): string[] {
  const words = new Map<string, number>()
  const stopWords = new Set(["the", "a", "an", "is", "it", "to", "in", "for", "of", "and", "or", "on", "at", "i", "my", "you", "your", "this", "that", "with", "how", "why", "what", "when", "do", "don't", "not", "but", "from", "be", "are", "was", "were", "will", "can", "if", "so", "no", "vs", "all", "just", "get", "got", "its", "about"])

  for (const title of titles) {
    const cleaned = title.toLowerCase().replace(/[^a-z0-9\s]/g, " ")
    for (const word of cleaned.split(/\s+/)) {
      if (word.length >= 3 && !stopWords.has(word)) {
        words.set(word, (words.get(word) ?? 0) + 1)
      }
    }
  }

  return [...words.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word)
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get the user's linked YouTube account
  const { data: account } = await supabase
    .from("youtube_accounts")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  if (!account) {
    return NextResponse.json({ error: "No YouTube account linked" }, { status: 404 })
  }

  try {
    // Fetch last 20 videos for analysis
    const videos = await getChannelVideos(account.channel_id, 20)

    if (videos.length === 0) {
      return NextResponse.json({ error: "No videos found" }, { status: 404 })
    }

    // Compute stats
    const durations = videos
      .map((v) => v.durationSeconds)
      .filter((d): d is number => d !== undefined && d > 0)
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null

    const publishDates = videos.map((v) => new Date(v.publishedAt))
    const uploadFrequency = computeUploadFrequency(publishDates)

    const titles = videos.map((v) => v.title)
    const topTags = extractTopTags(titles)

    // Use AI to detect niche and content style from video titles
    const { object: profile } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: channelProfileSchema,
      prompt: `Analyze this YouTube channel based on their recent video titles and determine their niche, content style, and target audience.

Channel: ${account.channel_name}
Subscriber count: ${account.subscriber_count}
Recent video titles:
${titles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Frequent keywords: ${topTags.join(", ")}`,
    })

    // Save to DB
    await supabase
      .from("youtube_accounts")
      .update({
        niche: profile.niche,
        avg_video_duration_seconds: avgDuration,
        upload_frequency: uploadFrequency,
        top_tags: topTags,
        recent_video_titles: titles,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("channel_id", account.channel_id)

    return NextResponse.json({
      niche: profile.niche,
      subNiches: profile.subNiches,
      contentStyle: profile.contentStyle,
      targetAudience: profile.targetAudience,
      avgDurationSeconds: avgDuration,
      uploadFrequency,
      topTags,
      videosAnalyzed: videos.length,
    })
  } catch (err) {
    console.error("Channel analysis error:", err)
    return NextResponse.json(
      { error: "Failed to analyze channel" },
      { status: 500 }
    )
  }
}
