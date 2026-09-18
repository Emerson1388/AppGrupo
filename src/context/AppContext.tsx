// Estado do app: Supabase quando as env vars existem; senão, demo local.
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
import { checkinAberto, uid } from "../lib/format"
import { readInviteSlug } from "../lib/inviteSlug"
import { computeMonthlyRanking } from "../services/rankingService"
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
import { supabase, supabaseEnabled, localAuthAllowed, CLOUD_SETUP_ERROR } from "../lib/supabase"
import type { User } from "@supabase/supabase-js"
import {
  authErrorMessage,
  DEFAULT_AVATAR,
  embeddedFotoError,
  saveGrupoSpotify,
  saveProfilePatch,
} from "../lib/supabaseData"
import {
  hydrateGroupData,
  newEntityId,
  persistBadges,
  persistCheckin,
  persistCheckinByToken,
  persistComment,
  persistDeleteAccount,
  persistDeletePost,
  persistDeleteStory,
  persistLike,
  persistMessage,
  persistPost,
  persistReacao,
  persistRsvp,
  persistStory,
  persistStoryView,
  persistThreadRead,
  persistTreino,
} from "../lib/supabaseSync"
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

function emptyCloudState(): AppData {
  return {
    ...initialData,
    grupo: {
      id: "",
      nome: "",
      slug: "",
      plano: "gratuito",
      limiteAtletas: 0,
    },
    currentUserId: null,
    profiles: [],
    treinos: [],
    participacoes: [],
    checkins: [],
    publicacoes: [],
    curtidas: [],
    comentarios: [],
    sugestoes: [],
    reacoes: [],
    usuarioConquistas: [],
    mensagens: [],
    stories: [],
  }
}

function nextId() {
  return supabaseEnabled ? newEntityId() : uid("id")
}

type AppContextValue = {
  data: AppData
  me: Profile | null
  isStaff: boolean
  authReady: boolean
  cloudError: string | null
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
  updateMe: (patch: Partial<Profile>) => Promise<string | null>
  rsvp: (treinoId: string) => void
  checkin: (treinoId: string, metodo?: CheckinMetodo) => Promise<string | null>
  checkinByToken: (token: string) => Promise<string | null>
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
  if (supabaseEnabled || !localAuthAllowed()) return emptyCloudState()
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
  const [authReady, setAuthReady] = useState(!supabaseEnabled)
  const [cloudError, setCloudError] = useState<string | null>(null)
  const dataRef = useRef(data)
  dataRef.current = data

  useEffect(() => {
    if (supabaseEnabled || !localAuthAllowed()) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    const client = supabase
    if (!supabaseEnabled || !client) {
      setAuthReady(true)
      return
    }
    let cancel = false
    const applyUser = async (userId: string) => {
      const { data: sessionData } = await client.auth.getUser()
      const user = sessionData.user
      if (!user || user.id !== userId) return
      const next = await hydrateGroupData(user.id, user.email ?? "")
      if (cancel) return
      if (next) {
        setData(next)
        setCloudError(null)
      } else {
        setCloudError("Não foi possível carregar os dados do grupo. Tente de novo.")
      }
    }
    void client.auth.getSession().then(async ({ data: sessionWrap }) => {
      const user = sessionWrap.session?.user
      if (user) await applyUser(user.id)
      if (!cancel) setAuthReady(true)
    })
    const { data: sub } = client.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return
      if (event === "SIGNED_OUT" || !session?.user) {
        setData(emptyCloudState())
        return
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        void applyUser(session.user.id)
      }
    })
    const refresh = () => {
      if (document.visibilityState && document.visibilityState !== "visible") return
      void client.auth.getSession().then(({ data: sessionWrap }) => {
        const user = sessionWrap.session?.user
        if (user) void applyUser(user.id)
      })
    }
    document.addEventListener("visibilitychange", refresh)
    window.addEventListener("focus", refresh)
    return () => {
      cancel = true
      sub.subscription.unsubscribe()
      document.removeEventListener("visibilitychange", refresh)
      window.removeEventListener("focus", refresh)
    }
  }, [])

  const me = useMemo(
    () => data.profiles.find((p) => p.id === data.currentUserId) ?? null,
    [data.profiles, data.currentUserId],
  )

  const isStaff = me?.role === "admin" || me?.role === "treinador"

  const ranking = useMemo(() => computeMonthlyRanking(data), [data])

  const login = useCallback(async (email: string, password: string) => {
    const mail = email.trim().toLowerCase()
    const pass = password
    const redirect = `${window.location.origin}/auth/callback`

    const finishCloud = async (user: User) => {
      const next = await hydrateGroupData(user.id, user.email ?? "")
      if (!next) return "Conta criada, mas o perfil não apareceu. Rode supabase/connect.sql no SQL Editor."
      setData(next)
      return null
    }

    if (supabaseEnabled) {
      if (!supabase) return "Nuvem não configurada."
      const first = await supabase.auth.signInWithPassword({ email: mail, password: pass })
      const firstUser = first.data.user
      const firstErr = first.error
      const firstMsg = firstErr == null ? "" : firstErr.message
      if (!firstMsg && firstUser) return finishCloud(firstUser)

      const unconfirmed = firstMsg.toLowerCase().includes("email not confirmed")
      if (unconfirmed) {
        await supabase.auth.resend({
          type: "signup",
          email: mail,
          options: { emailRedirectTo: redirect },
        })
        return authErrorMessage(firstMsg)
      }

      return firstMsg ? authErrorMessage(firstMsg) : "Não foi possível entrar. Tente de novo."
    }
    if (!localAuthAllowed()) return CLOUD_SETUP_ERROR
    const result = await verifyLogin(mail, pass)
    if (result.error) return result.error
    const profileId = "account" in result ? result.account.profileId : null
    if (!profileId) return "Conta ainda não ativada. Confirme o e-mail."
    setData((d) => ({ ...d, currentUserId: profileId }))
    return null
  }, [])

  const logout = useCallback(() => {
    if (supabaseEnabled && supabase) void supabase.auth.signOut()
    setData(supabaseEnabled ? emptyCloudState() : (d) => ({ ...d, currentUserId: null }))
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
    if (supabaseEnabled) {
      if (!supabase) return { error: "Nuvem não configurada." }
      const mail = input.email.trim().toLowerCase()
      const pass = input.password
      const redirect = `${window.location.origin}/auth/callback`
      const { data: created, error } = await supabase.auth.signUp({
        email: mail,
        password: pass,
        options: {
          emailRedirectTo: redirect,
          data: {
            nome: input.nome.trim(),
            nivel: input.nivel,
            grupo_slug: readInviteSlug() ?? undefined,
          },
        },
      })
      if (error) return { error: authErrorMessage(error.message) }
      const sessionUser = created.session?.user
        ?? (
          await supabase.auth.signInWithPassword({ email: mail, password: pass })
        ).data.user
      if (sessionUser) {
        const next = await hydrateGroupData(sessionUser.id, sessionUser.email ?? "")
        if (!next) return { error: "Conta criada, mas o perfil não apareceu. Rode supabase/connect.sql no SQL Editor." }
        setData(next)
        return { error: null }
      }
      return {
        error: null,
        pendingEmail: mail,
      }
    }
    if (!localAuthAllowed()) return { error: CLOUD_SETUP_ERROR }
    const created = await createPendingAccount(input)
    if (created.error) return { error: created.error }
    return {
      error: null,
      pendingEmail: created.email,
      confirmToken: created.confirmToken,
    }
  }, [data.profiles])

  const confirmEmail = useCallback((token: string) => {
    if (!localAuthAllowed()) return CLOUD_SETUP_ERROR
    const result = confirmAccount(token)
    if (result.error) return result.error
    const account = result.account
    if (account.profileId) {
      setData((d) => ({ ...d, currentUserId: account.profileId }))
      return null
    }
    const id = nextId()
    const profile: Profile = {
      id,
      grupoId: data.grupo.id,
      nome: account.nome,
      email: account.email,
      fotoUrl: DEFAULT_AVATAR,
      nivel: account.nivel,
      role: data.profiles.length === 0 ? "admin" : "atleta",
      meta: "Começar e não parar",
    }
    const welcome: Publicacao = {
      id: nextId(),
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
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      })
      if (error) return { token: null }
      return { token: null }
    }
    if (!localAuthAllowed()) return { token: null }
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
    if (!localAuthAllowed()) return CLOUD_SETUP_ERROR
    const result = await completePasswordReset(token, password)
    return result.error
  }, [])

  const deleteMyAccount = useCallback(() => {
    if (!me) return
    const id = me.id
    deleteAccountByEmail(me.email)
    if (supabaseEnabled) void persistDeleteAccount()
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

  const updateMe = useCallback(async (patch: Partial<Profile>) => {
    const safe = { ...patch }
    delete safe.role
    delete safe.grupoId
    const fotoErro = embeddedFotoError(safe.fotoUrl)
    if (supabaseEnabled && fotoErro) {
      setCloudError(fotoErro)
      return fotoErro
    }
    const userId = dataRef.current.currentUserId
    if (userId && supabaseEnabled) {
      const res = await saveProfilePatch(userId, safe)
      if (res?.error) {
        setCloudError(res.error)
        return res.error
      }
      const { data: sessionData } = await supabase!.auth.getUser()
      const next = await hydrateGroupData(userId, sessionData.user?.email ?? "")
      if (next) {
        setData(next)
        return null
      }
    }
    setData((d) => ({
      ...d,
      profiles: d.profiles.map((p) => (p.id === d.currentUserId ? { ...p, ...safe } : p)),
    }))
    return null
  }, [])

  const rsvp = useCallback((treinoId: string) => {
    const userId = dataRef.current.currentUserId
    if (!userId) return
    const exists = dataRef.current.participacoes.some(
      (p) => p.usuarioId === userId && p.treinoId === treinoId,
    )
    void (async () => {
      if (supabaseEnabled) {
        const res = await persistRsvp(userId, treinoId, !exists)
        if (res?.error) {
          setCloudError(res.error)
          return
        }
      }
      setData((d) => {
        if (!d.currentUserId) return d
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
    })()
  }, [])

  const applyCheckin = useCallback((
    treinoId: string,
    metodo: CheckinMetodo,
    checkinId: string,
  ) => {
    const now = new Date().toISOString()
    const prev = dataRef.current
    if (!prev.currentUserId) return
    const next: AppData = {
      ...prev,
      checkins: [
        ...prev.checkins,
        {
          id: checkinId,
          usuarioId: prev.currentUserId,
          treinoId,
          dataHora: now,
          status: "presente",
          metodo,
        },
      ],
      participacoes: prev.participacoes.some(
        (p) => p.usuarioId === prev.currentUserId && p.treinoId === treinoId,
      )
        ? prev.participacoes
        : [
            ...prev.participacoes,
            { usuarioId: prev.currentUserId, treinoId, createdAt: now },
          ],
    }
    const unlocked = unlockFor(next, prev.currentUserId, now)
    setData(unlocked)
    if (supabaseEnabled) {
      const before = new Set(
        prev.usuarioConquistas
          .filter((x) => x.usuarioId === prev.currentUserId)
          .map((x) => x.conquistaId),
      )
      void persistBadges(
        unlocked.usuarioConquistas.filter(
          (x) => x.usuarioId === prev.currentUserId && !before.has(x.conquistaId),
        ),
      ).then((res) => {
        if (res?.error) setCloudError(res.error)
      })
    }
  }, [])

  const checkin = useCallback(async (treinoId: string, metodo: CheckinMetodo = "manual") => {
    const current = dataRef.current
    const treino = current.treinos.find((t) => t.id === treinoId)
    if (!treino || !current.currentUserId) return "Treino não encontrado."
    if (current.checkins.some((c) => c.usuarioId === current.currentUserId && c.treinoId === treinoId)) {
      return "Presença já registrada neste treino."
    }
    if (!checkinAberto(treino)) {
      return "Check-in só abre 45 min antes e fecha 3h depois do treino."
    }
    const id = nextId()
    if (supabaseEnabled) {
      const saved = await persistCheckin({
        id,
        usuarioId: current.currentUserId,
        treinoId,
        dataHora: new Date().toISOString(),
        metodo,
      })
      if (saved.error) return saved.error
      applyCheckin(treinoId, metodo, saved.id)
      return null
    }
    applyCheckin(treinoId, metodo, id)
    return null
  }, [applyCheckin])

  const checkinByToken = useCallback(async (token: string) => {
    const code = token.trim()
    if (supabaseEnabled) {
      const remote = await persistCheckinByToken(code)
      if (remote.error) return remote.error
      if (!remote.treinoId) return "QR Code inválido para este grupo."
      const already = dataRef.current.checkins.some(
        (c) => c.usuarioId === dataRef.current.currentUserId && c.treinoId === remote.treinoId,
      )
      if (!already) applyCheckin(remote.treinoId, "qr", nextId())
      return null
    }
    const treino = dataRef.current.treinos.find((t) => t.qrToken === code)
    if (!treino) return "QR Code inválido para este grupo."
    return checkin(treino.id, "qr")
  }, [applyCheckin, checkin])

  const createTreino = useCallback((input: Omit<Treino, "id" | "grupoId" | "qrToken" | "criadoPor">) => {
    const d = dataRef.current
    if (!d.currentUserId) return
    const autor = d.profiles.find((p) => p.id === d.currentUserId)
    if (autor?.role !== "admin" && autor?.role !== "treinador") return
    if (!input.titulo.trim() || !input.data || !input.horario || !input.local.trim()) return
    const treino: Treino = {
      ...input,
      id: nextId(),
      grupoId: d.grupo.id,
      qrToken: nextId(),
      criadoPor: d.currentUserId,
    }
    const post: Publicacao = {
      id: nextId(),
      grupoId: d.grupo.id,
      usuarioId: d.currentUserId,
      texto: `Treino na agenda: ${treino.titulo} · ${treino.data.split("-").reverse().join("/")} · ${treino.horario.slice(0, 5)} · ${treino.local}`,
      tipo: "texto",
      createdAt: new Date().toISOString(),
    }
    void (async () => {
      if (supabaseEnabled) {
        const treinoRes = await persistTreino(treino)
        if (treinoRes?.error) {
          setCloudError(treinoRes.error)
          return
        }
        const postRes = await persistPost(post)
        if (postRes?.error) {
          setCloudError(postRes.error)
          return
        }
      }
      setData((cur) => ({ ...cur, treinos: [treino, ...cur.treinos], publicacoes: [post, ...cur.publicacoes] }))
    })()
  }, [])

  const createPost = useCallback((input: {
    texto: string
    midiaUrl?: string
    tipo: Publicacao["tipo"]
    distanciaKm?: number
  }) => {
    const d = dataRef.current
    if (!d.currentUserId) return
    const texto = input.texto.trim()
    if (!texto && !input.midiaUrl) return
    if (texto.length > 4000) return
    const post: Publicacao = {
      id: nextId(),
      grupoId: d.grupo.id,
      usuarioId: d.currentUserId,
      texto,
      midiaUrl: input.midiaUrl,
      tipo: input.tipo,
      distanciaKm: input.distanciaKm,
      createdAt: new Date().toISOString(),
    }
    void (async () => {
      if (supabaseEnabled) {
        const res = await persistPost(post)
        if (res?.error) {
          setCloudError(res.error)
          return
        }
      }
      setData((cur) => ({ ...cur, publicacoes: [post, ...cur.publicacoes] }))
    })()
  }, [])

  const deletePost = useCallback((id: string) => {
    const d = dataRef.current
    const post = d.publicacoes.find((p) => p.id === id)
    if (!post || post.usuarioId !== d.currentUserId) return
    void (async () => {
      if (supabaseEnabled) {
        const res = await persistDeletePost(id)
        if (res?.error) {
          setCloudError(res.error)
          return
        }
      }
      setData((cur) => ({
        ...cur,
        publicacoes: cur.publicacoes.filter((p) => p.id !== id),
        curtidas: cur.curtidas.filter((c) => c.publicacaoId !== id),
        comentarios: cur.comentarios.filter((c) => c.publicacaoId !== id),
      }))
    })()
  }, [])

  const toggleLike = useCallback((publicacaoId: string) => {
    const userId = dataRef.current.currentUserId
    if (!userId) return
    const exists = dataRef.current.curtidas.some(
      (c) => c.usuarioId === userId && c.publicacaoId === publicacaoId,
    )
    void (async () => {
      if (supabaseEnabled) {
        const res = await persistLike(userId, publicacaoId, !exists)
        if (res?.error) {
          setCloudError(res.error)
          return
        }
      }
      setData((d) => {
        if (!d.currentUserId) return d
        return {
          ...d,
          curtidas: exists
            ? d.curtidas.filter(
                (c) => !(c.usuarioId === d.currentUserId && c.publicacaoId === publicacaoId),
              )
            : [...d.curtidas, { usuarioId: d.currentUserId, publicacaoId }],
        }
      })
    })()
  }, [])

  const addComment = useCallback((publicacaoId: string, texto: string) => {
    const trimmed = texto.trim()
    if (!trimmed || trimmed.length > 2000) return
    const d = dataRef.current
    if (!d.currentUserId) return
    const comment = {
      id: nextId(),
      usuarioId: d.currentUserId,
      publicacaoId,
      texto: trimmed,
      createdAt: new Date().toISOString(),
    }
    void (async () => {
      if (supabaseEnabled) {
        const res = await persistComment(comment)
        if (res?.error) {
          setCloudError(res.error)
          return
        }
      }
      setData((cur) => ({
        ...cur,
        comentarios: [...cur.comentarios, comment],
      }))
    })()
  }, [])

  const sendMessage = useCallback((paraId: string, texto: string) => {
    const trimmed = texto.trim()
    if (!trimmed || trimmed.length > 2000) return
    const d = dataRef.current
    if (!d.currentUserId || d.currentUserId === paraId) return
    const msg: Mensagem = {
      id: nextId(),
      deId: d.currentUserId,
      paraId,
      texto: trimmed,
      createdAt: new Date().toISOString(),
      lida: false,
    }
    void (async () => {
      if (supabaseEnabled) {
        const res = await persistMessage(msg)
        if (res?.error) {
          setCloudError(res.error)
          return
        }
      }
      setData((cur) => ({ ...cur, mensagens: [...cur.mensagens, msg] }))
    })()
  }, [])

  const markThreadRead = useCallback((otherId: string) => {
    const userId = dataRef.current.currentUserId
    if (!userId) return
    setData((d) => {
      if (!d.currentUserId) return d
      return {
        ...d,
        mensagens: d.mensagens.map((m) =>
          m.deId === otherId && m.paraId === d.currentUserId && !m.lida ? { ...m, lida: true } : m,
        ),
      }
    })
    if (supabaseEnabled) void persistThreadRead(userId, otherId)
  }, [])

  const unreadCount = useMemo(() => {
    if (!data.currentUserId) return 0
    return data.mensagens.filter((m) => m.paraId === data.currentUserId && !m.lida).length
  }, [data.currentUserId, data.mensagens])

  const reactSugestao = useCallback((sugestaoId: string, tipo: ReacaoTipo) => {
    const userId = dataRef.current.currentUserId
    if (!userId) return
    void (async () => {
      if (supabaseEnabled) {
        const res = await persistReacao(userId, sugestaoId, tipo)
        if (res?.error) {
          setCloudError(res.error)
          return
        }
      }
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
    })()
  }, [])

  const addStory = useCallback((input: { midiaUrl: string; texto?: string }) => {
    const d = dataRef.current
    if (!d.currentUserId || !input.midiaUrl) return
    const now = Date.now()
    const story: Story = {
      id: nextId(),
      grupoId: d.grupo.id,
      usuarioId: d.currentUserId,
      midiaUrl: input.midiaUrl,
      texto: input.texto,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 24 * 3600 * 1000).toISOString(),
      viewedBy: [d.currentUserId],
    }
    void (async () => {
      if (supabaseEnabled) {
        const res = await persistStory(story)
        if (res?.error) {
          setCloudError(res.error)
          return
        }
      }
      setData((cur) => ({ ...cur, stories: [story, ...cur.stories] }))
    })()
  }, [])

  const viewStory = useCallback((id: string) => {
    const userId = dataRef.current.currentUserId
    if (!userId) return
    const story = dataRef.current.stories.find((s) => s.id === id)
    if (!story || story.viewedBy.includes(userId)) return
    setData((d) => ({
      ...d,
      stories: d.stories.map((s) =>
        s.id === id ? { ...s, viewedBy: [...s.viewedBy, userId] } : s,
      ),
    }))
    if (supabaseEnabled) void persistStoryView(id, userId)
  }, [])

  const deleteStory = useCallback((id: string) => {
    const userId = dataRef.current.currentUserId
    const story = dataRef.current.stories.find((s) => s.id === id)
    if (!story || story.usuarioId !== userId) return
    void (async () => {
      if (supabaseEnabled) {
        const res = await persistDeleteStory(id)
        if (res?.error) {
          setCloudError(res.error)
          return
        }
      }
      setData((d) => ({
        ...d,
        stories: d.stories.filter((s) => s.id !== id),
      }))
    })()
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
    const gid = dataRef.current.grupo.id
    void (async () => {
      if (supabaseEnabled && gid && !gid.startsWith("g")) {
        const res = await saveGrupoSpotify(gid, url)
        if (res?.error) {
          setCloudError(res.error)
          return
        }
      }
      setData((d) => ({
        ...d,
        grupo: { ...d.grupo, spotifyUrl: url || undefined },
      }))
    })()
  }, [])

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      me,
      isStaff,
      authReady,
      cloudError,
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
      authReady,
      cloudError,
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
