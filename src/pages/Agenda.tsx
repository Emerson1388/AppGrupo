import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarDays, Clock, ExternalLink, MapPin, Users } from "lucide-react"
import { useApp } from "../context/AppContext"
import { buscarCorridas, type CorridaEvento } from "../lib/corridas"
import { formatDia, formatHora, kmLabel, nivelLabel, treinoPassou } from "../lib/format"
import type { AppData, Treino } from "../types"

function hojeIso() {
  return new Date().toISOString().slice(0, 10)
}

export function Agenda() {
  const { data, isStaff } = useApp()
  const [provas, setProvas] = useState<CorridaEvento[]>([])
  const hoje = hojeIso()

  useEffect(() => {
    let cancel = false
    void buscarCorridas({ start: hoje, end: "2026-12-31" }).then((res) => {
      if (!cancel) setProvas(res.eventos)
    })
    return () => {
      cancel = true
    }
  }, [hoje])

  const upcoming = useMemo(
    () =>
      [...data.treinos]
        .filter((t) => !treinoPassou(t))
        .sort((a, b) => `${a.data}${a.horario}`.localeCompare(`${b.data}${b.horario}`)),
    [data.treinos],
  )
  const past = useMemo(
    () =>
      [...data.treinos]
        .filter((t) => treinoPassou(t))
        .sort((a, b) => (`${a.data}${a.horario}` < `${b.data}${b.horario}` ? 1 : -1)),
    [data.treinos],
  )

  const proximasProvas = useMemo(() => {
    const locais = provas.filter(
      (e) =>
        e.data >= hoje &&
        (e.fonte === "fallback" ||
          e.fonte === "corridasderuars" ||
          /porto alegre|\bRS\b/i.test(`${e.cidade} ${e.estado} ${e.local ?? ""}`)),
    )
    const lista = locais.length > 0 ? locais : provas.filter((e) => e.data >= hoje)
    return lista.slice(0, 10)
  }, [provas, hoje])

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

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ember">Corridas</p>
            <h2 className="font-display text-xl font-bold">Próximas provas</h2>
          </div>
          <Link to="/corridas" className="text-xs font-bold text-lime">
            Ver calendário
          </Link>
        </div>
        {proximasProvas.length === 0 ? (
          <p className="text-sm text-muted">Carregando provas…</p>
        ) : (
          proximasProvas.map((prova) => <ProvaCard key={prova.id} prova={prova} />)
        )}
      </section>

      {upcoming.map((treino) => (
        <TreinoCard key={treino.id} treino={treino} data={data} />
      ))}

      {past.length > 0 && (
        <p className="pt-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Encerrados
        </p>
      )}
      {past.map((treino) => (
        <TreinoCard key={treino.id} treino={treino} data={data} past />
      ))}
    </div>
  )
}

function ProvaCard({ prova }: { prova: CorridaEvento }) {
  return (
    <a
      href={prova.inscricaoUrl || prova.url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-3xl border border-line bg-card p-5 transition hover:border-sand/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ember">Prova de rua</p>
          <h2 className="mt-1 font-display text-2xl font-bold">{prova.titulo}</h2>
        </div>
        <ExternalLink size={16} className="mt-1 shrink-0 text-muted" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-sand">
        <span className="inline-flex items-center gap-2">
          <CalendarDays size={14} /> {formatDia(prova.data)}
        </span>
        {prova.horario && (
          <span className="inline-flex items-center gap-2">
            <Clock size={14} /> {formatHora(prova.horario)}
          </span>
        )}
        <span className="col-span-2 inline-flex items-center gap-2">
          <MapPin size={14} /> {prova.local || `${prova.cidade}${prova.estado ? `/${prova.estado}` : ""}`}
        </span>
      </div>
      {prova.distancias.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {prova.distancias.map((d) => (
            <span key={d} className="rounded-full bg-card-2 px-2 py-0.5 text-[10px] font-bold text-lime">
              {d}
            </span>
          ))}
        </div>
      )}
    </a>
  )
}

function TreinoCard({
  treino,
  data,
  past = false,
}: {
  treino: Treino
  data: Pick<AppData, "participacoes">
  past?: boolean
}) {
  const rsvps = data.participacoes.filter((p) => p.treinoId === treino.id).length
  return (
    <Link
      to={`/agenda/${treino.id}`}
      className="block rounded-3xl border border-line bg-card p-5 transition hover:border-sand/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ember">{treino.tipo}</p>
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
}
