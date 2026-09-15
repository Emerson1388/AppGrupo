import { useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Camera, LogOut } from "lucide-react"
import { useApp, roleLabel } from "../context/AppContext"
import { formatDia, formatQuando, kmLabel } from "../lib/format"
import { supabaseEnabled } from "../lib/supabase"
import { assertMediaFile, uploadAvatar } from "../services/mediaService"

type Tab = "posts" | "historico" | "conquistas"

function resizePhoto(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Falha ao ler a foto"))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error("Imagem inválida"))
      img.onload = () => {
        const size = 512
        const canvas = document.createElement("canvas")
        const scale = Math.max(size / img.width, size / img.height)
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Não foi possível preparar a foto"))
          return
        }
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Não foi possível compactar a foto"))
              return
            }
            resolve(blob.type === "image/jpeg" ? blob : new Blob([blob], { type: "image/jpeg" }))
          },
          "image/jpeg",
          0.85,
        )
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Falha ao ler a foto"))
    reader.readAsDataURL(blob)
  })
}

export function Perfil() {
  const { id } = useParams()
  const { me, data, ranking, profileById, treinoById, updateMe, logout, deleteMyAccount } =
    useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>("posts")
  const [fotoErro, setFotoErro] = useState<string | null>(null)
  const [fotoBusy, setFotoBusy] = useState(false)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)

  const profile = id ? profileById(id) : me
  const mine = Boolean(profile && me && profile.id === me.id)

  const stats = ranking.find((r) => r.profile.id === profile?.id)
  const posts = data.publicacoes.filter((p) => p.usuarioId === profile?.id)
  const historico = data.checkins
    .filter((c) => c.usuarioId === profile?.id)
    .sort((a, b) => (a.dataHora < b.dataHora ? 1 : -1))
  const badges = useMemo(() => {
    const unlocked = new Set(
      data.usuarioConquistas
        .filter((u) => u.usuarioId === profile?.id)
        .map((u) => u.conquistaId),
    )
    return data.conquistas.map((c) => ({
      ...c,
      on: unlocked.has(c.id),
    }))
  }, [data.conquistas, data.usuarioConquistas, profile?.id])

  async function onFoto(file: File | undefined) {
    if (!file || !mine || fotoBusy) return
    setFotoErro(null)
    setFotoBusy(true)
    let preview: string | null = null
    try {
      assertMediaFile(file, "avatars")
      const blob = await resizePhoto(file)
      preview = URL.createObjectURL(blob)
      setFotoPreview(preview)
      if (supabaseEnabled) {
        const fotoUrl = await uploadAvatar(blob)
        const err = await updateMe({ fotoUrl })
        if (err) {
          setFotoErro(err)
          return
        }
      } else {
        const err = await updateMe({ fotoUrl: await blobToDataUrl(blob) })
        if (err) {
          setFotoErro(err)
          return
        }
      }
    } catch (caught) {
      setFotoErro(
        caught instanceof Error
          ? caught.message
          : "Não deu para usar essa imagem. Tente outra foto.",
      )
    } finally {
      if (preview) URL.revokeObjectURL(preview)
      setFotoPreview(null)
      setFotoBusy(false)
    }
  }

  if (!profile) return <p className="text-sm text-muted">Atleta não encontrado.</p>

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-line bg-card">
        <div className="h-28 bg-[linear-gradient(120deg,var(--ember)_0%,#0a5c12_45%,var(--bg)_100%)]" />
        <div className="px-5 pb-5">
          {mine ? (
            <label className="relative -mt-10 inline-block cursor-pointer">
              <img
                src={fotoPreview ?? profile.fotoUrl}
                alt=""
                className="h-20 w-20 rounded-full object-cover ring-4 ring-card"
              />
              <span className="absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full bg-ember text-on-accent ring-2 ring-card">
                <Camera size={14} />
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={fotoBusy}
                onChange={(e) => {
                  const chosen = e.target.files?.[0]
                  e.target.value = ""
                  void onFoto(chosen)
                }}
              />
            </label>
          ) : (
            <img
              src={profile.fotoUrl}
              alt=""
              className="-mt-10 h-20 w-20 rounded-full object-cover ring-4 ring-card"
            />
          )}
          {mine && (
            <p className="mt-2 text-xs font-semibold text-ember">
              {fotoBusy ? "Enviando foto…" : "Trocar foto"}
            </p>
          )}
          {fotoErro && <p className="mt-1 text-xs text-ember">{fotoErro}</p>}
          <h1 className="mt-3 font-display text-3xl font-extrabold">{profile.nome}</h1>
          <p className="text-sm text-muted">
            {roleLabel(profile.role)} · membro do {data.grupo.nome}
            {profile.meta ? ` · Meta: ${profile.meta}` : ""}
          </p>
          {profile.bio && <p className="mt-2 text-sm text-sand">{profile.bio}</p>}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Stat value={kmLabel(stats?.km ?? 0)} label="Este mês" />
            <Stat value={String(stats?.treinos ?? 0)} label="Treinos" />
            <Stat value={`${stats?.presenca ?? 0}%`} label="Presença" />
          </div>
          {!mine && (
            <Link
              to={`/mensagens/${profile.id}`}
              className="mt-4 inline-flex rounded-full bg-ember px-4 py-2 text-xs font-bold text-on-accent"
            >
              Mensagem privada
            </Link>
          )}
          {mine && (
            <p className="mt-4 text-xs text-muted">
              Pace {profile.paceMedio ?? "—"} · {profile.distanciaPreferida ?? "distância livre"} ·{" "}
              {profile.nivel}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ["posts", "Publicações"],
            ["historico", "Histórico"],
            ["conquistas", "Conquistas"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-xl py-2 text-xs font-bold ${
              tab === key ? "bg-card text-ink" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "posts" && (
        <div className="grid grid-cols-3 gap-1">
          {posts.length === 0 && (
            <p className="col-span-3 text-sm text-muted">Nenhuma publicação ainda.</p>
          )}
          {posts.map((p) =>
            p.midiaUrl ? (
              <img key={p.id} src={p.midiaUrl} alt="" className="aspect-square w-full object-cover" />
            ) : (
              <div key={p.id} className="aspect-square bg-card p-2 text-[11px] text-sand">
                {p.texto}
              </div>
            ),
          )}
        </div>
      )}

      {tab === "historico" && (
        <ul className="space-y-2">
          {historico.map((c) => {
            const t = treinoById(c.treinoId)
            if (!t) return null
            return (
              <li key={c.id}>
                <Link
                  to={`/agenda/${t.id}`}
                  className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-bold">{t.titulo}</p>
                    <p className="text-xs text-muted">
                      {formatDia(t.data)} · {formatQuando(c.dataHora)}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-lime">{kmLabel(t.distanciaKm)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {tab === "conquistas" && (
        <ul className="grid grid-cols-2 gap-2">
          {badges.map((b) => (
            <li
              key={b.id}
              className={`rounded-2xl border px-3 py-4 ${
                b.on ? "border-lime/40 bg-card" : "border-line bg-bg opacity-40"
              }`}
            >
              <p className="text-2xl">{b.icone}</p>
              <p className="mt-2 text-sm font-bold">{b.titulo}</p>
              <p className="text-[11px] text-muted">{b.descricao}</p>
            </li>
          ))}
        </ul>
      )}

      {mine && (
        <section className="space-y-2 rounded-3xl border border-line bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Conta e LGPD</p>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Sair da sua conta neste aparelho?")) {
                logout()
                navigate("/login")
              }
            }}
            className="flex w-full items-center gap-2 rounded-xl border border-line px-3 py-3 text-sm font-semibold"
          >
            <LogOut size={16} />
            Sair do aplicativo
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "Excluir sua conta e dados pessoais deste app? Essa ação não tem volta.",
                )
              ) {
                deleteMyAccount()
                navigate("/cadastro")
              }
            }}
            className="w-full rounded-xl px-3 py-3 text-left text-sm font-semibold text-ember"
          >
            Excluir conta
          </button>
          <p className="text-[11px] text-muted">
            <Link to="/privacidade" className="underline">
              Política de Privacidade
            </Link>
          </p>
        </section>
      )}
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-bg px-2 py-3">
      <p className="font-mono text-lg font-semibold text-lime">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  )
}
