import { Link } from "react-router-dom"
import { CalendarDays, Clock, MapPin, Users } from "lucide-react"
import { useApp } from "../context/AppContext"
import { formatDia, formatHora, kmLabel, nivelLabel, treinoPassou } from "../lib/format"

export function Agenda() {
  const { data, isStaff } = useApp()
  const ordered = [...data.treinos].sort((a, b) =>
    `${a.data}${a.horario}` < `${b.data}${b.horario}` ? 1 : -1,
  )

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Agenda</p>
          <h1 className="font-display text-3xl font-extrabold">Próximos treinos</h1>
        </div>
        <div className="flex flex-col items-end gap-2 text-xs font-bold">
          <Link to="/corridas" className="text-lime">
            Provas
          </Link>
          <Link to="/sugestoes" className="text-lime">
            Sugestões
          </Link>
          {isStaff && (
            <Link to="/novo-treino" className="text-ember md:hidden">
              Novo treino
            </Link>
          )}
        </div>
      </div>

      <Link
        to="/corridas"
        className="flex items-center justify-between rounded-3xl border border-line bg-card p-4"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ember">Calendário</p>
          <p className="mt-1 font-display text-xl font-bold">Provas de rua</p>
          <p className="mt-1 text-xs text-muted">Corridas no RS, no Brasil e no mundo</p>
        </div>
        <CalendarDays size={22} className="text-lime" />
      </Link>

      {ordered.map((treino) => {
        const rsvps = data.participacoes.filter((p) => p.treinoId === treino.id).length
        const past = treinoPassou(treino)
        return (
          <Link
            key={treino.id}
            to={`/agenda/${treino.id}`}
            className="block rounded-3xl border border-line bg-card p-5 transition hover:border-sand/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ember">
                  {treino.tipo}
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold">{treino.titulo}</h2>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  past ? "bg-card-2 text-muted" : "bg-lime/15 text-lime"
                }`}
              >
                {past ? "Encerrado" : "Aberto"}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-sand">
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={14} /> {formatDia(treino.data)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock size={14} /> {formatHora(treino.horario)}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin size={14} /> {treino.local}
              </span>
              <span className="inline-flex items-center gap-2">
                <Users size={14} /> {rsvps} confirmados
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="font-mono text-lime">{kmLabel(treino.distanciaKm)}</span>
              <span className="text-muted">
                Pace {treino.paceSugerido ?? "—"} · {nivelLabel(treino.nivel)}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
