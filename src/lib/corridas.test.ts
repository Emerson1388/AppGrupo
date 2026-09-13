import { describe, expect, it, vi, afterEach } from "vitest"
import {
  buscarCorridas,
  decodeHtml,
  eventoNaRegiao,
  mesclarProvasReserva,
  parseDistancias,
  parseLocalRs,
  provasNoIntervalo,
  type CorridaEvento,
} from "./corridas"

function prova(patch: Partial<CorridaEvento> = {}): CorridaEvento {
  return {
    id: "p1",
    titulo: "Corrida Teste",
    data: "2026-10-01",
    cidade: "Porto Alegre",
    estado: "RS",
    pais: "BR",
    distancias: ["5 km"],
    url: "https://exemplo.com",
    fonte: "fallback",
    ...patch,
  }
}

describe("decodeHtml", () => {
  it("decodifica entidades HTML comuns", () => {
    expect(decodeHtml("A &amp; B")).toBe("A & B")
    expect(decodeHtml("&quot;x&quot;")).toBe('"x"')
    expect(decodeHtml("&nbsp;")).toBe(" ")
    expect(decodeHtml("&#65;&#x42;")).toBe("AB")
  })
})

describe("parseDistancias", () => {
  it("reconhece maratona, meia e km no título", () => {
    expect(parseDistancias("Maratona de Porto Alegre")).toContain("42 km")
    expect(parseDistancias("Meia Maratona do Mercado")).toContain("21 km")
    expect(parseDistancias("Track 5k e 10 km")).toEqual(expect.arrayContaining(["5 km", "10 km"]))
  })

  it("não marca 42 km quando o título é meia maratona", () => {
    expect(parseDistancias("Meia maratona")).not.toContain("42 km")
  })
})

describe("parseLocalRs", () => {
  it("separa cidade e UF", () => {
    expect(parseLocalRs("Canoas / RS")).toEqual({ cidade: "Canoas", estado: "RS" })
  })

  it("mantém o texto e infere RS quando não há barra", () => {
    expect(parseLocalRs("Parque da Redenção / RS")).toEqual({
      cidade: "Parque da Redenção",
      estado: "RS",
    })
    expect(parseLocalRs("Orla do Guaíba")).toEqual({
      cidade: "Orla do Guaíba",
      estado: undefined,
    })
  })
})

describe("eventoNaRegiao", () => {
  it("filtra Porto Alegre, RS, Brasil e mundo", () => {
    const poa = prova()
    const gravatai = prova({ cidade: "Gravataí", local: "Centro/RS" })
    const sp = prova({ cidade: "São Paulo", estado: "SP", pais: "BR" })
    const ny = prova({
      cidade: "New York",
      estado: "NY",
      pais: "US",
      fonte: "runsignup",
    })

    expect(eventoNaRegiao(poa, "todas")).toBe(true)
    expect(eventoNaRegiao(poa, "poa")).toBe(true)
    expect(eventoNaRegiao(gravatai, "poa")).toBe(false)
    expect(eventoNaRegiao(gravatai, "rs")).toBe(true)
    expect(eventoNaRegiao(sp, "brasil")).toBe(true)
    expect(eventoNaRegiao(ny, "mundo")).toBe(true)
    expect(eventoNaRegiao(poa, "mundo")).toBe(false)
  })
})

describe("provasNoIntervalo / mesclarProvasReserva", () => {
  it("restringe o calendário reserva ao intervalo", () => {
    const lista = provasNoIntervalo("2026-09-01", "2026-09-30")
    expect(lista.length).toBeGreaterThan(0)
    expect(lista.every((e) => e.data >= "2026-09-01" && e.data <= "2026-09-30")).toBe(true)
  })

  it("junta a reserva sem duplicar prova já presente", () => {
    const existente = prova({
      titulo: "Circuito da Longevidade Bradesco Seguros",
      data: "2026-09-13",
    })
    const mesclado = mesclarProvasReserva([existente], "2026-09-01", "2026-09-30")
    const iguais = mesclado.filter((e) => e.titulo.includes("Longevidade") && e.data === "2026-09-13")
    expect(iguais).toHaveLength(1)
    expect(mesclado.length).toBeGreaterThan(1)
  })
})

describe("buscarCorridas", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("usa o calendário reserva quando a API falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))
    const res = await buscarCorridas({ start: "2026-09-01", end: "2026-12-31" })
    expect(res.fontes[0]?.id).toBe("fallback")
    expect(res.eventos.length).toBeGreaterThan(0)
  })

  it("mescla a reserva mesmo quando a API responde vazia", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ eventos: [], fontes: [], geradoEm: "2026-09-12T00:00:00Z" }),
      }),
    )
    const res = await buscarCorridas({ start: "2026-09-01", end: "2026-09-30" })
    expect(res.eventos.length).toBeGreaterThan(0)
  })
})
