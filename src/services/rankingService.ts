import { treinoPassou } from "../lib/format"
import type { AppData, Profile } from "../types"

export type RankingRow = {
  profile: Profile
  km: number
  treinos: number
  rsvps: number
  presenca: number
}

function monthKey(iso: string) {
  return iso.slice(0, 7)
}

/** Ranking oficial: só check-in em treino do mês. Distância de post social não conta. */
export function computeMonthlyRanking(data: AppData, now = new Date()): RankingRow[] {
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const treinosMes = data.treinos.filter((t) => t.data.startsWith(month))
  const passados = treinosMes.filter((t) => treinoPassou(t, now))

  return data.profiles
    .map((profile) => {
      const checkins = data.checkins.filter(
        (c) => c.usuarioId === profile.id && monthKey(c.dataHora) === month,
      )
      const km = checkins.reduce((acc, c) => {
        const t = data.treinos.find((x) => x.id === c.treinoId)
        return acc + (t?.distanciaKm ?? 0)
      }, 0)
      const rsvps = data.participacoes.filter((p) => {
        if (p.usuarioId !== profile.id) return false
        return passados.some((t) => t.id === p.treinoId)
      }).length
      const presentes = checkins.filter((c) => passados.some((t) => t.id === c.treinoId)).length
      return {
        profile,
        km,
        treinos: checkins.length,
        rsvps,
        presenca: rsvps === 0 ? 0 : Math.round((presentes / rsvps) * 100),
      }
    })
    .sort((a, b) => b.km - a.km || b.treinos - a.treinos)
}
