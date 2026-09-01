import { useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { QRCodeSVG } from "qrcode.react"
import { CalendarDays, Check, Clock, MapPin, QrCode, Zap } from "lucide-react"
import { useApp } from "../context/AppContext"
import {
  checkinAberto,
  formatDiaLongo,
  formatHora,
  kmLabel,
  nivelLabel,
} from "../lib/format"

export function TreinoDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, me, isStaff, rsvp, checkin, profileById } = useApp()
  const [msg, setMsg] = useState<string | null>(null)
  const [showQr, setShowQr] = useState(false)

  const treino = data.treinos.find((t) => t.id === id)
  const going = useMemo(
    () => data.participacoes.filter((p) => p.treinoId === id),
    [data.participacoes, id],
  )
  const presentes = useMemo(
    () => data.checkins.filter((c) => c.treinoId === id),
    [data.checkins, id],
  )

  if (!treino || !me) {
    return (
      <p className="text-sm text-muted">
        Treino não encontrado.{" "}
        <button type="button" className="text-lime" onClick={() => navigate("/agenda")}>
          Voltar
        </button>
      </p>
    )
  }

  const euVou = going.some((p) => p.usuarioId === me.id)
  const euCheckin = presentes.some((c) => c.usuarioId === me.id)
  const aberto = checkinAberto(treino)
  const qrValue = `${window.location.origin}/checkin/${treino.qrToken}`

  return (
    <div className="space-y-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">{treino.tipo}</p>
      <h1 className="font-display text-4xl font-extrabold leading-none">{treino.titulo}</h1>

      <div className="rounded-3xl border border-line bg-card p-5">
        <ul className="space-y-3 text-sm">
          <Li icon={CalendarDays} label={formatDiaLongo(treino.data)} />
          <Li icon={Clock} label={formatHora(treino.horario)} />
          <Li icon={MapPin} label={treino.local} />
          <Li icon={Zap} label={`${kmLabel(treino.distanciaKm)} · pace ${treino.paceSugerido ?? "livre"}`} />
        </ul>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">
          {nivelLabel(treino.nivel)}
        </p>
        {treino.descricao && (
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-sand">{treino.descricao}</p>
        )}
        {treino.observacoes && (
          <p className="mt-3 rounded-2xl bg-bg px-3 py-2 text-sm text-muted">{treino.observacoes}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => rsvp(treino.id)}
          className={`rounded-2xl py-3 text-sm font-bold ${
            euVou ? "bg-lime text-on-accent" : "bg-ember text-on-accent"
          }`}
        >
          {euVou ? "Confirmado · desfazer" : "Quero participar"}
        </button>
        <button
          type="button"
          disabled={euCheckin}
          onClick={() => {
            const err = checkin(treino.id)
            setMsg(err ?? "Check-in feito. Presença registrada.")
          }}
          className="rounded-2xl border border-line py-3 text-sm font-bold disabled:opacity-40"
        >
          {euCheckin ? "Check-in feito" : "Check-in"}
        </button>
      </div>
      {!aberto && !euCheckin && (
        <p className="text-xs text-muted">
          No dia do treino o check-in fica aberto. Fora do dia, abre 45 min antes e fecha 3h depois.
        </p>
      )}
      {msg && <p className="text-sm text-lime">{msg}</p>}

      {isStaff && (
        <button
          type="button"
          onClick={() => setShowQr((v) => !v)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-card py-3 text-sm font-semibold"
        >
          <QrCode size={16} />
          {showQr ? "Ocultar QR do local" : "QR Code do treino"}
        </button>
      )}
      {showQr && (
        <div className="flex flex-col items-center rounded-3xl bg-white p-6 text-black">
          <QRCodeSVG value={qrValue} size={196} />
          <p className="mt-3 text-center text-xs">
            Atleta abre o app e lê este código no local.
          </p>
          <p className="mt-1 font-mono text-[11px] text-ember-dim">{treino.qrToken}</p>
        </div>
      )}

      <section>
        <h2 className="font-display text-xl font-bold">Confirmados ({going.length})</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {going.map((p) => {
            const who = profileById(p.usuarioId)
            if (!who) return null
            const present = presentes.some((c) => c.usuarioId === who.id)
            return (
              <Link
                key={p.usuarioId}
                to={`/perfil/${who.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-card py-1 pl-1 pr-3"
              >
                <img src={who.fotoUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                <span className="text-xs font-semibold">{who.nome.split(" ")[0]}</span>
                {present && <Check size={12} className="text-lime" />}
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function Li({
  icon: Icon,
  label,
}: {
  icon: typeof CalendarDays
  label: string
}) {
  return (
    <li className="flex items-center gap-3 text-sand">
      <Icon size={16} className="text-ember" />
      {label}
    </li>
  )
}
