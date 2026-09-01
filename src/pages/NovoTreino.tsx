import { useState, type FormEvent } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { useApp } from "../context/AppContext"
import type { Nivel } from "../types"
import { InviteLink } from "../components/InviteLink"

export function NovoTreino() {
  const { isStaff, me, createTreino } = useApp()
  const navigate = useNavigate()
  const [titulo, setTitulo] = useState("Intervalado")
  const [tipo, setTipo] = useState("intervalado")
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"))
  const [horario, setHorario] = useState("19:30")
  const [local, setLocal] = useState("Parcão")
  const [distanciaKm, setDistanciaKm] = useState("6")
  const [paceSugerido, setPaceSugerido] = useState("5:30–6:00")
  const [nivel, setNivel] = useState<Nivel>("intermediario")
  const [descricao, setDescricao] = useState("")
  const [observacoes, setObservacoes] = useState("")

  if (!isStaff) return <Navigate to="/agenda" replace />

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    createTreino({
      titulo,
      tipo,
      descricao,
      data,
      horario,
      local,
      distanciaKm: Number(distanciaKm) || 0,
      paceSugerido,
      nivel,
      observacoes,
      treinadorId: me?.id,
    })
    navigate("/agenda")
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Publicar treino</h1>
      <p className="mt-1 text-sm text-muted">
        Data, hora e sessão entram na agenda. O grupo vê no feed e faz check-in.
      </p>
      <div className="mt-4">
        <InviteLink />
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <Input label="Título" value={titulo} onChange={setTitulo} />
        <Input label="Tipo" value={tipo} onChange={setTipo} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Data" value={data} onChange={setData} type="date" />
          <Input label="Horário" value={horario} onChange={setHorario} type="time" />
        </div>
        <Input label="Local" value={local} onChange={setLocal} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Distância (km)" value={distanciaKm} onChange={setDistanciaKm} />
          <Input label="Pace sugerido" value={paceSugerido} onChange={setPaceSugerido} />
        </div>
        <label className="block text-xs font-semibold text-muted">
          Nível
          <select
            value={nivel}
            onChange={(e) => setNivel(e.target.value as Nivel)}
            className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-3 text-sm"
          >
            <option value="iniciante">Iniciante</option>
            <option value="intermediario">Intermediário</option>
            <option value="avancado">Avançado</option>
          </select>
        </label>
        <label className="block text-xs font-semibold text-muted">
          Descrição / sessão
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-3 text-sm"
            placeholder={"10 min aquecimento\n5 × 800 m forte\n2 min recuperação"}
          />
        </label>
        <Input label="Observações" value={observacoes} onChange={setObservacoes} />
        <button type="submit" className="w-full rounded-xl bg-ember py-3 text-sm font-bold text-on-accent">
          Publicar na agenda
        </button>
      </form>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <label className="block text-xs font-semibold text-muted">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-3 text-sm text-ink outline-none focus:border-ember"
      />
    </label>
  )
}
