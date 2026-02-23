import { NextRequest, NextResponse } from "next/server"
import { searchVideos, searchChannels } from "@/lib/youtube"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const q = searchParams.get("q")
  const type = searchParams.get("type") ?? "video"

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: "Missing required parameter: q" }, { status: 400 })
  }

  if (type !== "video" && type !== "channel") {
    return NextResponse.json({ error: "Invalid type. Must be 'video' or 'channel'" }, { status: 400 })
  }

  try {
    if (type === "channel") {
      const results = await searchChannels(q)
      return NextResponse.json(results)
    } else {
      const results = await searchVideos(q)
      return NextResponse.json(results)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    const isKeyMissing = message.includes("YOUTUBE_DATA_API_KEY")
    return NextResponse.json(
      { error: isKeyMissing ? "API key not configured" : message },
      { status: isKeyMissing ? 503 : 500 }
    )
  }
}
