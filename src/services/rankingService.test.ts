import { describe, expect, it } from "vitest"
import { computeMonthlyRanking } from "./rankingService"
import { initialData } from "../data/mock"

describe("computeMonthlyRanking", () => {
  it("não soma quilometragem digitada em post social", () => {
    const profile = {
      id: "u-rank",
      grupoId: "g1",
      nome: "Ana",
      email: "ana@plasts.run",
      fotoUrl: "",
      nivel: "iniciante" as const,
      role: "atleta" as const,
    }
    const treino = {
      ...initialData.treinos[0],
      id: "treino-rank",
      data: "2026-09-12",
      distanciaKm: 10,
    }
    const rows = computeMonthlyRanking(
      {
        ...initialData,
        profiles: [profile],
        treinos: [treino],
        checkins: [
          {
            id: "c1",
            usuarioId: profile.id,
            treinoId: treino.id,
            dataHora: "2026-09-12T09:00:00",
            status: "presente",
            metodo: "manual",
          },
        ],
        participacoes: [],
        publicacoes: [
          {
            id: "p1",
            grupoId: profile.grupoId,
            usuarioId: profile.id,
            texto: "Fiz 200 km sozinho",
            tipo: "texto",
            distanciaKm: 200,
            createdAt: "2026-09-12T18:00:00",
          },
        ],
      },
      new Date(2026, 8, 14),
    )
    expect(rows[0]?.km).toBe(10)
  })
})
