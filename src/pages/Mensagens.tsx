import { useMemo } from "react"
import { Link } from "react-router-dom"
import { useApp, roleLabel } from "../context/AppContext"
import { formatQuando } from "../lib/format"

export function Mensagens() {
  const { data, me, unreadCount } = useApp()

  const threads = useMemo(() => {
    if (!me) return []
    const others = data.profiles.filter((p) => p.id !== me.id)
    return others
      .map((profile) => {
        const msgs = data.mensagens
          .filter(
            (m) =>
              (m.deId === me.id && m.paraId === profile.id) ||
              (m.deId === profile.id && m.paraId === me.id),
          )
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        const last = msgs[0]
        const unread = msgs.filter((m) => m.paraId === me.id && !m.lida).length
        return { profile, last, unread }
      })
      .sort((a, b) => {
        if (!a.last && !b.last) return a.profile.nome.localeCompare(b.profile.nome)
        if (!a.last) return 1
        if (!b.last) return -1
        return a.last.createdAt < b.last.createdAt ? 1 : -1
      })
  }, [data.mensagens, data.profiles, me])

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Privado · {unreadCount} não lida{unreadCount === 1 ? "" : "s"}
        </p>
        <h1 className="font-display text-3xl font-extrabold">Mensagens</h1>
        <p className="mt-1 text-sm text-muted">
          Conversa só entre você e outro membro do {data.grupo.nome}.
        </p>
      </div>

      <ul className="space-y-2">
        {threads.map(({ profile, last, unread }) => (
          <li key={profile.id}>
            <Link
              to={`/mensagens/${profile.id}`}
              className="flex items-center gap-3 rounded-2xl border border-line bg-card px-3 py-3"
            >
              <img src={profile.fotoUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{profile.nome}</p>
                <p className="truncate text-xs text-muted">
                  {last ? last.texto : roleLabel(profile.role)}
                </p>
              </div>
              <div className="text-right">
                {last && <p className="text-[10px] text-muted">{formatQuando(last.createdAt)}</p>}
                {unread > 0 && (
                  <span className="mt-1 inline-flex min-w-5 justify-center rounded-full bg-ember px-1.5 text-[10px] font-bold text-on-accent">
                    {unread}
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
