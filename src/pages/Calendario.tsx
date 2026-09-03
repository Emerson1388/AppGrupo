import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, MapPin } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useApp } from "../context/AppContext"
import {
  buscarCorridas,
  eventoNaRegiao,
  type CorridaEvento,
  type FiltroRegiao,
  type FonteStatus,
} from "../lib/corridas"
import { formatDia, formatHora } from "../lib/format"

const regioes: { id: FiltroRegiao; label: string }[] = [
  { id: "poa", label: "Porto Alegre" },
  { id: "rs", label: "Rio Grande do Sul" },
  { id: "brasil", label: "Brasil" },
  { id: "mundo", label: "Mundo" },
  { id: "todas", label: "Todas" },
]

const fonteNome: Record<string, string> = {
  corridasderuars: "Corridas de Rua RS",
  runsignup: "RunSignup",
  wikidata: "Wikidata",
  clube: "Plast's Run",
  fallback: "Calendário local",
}

export function Calendario() {
  const { data } = useApp()
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))
  const [selecionado, setSelecionado] = useState(() => new Date())
  const [regiao, setRegiao] = useState<FiltroRegiao>("rs")
  const [eventos, setEventos] = useState<CorridaEvento[]>([])
  const [fontes, setFontes] = useState<FonteStatus[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const start = format(addDays(startOfMonth(cursor), -7), "yyyy-MM-dd")
    const end = format(addDays(endOfMonth(addMonths(cursor, 2)), 7), "yyyy-MM-dd")
    let cancel = false
    setCarregando(true)
    setErro(null)
    void buscarCorridas({ start, end })
      .then((res) => {
        if (cancel) return
        setEventos(res.eventos)
        setFontes(res.fontes)
      })
      .catch((e: Error) => {
        if (cancel) return
        setErro(e.message)
      })
      .finally(() => {
        if (!cancel) setCarregando(false)
      })
    return () => {
      cancel = true
    }
  }, [cursor])

  const doClube: CorridaEvento[] = useMemo(
    () =>
      data.treinos.map((t) => ({
        id: `clube-${t.id}`,
        titulo: t.titulo,
        data: t.data,
        horario: t.horario,
        cidade: data.grupo.cidade ?? "Porto Alegre",
        estado: "RS",
        pais: "BR",
        distancias: t.distanciaKm ? [`${t.distanciaKm} km`] : [],
        url: `/agenda/${t.id}`,
        fonte: "clube" as const,
        local: t.local,
      })),
    [data.treinos, data.grupo.cidade],
  )

  const todos = useMemo(() => [...doClube, ...eventos], [doClube, eventos])

  const filtrados = useMemo(() => {
    return todos
      .filter((e) => {
        if (e.fonte === "clube") return regiao !== "mundo"
        return eventoNaRegiao(e, regiao)
      })
      .sort((a, b) => `${a.data}${a.horario ?? ""}`.localeCompare(`${b.data}${b.horario ?? ""}`))
  }, [todos, regiao])

  const dias = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [cursor])

  const porDia = useMemo(() => {
    const map = new Map<string, CorridaEvento[]>()
    for (const e of filtrados) {
      const list = map.get(e.data) ?? []
      list.push(e)
      map.set(e.data, list)
    }
    return map
  }, [filtrados])

  const doDia = porDia.get(format(selecionado, "yyyy-MM-dd")) ?? []
  const doMes = filtrados.filter((e) => e.data.startsWith(format(cursor, "yyyy-MM")))

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Calendário</p>
          <h1 className="font-display text-3xl font-extrabold">Provas de corrida</h1>
          <p className="mt-1 text-sm text-muted">
            Agenda do clube + provas puxadas ao vivo de calendários públicos.
          </p>
        </div>
        <Link to="/agenda" className="text-xs font-bold text-lime">
          Treinos
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {regioes.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRegiao(r.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
              regiao === r.id ? "bg-ember text-on-accent" : "border border-line bg-card text-muted"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-line bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            className="rounded-full p-2 text-muted hover:bg-card-2 hover:text-ink"
            onClick={() => setCursor((c) => addMonths(c, -1))}
            aria-label="Mês anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <p className="font-display text-lg font-bold capitalize">
            {format(cursor, "MMMM yyyy", { locale: ptBR })}
          </p>
          <button
            type="button"
            className="rounded-full p-2 text-muted hover:bg-card-2 hover:text-ink"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            aria-label="Próximo mês"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-muted">
          {["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {dias.map((day) => {
            const key = format(day, "yyyy-MM-dd")
            const n = porDia.get(key)?.length ?? 0
            const outside = !isSameMonth(day, cursor)
            const selected = isSameDay(day, selecionado)
            const today = isSameDay(day, new Date())
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelecionado(day)}
                className={`relative aspect-square rounded-xl text-sm font-semibold ${
                  selected
                    ? "bg-ember text-on-accent"
                    : today
                      ? "bg-lime/15 text-lime"
                      : outside
                        ? "text-muted/40"
                        : "text-ink hover:bg-card-2"
                }`}
              >
                {format(day, "d")}
                {n > 0 && (
                  <span
                    className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                      selected ? "bg-on-accent" : "bg-ember"
                    }`}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          {format(selecionado, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
        {carregando && <p className="mt-3 text-sm text-muted">Buscando provas nas APIs…</p>}
        {erro && <p className="mt-3 text-sm text-ember">{erro}</p>}
        {!carregando && doDia.length === 0 && (
          <p className="mt-3 text-sm text-muted">
            {regiao === "mundo"
              ? "As APIs abertas trazem poucas provas fora do Brasil. O calendário mais completo está no RS."
              : "Nenhuma prova neste dia com o filtro atual."}
          </p>
        )}
        <ul className="mt-3 space-y-2">
          {doDia.map((e) => (
            <EventoCard key={e.id} evento={e} />
          ))}
        </ul>
      </div>

      {doMes.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {doMes.length} provas em {format(cursor, "MMMM", { locale: ptBR })}
          </p>
          <ul className="mt-3 space-y-2">
            {doMes.slice(0, 40).map((e) => (
              <EventoCard key={`m-${e.id}`} evento={e} compact />
            ))}
          </ul>
        </div>
      )}

      {fontes.length > 0 && (
        <p className="text-[11px] leading-relaxed text-muted">
          Fontes:{" "}
          {fontes.map((f) => `${f.nome}${f.ok ? ` (${f.quantidade})` : " indisponível"}`).join(" · ")}.
          Ahotu, Ativo e Yescom não têm API aberta — o app consulta o calendário público do RS,
          RunSignup e Wikidata. Confira a inscrição no site da prova.
        </p>
      )}
    </div>
  )
}

function EventoCard({ evento, compact }: { evento: CorridaEvento; compact?: boolean }) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {!compact && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-ember">
              {fonteNome[evento.fonte] ?? evento.fonte}
            </p>
          )}
          <h2 className={`font-display font-bold ${compact ? "text-base" : "mt-0.5 text-lg"}`}>
            {evento.titulo}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-sand">
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={12} />
              {formatDia(evento.data)}
              {evento.horario ? ` · ${formatHora(evento.horario)}` : ""}
            </span>
            {(evento.cidade || evento.local) && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} />
                {evento.local || `${evento.cidade}${evento.estado ? `/${evento.estado}` : ""}`}
              </span>
            )}
          </p>
        </div>
        {evento.fonte !== "clube" && <ExternalLink size={14} className="mt-1 shrink-0 text-muted" />}
      </div>
      {evento.distancias.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {evento.distancias.map((d) => (
            <span key={d} className="rounded-full bg-card-2 px-2 py-0.5 text-[10px] font-bold text-lime">
              {d}
            </span>
          ))}
        </div>
      )}
    </>
  )

  const className = "block rounded-2xl border border-line bg-card p-4 transition hover:border-sand/40"

  if (evento.fonte === "clube") {
    return (
      <li>
        <Link to={evento.url} className={className}>
          {inner}
        </Link>
      </li>
    )
  }

  return (
    <li>
      <a href={evento.inscricaoUrl || evento.url} target="_blank" rel="noreferrer" className={className}>
        {inner}
      </a>
    </li>
  )
}
