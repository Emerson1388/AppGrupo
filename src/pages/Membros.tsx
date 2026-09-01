import { Link } from "react-router-dom"
import { MessageCircle } from "lucide-react"
import { useApp, roleLabel } from "../context/AppContext"

export function Membros() {
  const { data, me } = useApp()
  const membros = [...data.profiles].sort((a, b) => {
    if (a.role === "admin") return -1
    if (b.role === "admin") return 1
    return a.nome.localeCompare(b.nome)
  })

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          {data.grupo.nome}
        </p>
        <h1 className="font-display text-3xl font-extrabold">Membros</h1>
        <p className="mt-1 text-sm text-muted">{membros.length} atletas no grupo</p>
      </div>
      <ul className="space-y-2">
        {membros.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-line bg-card px-3 py-3">
            <Link to={`/perfil/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <img src={p.fotoUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {p.nome}
                  {p.id === me?.id ? " · você" : ""}
                </p>
                <p className="text-xs text-muted">{roleLabel(p.role)} · membro</p>
              </div>
            </Link>
            {p.id !== me?.id && (
              <Link
                to={`/mensagens/${p.id}`}
                className="rounded-full border border-line p-2 text-muted hover:text-ember"
                aria-label={`Mensagem para ${p.nome}`}
              >
                <MessageCircle size={16} />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
