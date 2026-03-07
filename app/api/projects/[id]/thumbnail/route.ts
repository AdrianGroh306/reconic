import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const BUCKET = "thumbnails"

function storagePath(userId: string, projectId: string) {
  return `${userId}/${projectId}.jpg`
}

// POST — upload thumbnail (multipart/form-data with "file" field)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  // Verify project ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const path = storagePath(user.id, id)

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: "image/jpeg", upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)

  // Save URL to projects table
  await supabase.from("projects").update({ thumbnail: publicUrl }).eq("id", id)

  return NextResponse.json({ url: publicUrl })
}

// DELETE — remove thumbnail from storage and clear DB field
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await supabase.storage.from(BUCKET).remove([storagePath(user.id, id)])
  await supabase.from("projects").update({ thumbnail: null }).eq("id", id)

  return NextResponse.json({ ok: true })
}
