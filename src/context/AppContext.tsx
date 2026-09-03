// RunClub demo store. Swap this layer for Supabase after Auth + schema.sql.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { initialData } from "../data/mock"
import { checkinAberto, treinoPassou, uid } from "../lib/format"
import {
  attachProfile,
  completePasswordReset,
  confirmAccount,
  createPendingAccount,
  deleteAccountByEmail,
  startPasswordReset,
  verifyLogin,
} from "../lib/accounts"
import { passwordIssues } from "../lib/password"
import { supabase, supabaseEnabled } from "../lib/supabase"
import type { User } from "@supabase/supabase-js"
import {
  authErrorMessage,
  hydrateFromSupabase,
  saveGrupoSpotify,
  saveProfilePatch,
} from "../lib/supabaseData"
import type {
  AppData,
  CheckinMetodo,
  Mensagem,
  Nivel,
  Profile,
  Publicacao,
  ReacaoTipo,
  Role,
  Story,
  Treino,
} from "../types"

const STORAGE_KEY = "runclub.v2"
const CLOUD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function cloudUserId(id: string | null | undefined) {
  if (supabaseEnabled) return id && CLOUD_ID.test(id) ? id : null
  return id ?? null
}

const SEED_TREINO_IDS = new Set(initialData.treinos.map((t) => t.id))

function mergeSeedTreinos(saved: Treino[] | undefined) {
  if (!saved?.length) return initialData.treinos
  if (saved.every((t) => SEED_TREINO_IDS.has(t.id))) return initialData.treinos
  return saved
}

type RankingRow = {
  profile: Profile
  km: number
  treinos: number
  rsvps: number
  presenca: number
}

type AppContextValue = {
  data: AppData
  me: Profile | null
  isStaff: boolean
  ranking: RankingRow[]
  login: (email: string, password: string) => Promise<string | null>
  logout: () => void
  signup: (input: {
    nome: string
    email: string
    password: string
    nivel: Nivel
    lgpdConsent: boolean
  }) => Promise<{ error: string | null; pendingEmail?: string; confirmToken?: string }>
  confirmEmail: (token: string) => string | null
  requestPasswordReset: (email: string) => Promise<{ token: string | null }>
  resetPassword: (token: string, password: string) => Promise<string | null>
  deleteMyAccount: () => void
  updateMe: (patch: Partial<Profile>) => void
  rsvp: (treinoId: string) => void
  checkin: (treinoId: string, metodo?: CheckinMetodo) => string | null
  checkinByToken: (token: string) => string | null
  createTreino: (input: Omit<Treino, "id" | "grupoId" | "qrToken" | "criadoPor">) => void
  createPost: (input: {
    texto: string
    midiaUrl?: string
    tipo: Publicacao["tipo"]
    distanciaKm?: number
  }) => void
  deletePost: (id: string) => void
  toggleLike: (publicacaoId: string) => void
  addComment: (publicacaoId: string, texto: string) => void
  sendMessage: (paraId: string, texto: string) => void
  markThreadRead: (otherId: string) => void
  unreadCount: number
  reactSugestao: (sugestaoId: string, tipo: ReacaoTipo) => void
  addStory: (input: { midiaUrl: string; texto?: string }) => void
  viewStory: (id: string) => void
  deleteStory: (id: string) => void
  profileById: (id: string) => Profile | undefined
  treinoById: (id: string) => Treino | undefined
  setSpotifyUrl: (url: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

function loadState(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialData
    const parsed = JSON.parse(raw) as Partial<AppData>
    if (!parsed.grupo || !Array.isArray(parsed.profiles)) return initialData
    return {
      ...initialData,
      ...parsed,
      grupo: {
        ...initialData.grupo,
        ...parsed.grupo,
        logoUrl: parsed.grupo.logoUrl || initialData.grupo.logoUrl,
        spotifyUrl:
          parsed.grupo.spotifyUrl && !parsed.grupo.spotifyUrl.includes("/search/")
            ? parsed.grupo.spotifyUrl
            : initialData.grupo.spotifyUrl,
      },
      profiles: parsed.profiles,
      treinos: mergeSeedTreinos(parsed.treinos),
      participacoes: parsed.participacoes ?? [],
      checkins: parsed.checkins ?? [],
      publicacoes: parsed.publicacoes ?? [],
      curtidas: parsed.curtidas ?? [],
      comentarios: parsed.comentarios ?? [],
      sugestoes: parsed.sugestoes ?? initialData.sugestoes,
      reacoes: parsed.reacoes ?? [],
      conquistas: parsed.conquistas ?? initialData.conquistas,
      usuarioConquistas: parsed.usuarioConquistas ?? [],
      mensagens: parsed.mensagens ?? [],
      stories: parsed.stories ?? [],
      currentUserId: cloudUserId(parsed.currentUserId),
    }
  } catch {
    return initialData
  }
}

function monthKey(iso: string) {
  return iso.slice(0, 7)
}

function unlockFor(data: AppData, usuarioId: string, now: string): AppData {
  const userCheckins = data.checkins.filter((c) => c.usuarioId === usuarioId)
  const km = userCheckins.reduce((acc, c) => {
    const t = data.treinos.find((x) => x.id === c.treinoId)
    return acc + (t?.distanciaKm ?? 0)
  }, 0)
  const codes: string[] = []
  if (userCheckins.length >= 1) codes.push("primeiro_treino")
  if (userCheckins.length >= 10) codes.push("10_treinos")
  if (km >= 50) codes.push("50_km")
  if (km >= 100) codes.push("100_km")
  const last = userCheckins.at(-1)
  if (last) {
    const hour = Number(last.dataHora.slice(11, 13))
    if (hour >= 18) codes.push("treino_noturno")
    if (hour < 8) codes.push("treino_manha")
  }
  const owned = new Set(
    data.usuarioConquistas.filter((x) => x.usuarioId === usuarioId).map((x) => x.conquistaId),
  )
  const extra = data.conquistas
    .filter((c) => codes.includes(c.codigo) && !owned.has(c.id))
    .map((c) => ({ usuarioId, conquistaId: c.id, unlockedAt: now }))
  if (extra.length === 0) return data
  return { ...data, usuarioConquistas: [...data.usuarioConquistas, ...extra] }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadState)
  const dataRef = useRef(data)
  dataRef.current = data

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    const client = supabase
    if (!supabaseEnabled || !client) return
    let cancel = false
    const applyUser = async (userId: string) => {
      const { data: sessionData } = await client.auth.getUser()
      const user = sessionData.user
      if (!user || user.id !== userId) return
      const next = await hydrateFromSupabase(user, dataRef.current)
      if (!cancel && next) setData(next)
    }
    void client.auth.getSession().then(({ data: sessionWrap }) => {
      const user = sessionWrap.session?.user
      if (user) void applyUser(user.id)
    })
    const { data: sub } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        setData((d) => ({ ...d, currentUserId: null }))
        return
      }
      void applyUser(session.user.id)
    })
    return () => {
      cancel = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const me = useMemo(
    () => data.profiles.find((p) => p.id === data.currentUserId) ?? null,
    [data.profiles, data.currentUserId],
  )

  const isStaff = me?.role === "admin" || me?.role === "treinador"

  const ranking = useMemo(() => {
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const treinosMes = data.treinos.filter((t) => t.data.startsWith(month))
    const passados = treinosMes.filter((t) => treinoPassou(t, now))

    return data.profiles
      .map((profile) => {
        const checkins = data.checkins.filter(
          (c) => c.usuarioId === profile.id && monthKey(c.dataHora) === month,
        )
        const km = checkins.reduce((acc, c) => {
          const t = data.treinos.find((x) => x.id === c.treinoId)
          return acc + (t?.distanciaKm ?? 0)
        }, 0)
        const rsvps = data.participacoes.filter((p) => {
          if (p.usuarioId !== profile.id) return false
          return passados.some((t) => t.id === p.treinoId)
        }).length
        const presentes = checkins.filter((c) => passados.some((t) => t.id === c.treinoId)).length
        const postKm = data.publicacoes
          .filter((p) => p.usuarioId === profile.id && monthKey(p.createdAt) === month)
          .reduce((acc, p) => acc + (p.distanciaKm ?? 0), 0)
        return {
          profile,
          km: km + postKm,
          treinos: checkins.length,
          rsvps,
          presenca: rsvps === 0 ? 0 : Math.round((presentes / rsvps) * 100),
        }
      })
      .sort((a, b) => b.km - a.km || b.treinos - a.treinos)
  }, [data])

  const login = useCallback(async (email: string, password: string) => {
    const mail = email.trim().toLowerCase()
    const pass = password.trim()
    const redirect = `${window.location.origin}/auth/callback`

    const finishCloud = async (user: User) => {
      const next = await hydrateFromSupabase(user, loadState())
      if (!next) return "Conta criada, mas o perfil não apareceu. Rode supabase/connect.sql no SQL Editor."
      setData(next)
      return null
    }

    if (supabaseEnabled && supabase) {
      const first = await supabase.auth.signInWithPassword({ email: mail, password: pass })
      if (!first.error && first.data.user) return finishCloud(first.data.user)

      const unconfirmed = first.error?.message.toLowerCase().includes("email not confirmed")
      if (unconfirmed) {
        await supabase.auth.resend({
          type: "signup",
          email: mail,
          options: { emailRedirectTo: redirect },
        })
        return authErrorMessage(first.error.message)
      }

      const local = await verifyLogin(mail, pass)
      if (!local.error) {
        await supabase.auth.signUp({
          email: mail,
          password: pass,
          options: {
            emailRedirectTo: redirect,
            data: { nome: local.account.nome, nivel: local.account.nivel },
          },
        })
        const again = await supabase.auth.signInWithPassword({ email: mail, password: pass })
        if (!again.error && again.data.user) return finishCloud(again.data.user)
        if (again.error?.message.toLowerCase().includes("email not confirmed")) {
          await supabase.auth.resend({
            type: "signup",
            email: mail,
            options: { emailRedirectTo: redirect },
          })
          return "Conta gravada na nuvem. Confirme o e-mail e entre de novo no celular com a mesma senha."
        }
      }

      if (first.error) return authErrorMessage(first.error.message)
    }
    const result = await verifyLogin(mail, pass)
    if (result.error) return result.error
    const profileId = result.account.profileId
    if (!profileId) return "Conta ainda não ativada. Confirme o e-mail."
    setData((d) => ({ ...d, currentUserId: profileId }))
    return null
  }, [])

  const logout = useCallback(() => {
    if (supabaseEnabled && supabase) void supabase.auth.signOut()
    setData((d) => ({ ...d, currentUserId: null }))
  }, [])

  const signup = useCallback(async (input: {
    nome: string
    email: string
    password: string
    nivel: Nivel
    lgpdConsent: boolean
  }) => {
    if (!input.lgpdConsent) {
      return { error: "É preciso aceitar a Política de Privacidade (LGPD) para criar a conta." }
    }
    const issues = passwordIssues(input.password)
    if (issues.length) return { error: `Senha fraca: ${issues.join(", ")}.` }
    if (
      !supabaseEnabled &&
      data.profiles.some((p) => p.email.toLowerCase() === input.email.trim().toLowerCase())
    ) {
      return { error: "Esse e-mail já está no grupo." }
    }
    if (supabaseEnabled && supabase) {
      const mail = input.email.trim().toLowerCase()
      const pass = input.password.trim()
      const redirect = `${window.location.origin}/auth/callback`
      const { data: created, error } = await supabase.auth.signUp({
        email: mail,
        password: pass,
        options: {
          emailRedirectTo: redirect,
          data: { nome: input.nome.trim(), nivel: input.nivel },
        },
      })
      if (error) return { error: authErrorMessage(error.message) }
      const sessionUser = created.session?.user
        ?? (
          await supabase.auth.signInWithPassword({ email: mail, password: pass })
        ).data.user
      if (sessionUser) {
        const next = await hydrateFromSupabase(sessionUser, loadState())
        if (!next) return { error: "Conta criada, mas o perfil não apareceu. Rode supabase/connect.sql no SQL Editor." }
        setData(next)
        return { error: null }
      }
      return {
        error: null,
        pendingEmail: mail,
      }
    }
    const created = await createPendingAccount(input)
    if (created.error) return { error: created.error }
    return {
      error: null,
      pendingEmail: created.email,
      confirmToken: created.confirmToken,
    }
  }, [data.profiles])

  const confirmEmail = useCallback((token: string) => {
    const result = confirmAccount(token)
    if (result.error) return result.error
    const account = result.account
    if (account.profileId) {
      setData((d) => ({ ...d, currentUserId: account.profileId }))
      return null
    }
    const id = uid("u")
    const profile: Profile = {
      id,
      grupoId: data.grupo.id,
      nome: account.nome,
      email: account.email,
      fotoUrl: `https://i.pravatar.cc/200?u=${encodeURIComponent(account.email)}`,
      nivel: account.nivel,
      role: data.profiles.length === 0 ? "admin" : "atleta",
      meta: "Começar e não parar",
    }
    const welcome: Publicacao = {
      id: uid("p"),
      grupoId: data.grupo.id,
      usuarioId: id,
      texto: `Acabei de entrar no ${data.grupo.nome}. Bora treinar 🏃`,
      tipo: "texto",
      createdAt: new Date().toISOString(),
    }
    attachProfile(account.email, id)
    setData((d) => ({
      ...d,
      profiles: [...d.profiles, profile],
      publicacoes: [welcome, ...d.publicacoes],
      currentUserId: id,
    }))
    return null
  }, [data.grupo.id, data.grupo.nome, data.profiles.length])

  const requestPasswordReset = useCallback(async (email: string) => {
    if (supabaseEnabled && supabase) {
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      })
    }
    const { token } = startPasswordReset(email)
    return { token }
  }, [])

  const resetPassword = useCallback(async (token: string, password: string) => {
    const issues = passwordIssues(password)
    if (issues.length) return `Senha fraca: ${issues.join(", ")}.`
    if (supabaseEnabled && supabase) {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) return authErrorMessage(error.message)
      return null
    }
    const result = await completePasswordReset(token, password)
    return result.error
  }, [])

  const deleteMyAccount = useCallback(() => {
    if (!me) return
    const id = me.id
    deleteAccountByEmail(me.email)
    if (supabaseEnabled && supabase) void supabase.auth.signOut()
    setData((d) => ({
      ...d,
      currentUserId: null,
      profiles: d.profiles.filter((p) => p.id !== id),
      publicacoes: d.publicacoes.filter((p) => p.usuarioId !== id),
      comentarios: d.comentarios.filter((c) => c.usuarioId !== id),
      curtidas: d.curtidas.filter((c) => c.usuarioId !== id),
      participacoes: d.participacoes.filter((p) => p.usuarioId !== id),
      checkins: d.checkins.filter((c) => c.usuarioId !== id),
      mensagens: d.mensagens.filter((m) => m.deId !== id && m.paraId !== id),
      stories: d.stories.filter((s) => s.usuarioId !== id),
      usuarioConquistas: d.usuarioConquistas.filter((u) => u.usuarioId !== id),
    }))
  }, [me])

  const updateMe = useCallback((patch: Partial<Profile>) => {
    setData((d) => ({
      ...d,
      profiles: d.profiles.map((p) => (p.id === d.currentUserId ? { ...p, ...patch } : p)),
    }))
    if (data.currentUserId && supabaseEnabled) void saveProfilePatch(data.currentUserId, patch)
  }, [data.currentUserId])

  const rsvp = useCallback((treinoId: string) => {
    setData((d) => {
      if (!d.currentUserId) return d
      const exists = d.participacoes.some(
        (p) => p.usuarioId === d.currentUserId && p.treinoId === treinoId,
      )
      if (exists) {
        return {
          ...d,
          participacoes: d.participacoes.filter(
            (p) => !(p.usuarioId === d.currentUserId && p.treinoId === treinoId),
          ),
        }
      }
      return {
        ...d,
        participacoes: [
          ...d.participacoes,
          {
            usuarioId: d.currentUserId,
            treinoId,
            createdAt: new Date().toISOString(),
          },
        ],
      }
    })
  }, [])

  const checkin = useCallback((treinoId: string, metodo: CheckinMetodo = "manual") => {
    const treino = data.treinos.find((t) => t.id === treinoId)
    if (!treino || !data.currentUserId) return "Treino não encontrado."
    if (data.checkins.some((c) => c.usuarioId === data.currentUserId && c.treinoId === treinoId)) {
      return "Presença já registrada neste treino."
    }
    if (!checkinAberto(treino)) {
      return "Check-in só abre 45 min antes e fecha 3h depois do treino."
    }
    const now = new Date().toISOString()
    setData((d) => {
      if (!d.currentUserId) return d
      const next: AppData = {
        ...d,
        checkins: [
          ...d.checkins,
          {
            id: uid("c"),
            usuarioId: d.currentUserId,
            treinoId,
            dataHora: now,
            status: "presente",
            metodo,
          },
        ],
        participacoes: d.participacoes.some(
          (p) => p.usuarioId === d.currentUserId && p.treinoId === treinoId,
        )
          ? d.participacoes
          : [
              ...d.participacoes,
              { usuarioId: d.currentUserId, treinoId, createdAt: now },
            ],
      }
      return unlockFor(next, d.currentUserId, now)
    })
    return null
  }, [data.checkins, data.currentUserId, data.treinos])

  const checkinByToken = useCallback((token: string) => {
    const treino = data.treinos.find((t) => t.qrToken === token.trim())
    if (!treino) return "QR Code inválido para este grupo."
    return checkin(treino.id, "qr")
  }, [checkin, data.treinos])

  const createTreino = useCallback((input: Omit<Treino, "id" | "grupoId" | "qrToken" | "criadoPor">) => {
    setData((d) => {
      if (!d.currentUserId) return d
      const treino: Treino = {
        ...input,
        id: uid("t"),
        grupoId: d.grupo.id,
        qrToken: uid("qr"),
        criadoPor: d.currentUserId,
      }
      const post: Publicacao = {
        id: uid("p"),
        grupoId: d.grupo.id,
        usuarioId: d.currentUserId,
        texto: `Treino na agenda: ${treino.titulo} · ${treino.data.split("-").reverse().join("/")} · ${treino.horario.slice(0, 5)} · ${treino.local}`,
        tipo: "texto",
        createdAt: new Date().toISOString(),
      }
      return { ...d, treinos: [treino, ...d.treinos], publicacoes: [post, ...d.publicacoes] }
    })
  }, [])

  const createPost = useCallback((input: {
    texto: string
    midiaUrl?: string
    tipo: Publicacao["tipo"]
    distanciaKm?: number
  }) => {
    setData((d) => {
      if (!d.currentUserId) return d
      const post: Publicacao = {
        id: uid("p"),
        grupoId: d.grupo.id,
        usuarioId: d.currentUserId,
        texto: input.texto,
        midiaUrl: input.midiaUrl,
        tipo: input.tipo,
        distanciaKm: input.distanciaKm,
        createdAt: new Date().toISOString(),
      }
      return { ...d, publicacoes: [post, ...d.publicacoes] }
    })
  }, [])

  const deletePost = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      publicacoes: d.publicacoes.filter((p) => p.id !== id),
      curtidas: d.curtidas.filter((c) => c.publicacaoId !== id),
      comentarios: d.comentarios.filter((c) => c.publicacaoId !== id),
    }))
  }, [])

  const toggleLike = useCallback((publicacaoId: string) => {
    setData((d) => {
      if (!d.currentUserId) return d
      const exists = d.curtidas.some(
        (c) => c.usuarioId === d.currentUserId && c.publicacaoId === publicacaoId,
      )
      return {
        ...d,
        curtidas: exists
          ? d.curtidas.filter(
              (c) => !(c.usuarioId === d.currentUserId && c.publicacaoId === publicacaoId),
            )
          : [...d.curtidas, { usuarioId: d.currentUserId, publicacaoId }],
      }
    })
  }, [])

  const addComment = useCallback((publicacaoId: string, texto: string) => {
    const trimmed = texto.trim()
    if (!trimmed) return
    setData((d) => {
      if (!d.currentUserId) return d
      return {
        ...d,
        comentarios: [
          ...d.comentarios,
          {
            id: uid("cm"),
            usuarioId: d.currentUserId,
            publicacaoId,
            texto: trimmed,
            createdAt: new Date().toISOString(),
          },
        ],
      }
    })
  }, [])

  const sendMessage = useCallback((paraId: string, texto: string) => {
    const trimmed = texto.trim()
    if (!trimmed) return
    setData((d) => {
      if (!d.currentUserId || d.currentUserId === paraId) return d
      const msg: Mensagem = {
        id: uid("m"),
        deId: d.currentUserId,
        paraId,
        texto: trimmed,
        createdAt: new Date().toISOString(),
        lida: false,
      }
      return { ...d, mensagens: [...d.mensagens, msg] }
    })
  }, [])

  const markThreadRead = useCallback((otherId: string) => {
    setData((d) => {
      if (!d.currentUserId) return d
      return {
        ...d,
        mensagens: d.mensagens.map((m) =>
          m.deId === otherId && m.paraId === d.currentUserId && !m.lida ? { ...m, lida: true } : m,
        ),
      }
    })
  }, [])

  const unreadCount = useMemo(() => {
    if (!data.currentUserId) return 0
    return data.mensagens.filter((m) => m.paraId === data.currentUserId && !m.lida).length
  }, [data.currentUserId, data.mensagens])

  const reactSugestao = useCallback((sugestaoId: string, tipo: ReacaoTipo) => {
    setData((d) => {
      if (!d.currentUserId) return d
      const rest = d.reacoes.filter(
        (r) => !(r.usuarioId === d.currentUserId && r.sugestaoId === sugestaoId),
      )
      return {
        ...d,
        reacoes: [...rest, { usuarioId: d.currentUserId, sugestaoId, tipo }],
      }
    })
  }, [])

  const addStory = useCallback((input: { midiaUrl: string; texto?: string }) => {
    const now = Date.now()
    setData((d) => {
      if (!d.currentUserId) return d
      const story: Story = {
        id: uid("st"),
        grupoId: d.grupo.id,
        usuarioId: d.currentUserId,
        midiaUrl: input.midiaUrl,
        texto: input.texto,
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + 24 * 3600 * 1000).toISOString(),
        viewedBy: [d.currentUserId],
      }
      return { ...d, stories: [story, ...d.stories] }
    })
  }, [])

  const viewStory = useCallback((id: string) => {
    setData((d) => {
      if (!d.currentUserId) return d
      return {
        ...d,
        stories: d.stories.map((s) =>
          s.id === id && !s.viewedBy.includes(d.currentUserId!)
            ? { ...s, viewedBy: [...s.viewedBy, d.currentUserId!] }
            : s,
        ),
      }
    })
  }, [])

  const deleteStory = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      stories: d.stories.filter((s) => !(s.id === id && s.usuarioId === d.currentUserId)),
    }))
  }, [])

  const profileById = useCallback(
    (id: string) => data.profiles.find((p) => p.id === id),
    [data.profiles],
  )

  const treinoById = useCallback(
    (id: string) => data.treinos.find((t) => t.id === id),
    [data.treinos],
  )

  const setSpotifyUrl = useCallback((url: string) => {
    setData((d) => ({
      ...d,
      grupo: { ...d.grupo, spotifyUrl: url || undefined },
    }))
    const gid = dataRef.current.grupo.id
    if (supabaseEnabled && gid && !gid.startsWith("g")) {
      void saveGrupoSpotify(gid, url)
    }
  }, [])

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      me,
      isStaff,
      ranking,
      login,
      logout,
      signup,
      confirmEmail,
      requestPasswordReset,
      resetPassword,
      deleteMyAccount,
      updateMe,
      rsvp,
      checkin,
      checkinByToken,
      createTreino,
      createPost,
      deletePost,
      toggleLike,
      addComment,
      sendMessage,
      markThreadRead,
      unreadCount,
      reactSugestao,
      addStory,
      viewStory,
      deleteStory,
      profileById,
      treinoById,
      setSpotifyUrl,
    }),
    [
      data,
      me,
      isStaff,
      ranking,
      login,
      logout,
      signup,
      confirmEmail,
      requestPasswordReset,
      resetPassword,
      deleteMyAccount,
      updateMe,
      rsvp,
      checkin,
      checkinByToken,
      createTreino,
      createPost,
      deletePost,
      toggleLike,
      addComment,
      sendMessage,
      markThreadRead,
      unreadCount,
      reactSugestao,
      addStory,
      viewStory,
      deleteStory,
      profileById,
      treinoById,
      setSpotifyUrl,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp fora do AppProvider")
  return ctx
}

export function roleLabel(role: Role) {
  if (role === "admin") return "Treinador · admin"
  if (role === "treinador") return "Treinador"
  return "Corredor"
}
