import type { User } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import type { AppData, Grupo, Nivel, Plano, Profile, Role } from "../types"
import { readInviteSlug } from "./inviteSlug"

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
    return "E-mail ou senha não conferem."
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Esse e-mail já está cadastrado."
  }
  if (m.includes("password")) return "Senha inválida. Use pelo menos 8 caracteres."
  if (m.includes("failed to fetch") || m.includes("network") || m.includes("fetch")) {
    return "Sem conexão com o servidor. Tente de novo."
  }
  if (m.includes("pgrst") || m.includes("jwt") || m.includes("session")) {
    return "Sessão expirada. Entre de novo."
  }
  if (m.includes("authapi")) return "Não foi possível autenticar. Tente de novo."
  return "Não foi possível concluir. Tente de novo."
}

export function cloudErrorMessage(raw: string) {
  const m = raw.toLowerCase()
  if (m.includes("fora da janela")) {
    return "Check-in só abre 45 min antes e fecha 3h depois do treino."
  }
  if (m.includes("já registrada") || m.includes("ja registrada") || m.includes("duplicate") || m.includes("unique")) {
    return "Presença já registrada neste treino."
  }
  if (m.includes("qr inválido") || m.includes("qr invalido")) {
    return "QR Code inválido para este grupo."
  }
  if (m.includes("não encontrado") || m.includes("nao encontrado")) {
    return "Treino não encontrado."
  }
  if (m.includes("row-level") || m.includes("violates") || m.includes("permission")) {
    return "Você não tem permissão para esta ação."
  }
  if (m.includes("failed to fetch") || m.includes("network")) {
    return "Sem conexão com o servidor. Tente de novo."
  }
  return "Não foi possível salvar. Tente de novo."
}

export const DEFAULT_AVATAR = "/avatar-default.svg"

export function officialFotoUrl(raw: string | null | undefined) {
  if (!raw) return DEFAULT_AVATAR
  if (raw.startsWith("data:") || raw.startsWith("blob:")) return DEFAULT_AVATAR
  if (raw.includes("pravatar.cc")) return DEFAULT_AVATAR
  return raw
}

export function embeddedFotoError(url: string | undefined) {
  if (!url) return null
  if (url.startsWith("data:") || url.startsWith("blob:")) {
    return "A foto precisa ir para o armazenamento do grupo, não como arquivo embutido."
  }
  return null
}

export function mapGrupo(row: GrupoRow): Grupo {
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

export function mapProfile(row: ProfileRow, fallbackEmail: string): Profile {
  const email = row.email || fallbackEmail
  return {
    id: row.id,
    grupoId: row.grupo_id || "",
    nome: row.nome,
    email,
    fotoUrl: officialFotoUrl(row.foto_url),
    dataNascimento: row.data_nascimento ?? undefined,
    distanciaPreferida: row.distancia_preferida ?? undefined,
    paceMedio: row.pace_medio ?? undefined,
    nivel: (row.nivel as Nivel) || "iniciante",
    meta: row.meta ?? undefined,
    bio: row.bio ?? undefined,
    role: (row.role as Role) || "atleta",
  }
}

async function resolveGrupoId(user: User): Promise<string | null> {
  if (!supabase) return null
  const meta = user.user_metadata ?? {}
  const slug = String(meta.grupo_slug || readInviteSlug() || "").trim().toLowerCase()
  if (slug) {
    const { data, error } = await supabase.from("grupos").select("id").eq("slug", slug).maybeSingle()
    if (!error && data?.id) return data.id
  }
  const { data } = await supabase.from("grupos").select("id").limit(20)
  return data?.[0]?.id ?? null
}

export async function ensureProfile(user: User): Promise<Profile | null> {
  if (!supabase) return null
  const email = user.email ?? ""
  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()
  if (readError) return null
  if (existing) {
    return mapProfile(existing as ProfileRow, email)
  }
  const gid = await resolveGrupoId(user)
  const meta = user.user_metadata ?? {}
  const row = {
    id: user.id,
    grupo_id: gid,
    nome: String(meta.nome || email.split("@")[0] || "Atleta"),
    email,
    nivel: (meta.nivel as Nivel) || "iniciante",
    role: "atleta",
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
  // Mantido para compatibilidade: o carregamento completo está em hydrateGroupData.
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
      ...current.grupo,
      ...grupo,
      logoUrl: grupo.logoUrl || current.grupo.logoUrl,
      spotifyUrl: grupo.spotifyUrl || current.grupo.spotifyUrl,
    },
    profiles,
    currentUserId: user.id,
  }
}

export async function saveProfilePatch(id: string, patch: Partial<Profile>) {
  const fotoErro = embeddedFotoError(patch.fotoUrl)
  if (fotoErro) return { error: fotoErro }
  if (!supabase) return { error: null }
  const row: Record<string, string | undefined> = {}
  if (patch.nome !== undefined) row.nome = patch.nome
  if (patch.fotoUrl !== undefined) row.foto_url = patch.fotoUrl
  if (patch.dataNascimento !== undefined) row.data_nascimento = patch.dataNascimento
  if (patch.distanciaPreferida !== undefined) row.distancia_preferida = patch.distanciaPreferida
  if (patch.paceMedio !== undefined) row.pace_medio = patch.paceMedio
  if (patch.nivel !== undefined) row.nivel = patch.nivel
  if (patch.meta !== undefined) row.meta = patch.meta
  if (patch.bio !== undefined) row.bio = patch.bio
  if (Object.keys(row).length === 0) return { error: null }
  const { error } = await supabase.from("profiles").update(row).eq("id", id)
  return { error: error ? cloudErrorMessage(error.message) : null }
}

export async function saveGrupoSpotify(grupoId: string, url: string) {
  if (!supabase) return { error: null }
  const { error } = await supabase.from("grupos").update({ spotify_url: url || null }).eq("id", grupoId)
  return { error: error ? cloudErrorMessage(error.message) : null }
}
