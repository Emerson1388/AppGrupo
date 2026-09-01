import { addMinutes, format, isWithinInterval, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Treino } from "../types"

export function formatDia(isoDate: string) {
  return format(parseISO(`${isoDate}T12:00:00`), "EEE, d MMM", { locale: ptBR })
}

export function formatDiaLongo(isoDate: string) {
  return format(parseISO(`${isoDate}T12:00:00`), "EEEE, d 'de' MMMM", {
    locale: ptBR,
  })
}

export function formatHora(horario: string) {
  return horario.slice(0, 5)
}

export function formatQuando(iso: string) {
  return format(parseISO(iso), "d MMM · HH:mm", { locale: ptBR })
}

export function treinoDateTime(treino: Treino) {
  return parseISO(`${treino.data}T${treino.horario.length === 5 ? `${treino.horario}:00` : treino.horario}`)
}

export function checkinAberto(treino: Treino, agora = new Date()) {
  const hoje = format(agora, "yyyy-MM-dd")
  if (treino.data === hoje) return true
  const inicio = treinoDateTime(treino)
  return isWithinInterval(agora, {
    start: addMinutes(inicio, -45),
    end: addMinutes(inicio, 180),
  })
}

export function treinoPassou(treino: Treino, agora = new Date()) {
  return treinoDateTime(treino) < agora
}

export function kmLabel(n: number) {
  return `${Number.isInteger(n) ? n : n.toFixed(1)} km`
}

export function nivelLabel(nivel: string) {
  if (nivel === "iniciante") return "Iniciante"
  if (nivel === "intermediario") return "Intermediário"
  return "Avançado"
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}
