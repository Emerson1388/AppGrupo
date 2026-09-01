import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { Send } from "lucide-react"
import { useApp } from "../context/AppContext"
import { formatQuando } from "../lib/format"

export function Conversa() {
  const { id } = useParams()
  const { me, profileById, data, sendMessage, markThreadRead } = useApp()
  const [texto, setTexto] = useState("")
  const endRef = useRef<HTMLDivElement>(null)
  const other = id ? profileById(id) : undefined

  const msgs = useMemo(() => {
    if (!me || !other) return []
    return data.mensagens
      .filter(
        (m) =>
          (m.deId === me.id && m.paraId === other.id) ||
          (m.deId === other.id && m.paraId === me.id),
      )
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
  }, [data.mensagens, me, other])

  useEffect(() => {
    if (other) markThreadRead(other.id)
  }, [other, markThreadRead, msgs.length])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [msgs.length])

  if (!other || !me) return <Navigate to="/mensagens" replace />
  if (other.id === me.id) return <Navigate to="/mensagens" replace />

  function onSend(e: FormEvent) {
    e.preventDefault()
    if (!other) return
    sendMessage(other.id, texto)
    setTexto("")
  }

  return (
    <div className="flex min-h-[70svh] flex-col">
      <Link to={`/perfil/${other.id}`} className="mb-4 flex items-center gap-3">
        <img src={other.fotoUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
        <div>
          <p className="text-sm font-bold">{other.nome}</p>
          <p className="text-xs text-muted">Membro · {data.grupo.nome}</p>
        </div>
      </Link>

      <div className="flex-1 space-y-2">
        {msgs.length === 0 && (
          <p className="rounded-2xl border border-line bg-card px-4 py-6 text-center text-sm text-muted">
            Primeira mensagem privada. O resto do grupo não vê.
          </p>
        )}
        {msgs.map((m) => {
          const mine = m.deId === me.id
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? "bg-ember text-on-accent" : "bg-card border border-line"
                }`}
              >
                <p>{m.texto}</p>
                <p className={`mt-1 text-[10px] ${mine ? "opacity-70" : "text-muted"}`}>
                  {formatQuando(m.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSend} className="sticky bottom-20 mt-4 flex gap-2 md:bottom-4">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={`Mensagem para ${other.nome.split(" ")[0]}…`}
          className="flex-1 rounded-full border border-line bg-card px-4 py-3 text-sm outline-none focus:border-ember"
        />
        <button
          type="submit"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-ember text-on-accent"
          aria-label="Enviar"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
