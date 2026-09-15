import { supabase } from "./supabase"
import { initialData } from "../data/mock"
import type {
  AppData,
  Checkin,
  CheckinMetodo,
  Comentario,
  Conquista,
  Curtida,
  Mensagem,
  Nivel,
  Participacao,
  Publicacao,
  ReacaoSugestao,
  ReacaoTipo,
  Story,
  Sugestao,
  Treino,
  UsuarioConquista,
} from "../types"
import { cloudErrorMessage, ensureProfile, mapGrupo, mapProfile } from "./supabaseData"

function asTime(value: string) {
  return value.length === 5 ? `${value}:00` : value.slice(0, 8)
}

function mapTreino(row: Record<string, unknown>): Treino {
  const horario = String(row.horario ?? "00:00").slice(0, 5)
  return {
    id: String(row.id),
    grupoId: String(row.grupo_id),
    titulo: String(row.titulo),
    tipo: String(row.tipo ?? "livre"),
    descricao: (row.descricao as string) || undefined,
    data: String(row.data).slice(0, 10),
    horario,
    local: String(row.local),
    distanciaKm: Number(row.distancia_km ?? 0),
    paceSugerido: (row.pace_sugerido as string) || undefined,
    nivel: (row.nivel as Nivel) || "iniciante",
    observacoes: (row.observacoes as string) || undefined,
    treinadorId: (row.treinador_id as string) || undefined,
    qrToken: String(row.qr_token ?? ""),
    criadoPor: String(row.criado_por ?? ""),
  }
}

export async function hydrateGroupData(userId: string, email: string): Promise<AppData | null> {
  if (!supabase) return null
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user || user.id !== userId) return null
  const me = await ensureProfile(user)
  if (!me) return null
  const gid = me.grupoId
  const [
    grupoRes,
    profileRes,
    treinoRes,
    postRes,
    sugestaoRes,
    conquistaRes,
    msgRes,
    storyRes,
  ] = await Promise.all([
    supabase.from("grupos").select("*").eq("id", gid).maybeSingle(),
    supabase.from("profiles").select("*").eq("grupo_id", gid),
    supabase.from("treinos").select("*").eq("grupo_id", gid).order("data", { ascending: false }),
    supabase.from("publicacoes").select("*").eq("grupo_id", gid).order("created_at", { ascending: false }),
    supabase.from("sugestoes_treino").select("*").eq("grupo_id", gid),
    supabase.from("conquistas").select("*"),
    supabase.from("mensagens").select("*").or(`de_id.eq.${userId},para_id.eq.${userId}`),
    supabase.from("stories").select("*").eq("grupo_id", gid).gt("expires_at", new Date().toISOString()),
  ])

  const profiles = (profileRes.data ?? []).map((p) =>
    mapProfile(p, p.id === userId ? email : String(p.email ?? "")),
  )
  const treinos = (treinoRes.data ?? []).map((row) => mapTreino(row as Record<string, unknown>))
  const treinoIds = treinos.map((t) => t.id)
  const publicacoes: Publicacao[] = (postRes.data ?? []).map((row) => ({
    id: String(row.id),
    grupoId: String(row.grupo_id),
    usuarioId: String(row.usuario_id),
    texto: String(row.texto ?? ""),
    midiaUrl: (row.midia_url as string) || undefined,
    tipo: (row.tipo as Publicacao["tipo"]) || "texto",
    distanciaKm: row.distancia_km != null ? Number(row.distancia_km) : undefined,
    createdAt: String(row.created_at),
  }))
  const postIds = publicacoes.map((p) => p.id)
  const sugestoes: Sugestao[] = (sugestaoRes.data ?? []).map((row) => ({
    id: String(row.id),
    grupoId: String(row.grupo_id),
    titulo: String(row.titulo),
    descricao: String(row.descricao),
    nivel: (row.nivel as Nivel) || "iniciante",
    criadoPor: String(row.criado_por ?? ""),
    createdAt: String(row.created_at),
  }))
  const sugestaoIds = sugestoes.map((s) => s.id)
  const conquistas: Conquista[] = (conquistaRes.data ?? []).map((row) => ({
    id: String(row.id),
    codigo: String(row.codigo),
    titulo: String(row.titulo),
    descricao: String(row.descricao ?? ""),
    icone: String(row.icone ?? ""),
  }))
  const profileIds = profiles.map((p) => p.id)
  const storyRows = storyRes.data ?? []
  const storyIds = storyRows.map((s) => String(s.id))

  const [partRes, checkRes, likeRes, commentRes, reactRes, badgeRes, viewRes] = await Promise.all([
    treinoIds.length
      ? supabase.from("participacoes").select("*").in("treino_id", treinoIds)
      : Promise.resolve({ data: [] }),
    treinoIds.length
      ? supabase.from("checkins").select("*").in("treino_id", treinoIds)
      : Promise.resolve({ data: [] }),
    postIds.length
      ? supabase.from("curtidas").select("*").in("publicacao_id", postIds)
      : Promise.resolve({ data: [] }),
    postIds.length
      ? supabase.from("comentarios").select("*").in("publicacao_id", postIds)
      : Promise.resolve({ data: [] }),
    sugestaoIds.length
      ? supabase.from("reacoes_sugestao").select("*").in("sugestao_id", sugestaoIds)
      : Promise.resolve({ data: [] }),
    profileIds.length
      ? supabase.from("usuario_conquistas").select("*").in("usuario_id", profileIds)
      : Promise.resolve({ data: [] }),
    storyIds.length
      ? supabase.from("story_views").select("*").in("story_id", storyIds)
      : Promise.resolve({ data: [] }),
  ])

  const participacoes: Participacao[] = (partRes.data ?? []).map((row) => ({
    usuarioId: String(row.usuario_id),
    treinoId: String(row.treino_id),
    createdAt: String(row.created_at),
  }))
  const checkins: Checkin[] = (checkRes.data ?? []).map((row) => ({
    id: String(row.id),
    usuarioId: String(row.usuario_id),
    treinoId: String(row.treino_id),
    dataHora: String(row.data_hora),
    status: "presente",
    metodo: (row.metodo as Checkin["metodo"]) || "manual",
  }))
  const curtidas: Curtida[] = (likeRes.data ?? []).map((row) => ({
    usuarioId: String(row.usuario_id),
    publicacaoId: String(row.publicacao_id),
  }))
  const comentarios: Comentario[] = (commentRes.data ?? []).map((row) => ({
    id: String(row.id),
    usuarioId: String(row.usuario_id),
    publicacaoId: String(row.publicacao_id),
    texto: String(row.texto),
    createdAt: String(row.created_at),
  }))
  const reacoes: ReacaoSugestao[] = (reactRes.data ?? []).map((row) => ({
    usuarioId: String(row.usuario_id),
    sugestaoId: String(row.sugestao_id),
    tipo: row.tipo as ReacaoTipo,
  }))
  const usuarioConquistas: UsuarioConquista[] = (badgeRes.data ?? []).map((row) => ({
    usuarioId: String(row.usuario_id),
    conquistaId: String(row.conquista_id),
    unlockedAt: String(row.unlocked_at),
  }))
  const viewsByStory = new Map<string, string[]>()
  for (const row of viewRes.data ?? []) {
    const sid = String(row.story_id)
    const list = viewsByStory.get(sid) ?? []
    list.push(String(row.usuario_id))
    viewsByStory.set(sid, list)
  }
  const stories: Story[] = storyRows.map((row) => ({
    id: String(row.id),
    grupoId: String(row.grupo_id),
    usuarioId: String(row.usuario_id),
    midiaUrl: String(row.midia_url),
    texto: (row.texto as string) || undefined,
    createdAt: String(row.created_at),
    expiresAt: String(row.expires_at),
    viewedBy: viewsByStory.get(String(row.id)) ?? [],
  }))
  const mensagens: Mensagem[] = (msgRes.data ?? []).map((row) => ({
    id: String(row.id),
    deId: String(row.de_id),
    paraId: String(row.para_id),
    texto: String(row.texto),
    createdAt: String(row.created_at),
    lida: Boolean(row.lida),
  }))

  const grupo = grupoRes.data ? mapGrupo(grupoRes.data) : initialData.grupo
  return {
    grupo: {
      ...initialData.grupo,
      ...grupo,
      logoUrl: grupo.logoUrl || initialData.grupo.logoUrl,
      spotifyUrl: grupo.spotifyUrl || initialData.grupo.spotifyUrl,
    },
    profiles: profiles.length ? profiles : [me],
    treinos,
    participacoes,
    checkins,
    publicacoes,
    curtidas,
    comentarios,
    sugestoes: sugestoes.length ? sugestoes : initialData.sugestoes,
    reacoes,
    conquistas: conquistas.length ? conquistas : initialData.conquistas,
    usuarioConquistas,
    mensagens,
    stories,
    currentUserId: userId,
  }
}

export async function persistRsvp(usuarioId: string, treinoId: string, joining: boolean) {
  if (!supabase) return
  if (joining) {
    await supabase.from("participacoes").upsert({ usuario_id: usuarioId, treino_id: treinoId })
    return
  }
  await supabase.from("participacoes").delete().eq("usuario_id", usuarioId).eq("treino_id", treinoId)
}

function rpcMissing(message: string, code?: string) {
  const m = message.toLowerCase()
  return code === "PGRST202" || m.includes("could not find") || m.includes("schema cache")
}

export async function persistCheckin(input: {
  id: string
  usuarioId: string
  treinoId: string
  dataHora: string
  metodo: CheckinMetodo
}): Promise<{ error: string | null; id: string }> {
  if (!supabase) return { error: null, id: input.id }
  const rpc = await supabase.rpc("fazer_checkin", {
    p_treino_id: input.treinoId,
    p_metodo: input.metodo,
  })
  if (!rpc.error) {
    const payload = rpc.data as { id?: string } | string | null
    const id =
      typeof payload === "string"
        ? payload
        : payload && typeof payload === "object" && payload.id
          ? String(payload.id)
          : input.id
    return { error: null, id }
  }
  if (!rpcMissing(rpc.error.message, rpc.error.code)) {
    return { error: cloudErrorMessage(rpc.error.message), id: input.id }
  }
  const ins = await supabase.from("checkins").insert({
    id: input.id,
    usuario_id: input.usuarioId,
    treino_id: input.treinoId,
    data_hora: input.dataHora,
    status: "presente",
    metodo: input.metodo,
  })
  if (ins.error) return { error: cloudErrorMessage(ins.error.message), id: input.id }
  await supabase.from("participacoes").upsert({
    usuario_id: input.usuarioId,
    treino_id: input.treinoId,
  })
  return { error: null, id: input.id }
}

export async function persistCheckinByToken(token: string): Promise<{ error: string | null; treinoId?: string }> {
  if (!supabase) return { error: "QR Code inválido para este grupo." }
  const rpc = await supabase.rpc("fazer_checkin_por_token", { p_token: token.trim() })
  if (!rpc.error) {
    const payload = rpc.data as { treino_id?: string } | null
    return { error: null, treinoId: payload?.treino_id }
  }
  if (!rpcMissing(rpc.error.message, rpc.error.code)) {
    return { error: cloudErrorMessage(rpc.error.message) }
  }
  return { error: null }
}

export async function persistBadges(items: UsuarioConquista[]) {
  if (!supabase || items.length === 0) return
  await supabase.from("usuario_conquistas").upsert(
    items.map((b) => ({
      usuario_id: b.usuarioId,
      conquista_id: b.conquistaId,
      unlocked_at: b.unlockedAt,
    })),
  )
}

export async function persistTreino(treino: Treino) {
  if (!supabase) return
  await supabase.from("treinos").insert({
    id: treino.id,
    grupo_id: treino.grupoId,
    titulo: treino.titulo,
    tipo: treino.tipo,
    descricao: treino.descricao ?? null,
    data: treino.data,
    horario: asTime(treino.horario),
    local: treino.local,
    distancia_km: treino.distanciaKm,
    pace_sugerido: treino.paceSugerido ?? null,
    nivel: treino.nivel,
    observacoes: treino.observacoes ?? null,
    qr_token: treino.qrToken,
    criado_por: treino.criadoPor || null,
  })
}

export async function persistPost(post: Publicacao) {
  if (!supabase) return
  await supabase.from("publicacoes").insert({
    id: post.id,
    grupo_id: post.grupoId,
    usuario_id: post.usuarioId,
    texto: post.texto,
    midia_url: post.midiaUrl ?? null,
    tipo: post.tipo,
    distancia_km: post.distanciaKm ?? null,
    created_at: post.createdAt,
  })
}

export async function persistDeletePost(id: string) {
  if (!supabase) return
  await supabase.from("publicacoes").delete().eq("id", id)
}

export async function persistLike(usuarioId: string, publicacaoId: string, liked: boolean) {
  if (!supabase) return
  if (liked) {
    await supabase.from("curtidas").upsert({ usuario_id: usuarioId, publicacao_id: publicacaoId })
    return
  }
  await supabase.from("curtidas").delete().eq("usuario_id", usuarioId).eq("publicacao_id", publicacaoId)
}

export async function persistComment(comment: Comentario) {
  if (!supabase) return
  await supabase.from("comentarios").insert({
    id: comment.id,
    usuario_id: comment.usuarioId,
    publicacao_id: comment.publicacaoId,
    texto: comment.texto,
    created_at: comment.createdAt,
  })
}

export async function persistMessage(msg: Mensagem) {
  if (!supabase) return
  await supabase.from("mensagens").insert({
    id: msg.id,
    de_id: msg.deId,
    para_id: msg.paraId,
    texto: msg.texto,
    lida: msg.lida,
    created_at: msg.createdAt,
  })
}

export async function persistThreadRead(userId: string, otherId: string) {
  if (!supabase) return
  await supabase.from("mensagens").update({ lida: true }).eq("de_id", otherId).eq("para_id", userId)
}

export async function persistReacao(usuarioId: string, sugestaoId: string, tipo: ReacaoTipo) {
  if (!supabase) return
  await supabase.from("reacoes_sugestao").upsert({
    usuario_id: usuarioId,
    sugestao_id: sugestaoId,
    tipo,
  })
}

export async function persistStory(story: Story) {
  if (!supabase) return
  await supabase.from("stories").insert({
    id: story.id,
    grupo_id: story.grupoId,
    usuario_id: story.usuarioId,
    midia_url: story.midiaUrl,
    texto: story.texto ?? null,
    expires_at: story.expiresAt,
    created_at: story.createdAt,
  })
}

export async function persistStoryView(storyId: string, usuarioId: string) {
  if (!supabase) return
  await supabase.from("story_views").upsert({ story_id: storyId, usuario_id: usuarioId })
}

export async function persistDeleteStory(id: string) {
  if (!supabase) return
  await supabase.from("stories").delete().eq("id", id)
}

export async function persistDeleteAccount(userId: string) {
  if (!supabase) return
  await supabase.from("profiles").delete().eq("id", userId)
  await supabase.auth.signOut()
}

export function newEntityId() {
  return crypto.randomUUID()
}
