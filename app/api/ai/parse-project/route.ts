import { NextRequest, NextResponse } from "next/server"
import { google } from "@ai-sdk/google"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  const { vision } = await request.json()

  if (!vision?.trim()) {
    return NextResponse.json({ error: "Missing vision" }, { status: 400 })
  }

  const prompt = `You are helping a YouTube creator set up a new video project.

The creator wrote this description of their video idea:
"${vision.trim()}"

Extract the following and respond with valid JSON only (no markdown, no explanation):
{
  "title": "A short, catchy internal project name (3–6 words, not a YouTube title — think folder name)",
  "topic": "One sentence describing what the video is about, from the viewer's perspective",
  "description": "2–3 sentences with more context: the angle, format, and why it would be interesting to watch"
}

Rules:
- title: concise, no clickbait, no special characters — something the creator would recognize in a list
- topic: clear and specific, starts with a verb or noun (not "This video...")
- description: captures the hook and the creator's intent`

  try {
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt,
    })

    const json = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim())
    return NextResponse.json(json)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
