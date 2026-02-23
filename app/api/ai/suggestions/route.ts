import { NextRequest, NextResponse } from "next/server"
import { google } from "@ai-sdk/google"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  const { topic, description, duration } = await request.json()

  if (!topic?.trim()) {
    return NextResponse.json({ error: "Missing topic" }, { status: 400 })
  }

  const targetDuration: number = Number(duration) || 20
  const targetWords = Math.round(targetDuration * 130)

  const context = description?.trim()
    ? `Topic: ${topic}\nDescription: ${description}`
    : `Topic: ${topic}`

  const prompt = `You are a YouTube content strategist specializing in longform video (${targetDuration}-minute target, ~${targetWords} words).

${context}

Respond with valid JSON only (no markdown, no explanation):
{
  "titles": ["5 compelling YouTube video titles, each optimized for clicks and SEO"],
  "thumbnailConcepts": ["3 thumbnail concept descriptions, each 1-2 sentences describing visual layout, text overlay, and style"],
  "scriptOutline": ["act-structured sections with time allocations, e.g. \\"Hook (0:00–1:30): Grab attention with the core problem or surprising claim\\", covering the full ${targetDuration} minutes"],
  "hookVariants": ["3 alternative opening hooks — one story-based (personal anecdote or narrative), one statistic-based (striking data point), one controversy-based (bold claim or contrarian take) — each 2-3 sentences"],
  "chapterMarkers": ["YouTube chapter timestamp suggestions in the format \\"0:00 Introduction\\", \\"2:30 The Core Problem\\", etc., covering the full video"]
}

Guidelines:
- Titles: punchy, curiosity-driven, specific — no clickbait without substance
- Script outline: use act structure appropriate for a ${targetDuration}-min video with realistic time allocations
- Hook variants: each should feel distinct and be ready to use as an opening monologue
- Chapter markers: 5–8 chapters spaced naturally across ${targetDuration} minutes`

  try {
    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      prompt,
    })

    const json = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim())
    return NextResponse.json(json)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
