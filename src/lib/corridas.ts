import { provasFallback } from "../data/provas-fallback.ts"

export type FonteCorrida = "corridasderuars" | "runsignup" | "wikidata" | "clube" | "fallback"

export type CorridaEvento = {
  id: string
  titulo: string
  data: string
  horario?: string
  cidade: string
  estado?: string
  pais: string
  distancias: string[]
  url: string
  inscricaoUrl?: string
  fonte: FonteCorrida
  local?: string
}

export type FonteStatus = {
  id: FonteCorrida
  nome: string
  ok: boolean
  quantidade: number
}

export type CorridasResposta = {
  eventos: CorridaEvento[]
  fontes: FonteStatus[]
  geradoEm: string
}

export function decodeHtml(html: string) {
  return html
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&nbsp;/g, " ")
}

export function parseDistancias(texto: string) {
  const found = new Set<string>()
  const lower = texto.toLowerCase()
  if (/\bmaratona\b/.test(lower) && !/meia/.test(lower)) found.add("42 km")
  if (/meia maratona|\b21\s*k/.test(lower)) found.add("21 km")
  for (const m of texto.matchAll(/\b(\d+(?:[.,]\d+)?)\s*k(?:m)?\b/gi)) {
    const n = m[1].replace(",", ".")
    found.add(`${n} km`)
  }
  return [...found]
}

export function parseLocalRs(venue: string) {
  const clean = decodeHtml(venue).trim()
  const m = clean.match(/^(.+?)\s*\/\s*([A-Z]{2})$/i)
  if (m) return { cidade: m[1].trim(), estado: m[2].toUpperCase() }
  return { cidade: clean, estado: /\/\s*RS\b/i.test(clean) ? "RS" : undefined }
}

export type FiltroRegiao = "poa" | "rs" | "brasil" | "mundo" | "todas"

export function eventoNaRegiao(e: CorridaEvento, filtro: FiltroRegiao) {
  if (filtro === "todas") return true
  if (filtro === "poa") return /porto alegre/i.test(e.cidade) || /porto alegre/i.test(e.local ?? "")
  if (filtro === "rs") return e.estado === "RS" || /\/RS|\bRS\b/.test(`${e.cidade} ${e.local ?? ""}`)
  if (filtro === "brasil") return e.pais === "BR" || e.fonte === "corridasderuars" || e.fonte === "fallback"
  return e.pais !== "BR" && e.fonte !== "corridasderuars" && e.fonte !== "fallback"
}

export function provasNoIntervalo(start?: string, end?: string) {
  return provasFallback.filter((e) => {
    if (start && e.data < start) return false
    if (end && e.data > end) return false
    return true
  })
}

export function mesclarProvasReserva(
  eventos: CorridaEvento[],
  start?: string,
  end?: string,
): CorridaEvento[] {
  const seen = new Set(
    eventos.map((e) => `${e.data}|${e.titulo.toLowerCase().replace(/\s+/g, " ").slice(0, 48)}`),
  )
  const extra = provasNoIntervalo(start, end).filter((e) => {
    const key = `${e.data}|${e.titulo.toLowerCase().replace(/\s+/g, " ").slice(0, 48)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return [...eventos, ...extra].sort((a, b) =>
    `${a.data}${a.horario ?? ""}`.localeCompare(`${b.data}${b.horario ?? ""}`),
  )
}

export async function buscarCorridas(params?: { start?: string; end?: string }) {
  const qs = new URLSearchParams()
  if (params?.start) qs.set("start", params.start)
  if (params?.end) qs.set("end", params.end)
  const url = `/api/corridas${qs.toString() ? `?${qs}` : ""}`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error("api")
    const data = (await res.json()) as CorridasResposta
    const eventos = mesclarProvasReserva(data.eventos ?? [], params?.start, params?.end)
    return { ...data, eventos }
  } catch {
    const eventos = provasNoIntervalo(params?.start, params?.end)
    return {
      eventos,
      fontes: [{ id: "fallback" as const, nome: "Calendário local", ok: true, quantidade: eventos.length }],
      geradoEm: new Date().toISOString(),
    }
  }
}
