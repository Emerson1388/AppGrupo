import { useState } from "react"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useApp } from "../context/AppContext"

type Tab = "km" | "presenca" | "treinos"

export function Ranking() {
  const { ranking } = useApp()
  const [tab, setTab] = useState<Tab>("km")

  const sorted = [...ranking].sort((a, b) => {
    if (tab === "km") return b.km - a.km
    if (tab === "presenca") return b.presenca - a.presenca || b.treinos - a.treinos
    return b.treinos - a.treinos
  })

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          {format(new Date(), "MMMM", { locale: ptBR })} · mensal
        </p>
        <h1 className="font-display text-3xl font-extrabold">Ranking do clube</h1>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-line bg-card p-1">
        {(
          [
            ["km", "Quilometragem"],
            ["presenca", "Presença"],
            ["treinos", "Treinos"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-xl py-2 text-xs font-bold ${
              tab === id ? "bg-ember text-on-accent" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ol className="space-y-2">
        {sorted.map((row, i) => (
          <li key={row.profile.id}>
            <Link
              to={`/perfil/${row.profile.id}`}
              className="flex items-center gap-3 rounded-2xl border border-line bg-card px-3 py-3"
            >
              <span className="w-6 font-mono text-sm text-muted">{i + 1}</span>
              <img src={row.profile.fotoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{row.profile.nome}</p>
                <p className="text-[11px] text-muted">
                  {row.treinos} treinos · {row.presenca}% presença
                </p>
              </div>
              <span className="font-mono text-sm font-semibold text-lime">
                {tab === "km" && `${row.km} km`}
                {tab === "presenca" && `${row.presenca}%`}
                {tab === "treinos" && row.treinos}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
