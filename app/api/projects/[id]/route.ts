import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { Project } from "@/lib/projects"

function toProject(row: Record<string, unknown>): Project {
  return {
    id:             row.id as string,
    title:          row.title as string,
    topic:          row.topic as string,
    description:    (row.description as string) ?? "",
    createdAt:      row.created_at as string,
    chosenTitle:    (row.chosen_title as string | null) ?? undefined,
    status:         (row.status as Project["status"]) ?? undefined,
    notes:          (row.notes as string | null) ?? undefined,
    targetDuration: (row.target_duration as number | null) ?? undefined,
    thumbnail:      (row.thumbnail as string | null) ?? undefined,
    script:         (row.script as string | null) ?? undefined,
    aiSuggestions:  (row.ai_suggestions as Project["aiSuggestions"]) ?? undefined,
    brollChecks:    (row.broll_checks as Project["brollChecks"]) ?? undefined,
    editorNotes:    (row.editor_notes as string | null) ?? undefined,
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(toProject(data))
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const changes = await request.json() as Partial<Project>

  const update: Record<string, unknown> = {}
  if ("title"          in changes) update.title           = changes.title
  if ("topic"          in changes) update.topic           = changes.topic
  if ("description"    in changes) update.description     = changes.description
  if ("chosenTitle"    in changes) update.chosen_title    = changes.chosenTitle ?? null
  if ("status"         in changes) update.status          = changes.status ?? null
  if ("notes"          in changes) update.notes           = changes.notes ?? null
  if ("targetDuration" in changes) update.target_duration = changes.targetDuration ?? null
  if ("thumbnail"      in changes) update.thumbnail       = changes.thumbnail ?? null
  if ("script"         in changes) update.script          = changes.script ?? null
  if ("aiSuggestions"  in changes) update.ai_suggestions  = changes.aiSuggestions ?? null
  if ("brollChecks"    in changes) update.broll_checks    = changes.brollChecks ?? null
  if ("editorNotes"    in changes) update.editor_notes    = changes.editorNotes ?? null

  const { error } = await supabase
    .from("projects")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
