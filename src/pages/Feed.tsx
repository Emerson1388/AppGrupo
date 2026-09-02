import { useMemo, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { Heart, MessageCircle, Trash2, ImagePlus, Pencil } from "lucide-react"
import { useApp } from "../context/AppContext"
import { formatQuando } from "../lib/format"
import { StoriesBar } from "../components/StoriesBar"
import { SpotifyLink } from "../components/SpotifyLink"
import { PhotoEditor } from "../components/PhotoEditor"
import type { Checkin, Publicacao } from "../types"

type Item =
  | { kind: "post"; at: string; post: Publicacao }
  | { kind: "checkin"; at: string; checkin: Checkin }

export function Feed() {
  const { data, me, createPost, toggleLike, addComment, deletePost, profileById, treinoById } =
    useApp()
  const [texto, setTexto] = useState("")
  const [km, setKm] = useState("")
  const [midiaUrl, setMidiaUrl] = useState<string>()
  const [editSrc, setEditSrc] = useState<string>()
  const [openComments, setOpenComments] = useState<string | null>(null)
  const [draft, setDraft] = useState("")

  const items = useMemo<Item[]>(() => {
    const posts: Item[] = data.publicacoes.map((post) => ({
      kind: "post",
      at: post.createdAt,
      post,
    }))
    const checkins: Item[] = data.checkins.map((checkin) => ({
      kind: "checkin",
      at: checkin.dataHora,
      checkin,
    }))
    return [...posts, ...checkins].sort((a, b) => (a.at < b.at ? 1 : -1))
  }, [data.publicacoes, data.checkins])

  function onPublish(e: FormEvent) {
    e.preventDefault()
    if (!texto.trim() && !midiaUrl && !km) return
    createPost({
      texto: texto.trim() || (km ? `Treino de ${km} km.` : "Treino no feed."),
      midiaUrl,
      tipo: midiaUrl ? "foto" : "texto",
      distanciaKm: km ? Number(km) : undefined,
    })
    setTexto("")
    setKm("")
    setMidiaUrl(undefined)
    setEditSrc(undefined)
  }

  function onFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = String(reader.result)
      setEditSrc(src)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Feed do grupo</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Quem apareceu hoje
          </h1>
        </div>
        <Link to="/membros" className="text-xs font-bold text-lime">
          Membros
        </Link>
      </div>

      <StoriesBar />

      <SpotifyLink />

      <form onSubmit={onPublish} className="rounded-3xl border border-line bg-card p-4">
        <div className="flex gap-3">
          <img src={me?.fotoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Como foi o treino? O grupo vê aqui. Mensagem privada fica no Chat."
            rows={2}
            className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
        {midiaUrl && (
          <div className="relative mt-3">
            <img src={midiaUrl} alt="" className="max-h-48 w-full rounded-2xl object-cover" />
            <div className="absolute right-2 bottom-2 flex gap-2">
              <button
                type="button"
                onClick={() => setEditSrc(midiaUrl)}
                className="inline-flex items-center gap-1 rounded-full bg-bg/90 px-3 py-1.5 text-[11px] font-bold"
              >
                <Pencil size={12} />
                Ajeitar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMidiaUrl(undefined)
                  setEditSrc(undefined)
                }}
                className="rounded-full bg-bg/90 px-3 py-1.5 text-[11px] font-bold text-ember"
              >
                Tirar
              </button>
            </div>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted">
            <ImagePlus size={16} />
            Foto
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                onFile(e.target.files?.[0])
                e.target.value = ""
              }}
            />
          </label>
          <input
            value={km}
            onChange={(e) => setKm(e.target.value)}
            inputMode="decimal"
            placeholder="km"
            className="w-20 rounded-full border border-line bg-bg px-3 py-1.5 text-xs outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-ember px-4 py-1.5 text-xs font-bold text-on-accent"
          >
            Publicar treino
          </button>
        </div>
      </form>

      {editSrc && (
        <PhotoEditor
          src={editSrc}
          onCancel={() => setEditSrc(undefined)}
          onDone={(dataUrl) => {
            setMidiaUrl(dataUrl)
            setEditSrc(undefined)
          }}
        />
      )}

      {items.map((item) => {
        if (item.kind === "checkin") {
          const who = profileById(item.checkin.usuarioId)
          const treino = treinoById(item.checkin.treinoId)
          if (!who || !treino) return null
          return (
            <div
              key={item.checkin.id}
              className="flex gap-3 rounded-3xl border border-line bg-card px-4 py-4"
            >
              <img src={who.fotoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div>
                <p className="text-sm">
                  <Link to={`/perfil/${who.id}`} className="font-bold">
                    {who.nome}
                  </Link>{" "}
                  fez check-in no{" "}
                  <Link to={`/agenda/${treino.id}`} className="font-semibold text-lime">
                    {treino.titulo}
                  </Link>
                </p>
                <p className="mt-1 text-xs text-muted">
                  {treino.local} · {formatQuando(item.checkin.dataHora)} · {item.checkin.metodo === "qr" ? "QR" : "manual"}
                </p>
              </div>
            </div>
          )
        }

        const post = item.post
        const who = profileById(post.usuarioId)
        if (!who) return null
        const likes = data.curtidas.filter((c) => c.publicacaoId === post.id)
        const comments = data.comentarios.filter((c) => c.publicacaoId === post.id)
        const liked = likes.some((c) => c.usuarioId === me?.id)

        return (
          <article key={post.id} className="overflow-hidden rounded-3xl border border-line bg-card">
            <div className="flex items-center justify-between px-4 py-3">
              <Link to={`/perfil/${who.id}`} className="flex items-center gap-3">
                <img src={who.fotoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-bold">{who.nome}</p>
                  <p className="text-[11px] text-muted">{formatQuando(post.createdAt)}</p>
                </div>
              </Link>
              {me?.id === post.usuarioId && (
                <button
                  type="button"
                  onClick={() => deletePost(post.id)}
                  className="text-muted hover:text-ember"
                  aria-label="Excluir publicação"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            {post.midiaUrl && (
              <img src={post.midiaUrl} alt="" className="max-h-[420px] w-full object-cover" />
            )}
            <div className="px-4 py-3">
              <p className="text-sm leading-relaxed">{post.texto}</p>
              {post.distanciaKm ? (
                <p className="mt-2 font-mono text-xs text-lime">{post.distanciaKm} km</p>
              ) : null}
              <div className="mt-3 flex items-center gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => toggleLike(post.id)}
                  className={`inline-flex items-center gap-1.5 font-semibold ${liked ? "text-ember" : "text-muted"}`}
                >
                  <Heart size={18} fill={liked ? "currentColor" : "none"} />
                  {likes.length}
                </button>
                <button
                  type="button"
                  onClick={() => setOpenComments(openComments === post.id ? null : post.id)}
                  className="inline-flex items-center gap-1.5 font-semibold text-muted"
                >
                  <MessageCircle size={18} />
                  {comments.length}
                </button>
                {me?.id !== who.id && (
                  <Link
                    to={`/mensagens/${who.id}`}
                    className="ml-auto text-xs font-semibold text-lime"
                  >
                    Msg privada
                  </Link>
                )}
              </div>
              {openComments === post.id && (
                <div className="mt-3 space-y-2 border-t border-line pt-3">
                  {comments.map((c) => {
                    const author = profileById(c.usuarioId)
                    return (
                      <p key={c.id} className="text-sm">
                        <span className="font-bold">{author?.nome}</span>{" "}
                        <span className="text-sand">{c.texto}</span>
                      </p>
                    )
                  })}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      addComment(post.id, draft)
                      setDraft("")
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Comentar…"
                      className="flex-1 rounded-full border border-line bg-bg px-3 py-2 text-sm outline-none"
                    />
                    <button type="submit" className="text-xs font-bold text-lime">
                      Enviar
                    </button>
                  </form>
                </div>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
