import type { User } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import type { AppData, Grupo, Nivel, Plano, Profile, Role } from "../types"
import { initialData } from "../data/mock"

const SLUG = "plasts-run"

type GrupoRow = {
  id: string
  nome: string
  slug: string
  logo_url: string | null
  cidade: string | null
  plano: string
  limite_atletas: number
  spotify_url: string | null
}

type ProfileRow = {
  id: string
  grupo_id: string | null
  nome: string
  email: string | null
  foto_url: string | null
  data_nascimento: string | null
  distancia_preferida: string | null
  pace_medio: string | null
  nivel: string
  meta: string | null
  bio: string | null
  role: string
}

export function authErrorMessage(raw: string) {
  const m = raw.toLowerCase()
  if (m.includes("email not confirmed")) {
    return "Abra o e-mail de confirmação. Sem esse clique a mesma senha não entra no celular."
  }
  if (m.includes("invalid login")) {
    return "E-mail ou senha não conferem. Entre uma vez no computador com essa senha para gravar a conta na nuvem, ou crie a conta neste celular."
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Esse e-mail já está cadastrado."
  }
  if (m.includes("password")) return "Senha inválida. Use pelo menos 8 caracteres."
  return raw
}

function mapGrupo(row: GrupoRow): Grupo {
  return {
    id: row.id,
    nome: row.nome,
    slug: row.slug,
    logoUrl: row.logo_url || "/logo-plasts-run.png",
    cidade: row.cidade ?? undefined,
    plano: (row.plano as Plano) || "pro",
    limiteAtletas: row.limite_atletas,
    spotifyUrl: row.spotify_url ?? undefined,
  }
}

function mapProfile(row: ProfileRow, fallbackEmail: string): Profile {
  const email = row.email || fallbackEmail
  return {
    id: row.id,
    grupoId: row.grupo_id || "",
    nome: row.nome,
    email,
    fotoUrl: row.foto_url || `https://i.pravatar.cc/200?u=${encodeURIComponent(email)}`,
    dataNascimento: row.data_nascimento ?? undefined,
    distanciaPreferida: row.distancia_preferida ?? undefined,
    paceMedio: row.pace_medio ?? undefined,
    nivel: (row.nivel as Nivel) || "iniciante",
    meta: row.meta ?? undefined,
    bio: row.bio ?? undefined,
    role: (row.role as Role) || "atleta",
  }
}

async function grupoId(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.from("grupos").select("id").eq("slug", SLUG).maybeSingle()
  return data?.id ?? null
}

export async function ensureProfile(user: User): Promise<Profile | null> {
  if (!supabase) return null
  const email = user.email ?? ""
  const { data: existing } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
  if (existing) {
    return mapProfile(existing as ProfileRow, email)
  }
  const gid = await grupoId()
  const meta = user.user_metadata ?? {}
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("grupo_id", gid)
    .eq("role", "admin")
  const row = {
    id: user.id,
    grupo_id: gid,
    nome: String(meta.nome || email.split("@")[0] || "Atleta"),
    email,
    nivel: (meta.nivel as Nivel) || "iniciante",
    role: count === 0 ? "admin" : "atleta",
    meta: "Começar e não parar",
  }
  const { data: created, error } = await supabase.from("profiles").insert(row).select("*").single()
  if (error || !created) return null
  return mapProfile(created as ProfileRow, email)
}

export async function hydrateFromSupabase(
  user: User,
  current: AppData,
): Promise<AppData | null> {
  if (!supabase) return null
  const me = await ensureProfile(user)
  if (!me) return null
  const [{ data: grupoRow }, { data: profileRows }] = await Promise.all([
    supabase.from("grupos").select("*").eq("id", me.grupoId).maybeSingle(),
    supabase.from("profiles").select("*").eq("grupo_id", me.grupoId),
  ])
  const grupo = grupoRow ? mapGrupo(grupoRow as GrupoRow) : current.grupo
  const profiles = (profileRows as ProfileRow[] | null)?.map((p) =>
    mapProfile(p, p.id === user.id ? (user.email ?? "") : p.email || ""),
  ) ?? [me]
  return {
    ...current,
    grupo: {
      ...initialData.grupo,
      ...grupo,
      logoUrl: grupo.logoUrl || initialData.grupo.logoUrl,
      spotifyUrl: grupo.spotifyUrl || initialData.grupo.spotifyUrl,
    },
    profiles,
    currentUserId: user.id,
  }
}

export async function saveProfilePatch(id: string, patch: Partial<Profile>) {
  if (!supabase) return
  const row: Record<string, string | undefined> = {}
  if (patch.nome !== undefined) row.nome = patch.nome
  if (patch.fotoUrl !== undefined) row.foto_url = patch.fotoUrl
  if (patch.dataNascimento !== undefined) row.data_nascimento = patch.dataNascimento
  if (patch.distanciaPreferida !== undefined) row.distancia_preferida = patch.distanciaPreferida
  if (patch.paceMedio !== undefined) row.pace_medio = patch.paceMedio
  if (patch.nivel !== undefined) row.nivel = patch.nivel
  if (patch.meta !== undefined) row.meta = patch.meta
  if (patch.bio !== undefined) row.bio = patch.bio
  if (Object.keys(row).length === 0) return
  await supabase.from("profiles").update(row).eq("id", id)
}

export async function saveGrupoSpotify(grupoId: string, url: string) {
  if (!supabase) return
  await supabase.from("grupos").update({ spotify_url: url || null }).eq("id", grupoId)
}
