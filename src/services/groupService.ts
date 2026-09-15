import { supabase } from "../lib/supabase"
import { mapGrupo } from "../lib/supabaseData"
import type { Grupo } from "../types"

export async function fetchGrupoBySlug(slug: string): Promise<Grupo | null> {
  if (!supabase) return null
  const clean = slug.trim().toLowerCase()
  if (!clean) return null
  const { data, error } = await supabase.from("grupos").select("*").eq("slug", clean).maybeSingle()
  if (error || !data) return null
  return mapGrupo(data)
}
