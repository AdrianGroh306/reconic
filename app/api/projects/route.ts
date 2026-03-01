import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { Project } from "@/lib/projects"

function toProject(row: Record<string, unknown>): Project {
  return {
    id:              row.id as string,
    title:           row.title as string,
    topic:           row.topic as string,
    description:     (row.description as string) ?? "",
    createdAt:       row.created_at as string,
    chosenTitle:     (row.chosen_title as string | null) ?? undefined,
    status:          (row.status as Project["status"]) ?? undefined,
    notes:           (row.notes as string | null) ?? undefined,
    targetDuration:  (row.target_duration as number | null) ?? undefined,
    thumbnail:       (row.thumbnail as string | null) ?? undefined,
    script:          (row.script as string | null) ?? undefined,
    aiSuggestions:   (row.ai_suggestions as Project["aiSuggestions"]) ?? undefined,
    brollChecks:     (row.broll_checks as Project["brollChecks"]) ?? undefined,
    editorNotes:     (row.editor_notes as string | null) ?? undefined,
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json((data ?? []).map(toProject))
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json() as Partial<Project>

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id:     user.id,
      title:       body.title ?? "",
      topic:       body.topic ?? "",
      description: body.description ?? "",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(toProject(data))
}
