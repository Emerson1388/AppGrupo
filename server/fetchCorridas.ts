import { provasFallback } from "../src/data/provas-fallback"
import {
  decodeHtml,
  parseDistancias,
  parseLocalRs,
  type CorridaEvento,
  type CorridasResposta,
  type FonteStatus,
} from "../src/lib/corridas"

const UA = "PlastsRun/1.0 (calendario do clube)"
const CACHE_MS = 15 * 60 * 1000
let cache: { key: string; at: number; payload: CorridasResposta } | null = null

type TribeEvent = {
  id: number
  title: string
  url: string
  website?: string
  start_date: string
  venue?: { venue?: string; city?: string; state?: string }
}

type TribePage = {
  events?: TribeEvent[]
  total_pages?: number
}

async function getJson<T>(url: string, timeoutMs = 14000): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return (await res.json()) as T
}

function horarioDe(iso: string) {
  const t = iso.slice(11, 16)
  return t && t !== "00:00" ? t : undefined
}

async function fromCorridasDeRuaRs(start: string, end: string): Promise<CorridaEvento[]> {
  const pages = await Promise.all(
    [1, 2, 3].map((page) =>
      getJson<TribePage>(
        `https://corridasderuars.com.br/wp-json/tribe/events/v1/events` +
          `?per_page=50&page=${page}&start_date=${start}&end_date=${end}`,
      ),
    ),
  )
  const out: CorridaEvento[] = []
  for (const data of pages) {
    for (const e of data.events ?? []) {
      const venue = e.venue?.city || e.venue?.venue || ""
      if (/virtual/i.test(venue)) continue
      const local = parseLocalRs(venue)
      const titulo = decodeHtml(e.title)
      const dataIso = e.start_date.slice(0, 10)
      if (dataIso < start || dataIso > end) continue
      out.push({
        id: `rs-${e.id}`,
        titulo,
        data: dataIso,
        horario: horarioDe(e.start_date),
        cidade: local.cidade || "Rio Grande do Sul",
        estado: local.estado ?? e.venue?.state ?? "RS",
        pais: "BR",
        distancias: parseDistancias(`${titulo} ${venue}`),
        url: e.url,
        inscricaoUrl: e.website || undefined,
        fonte: "corridasderuars",
        local: venue || undefined,
      })
    }
  }
  return out
}

function parseUsDate(raw: string | null | undefined) {
  if (!raw) return null
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/)
  if (!m) return null
  const data = `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`
  const horario = m[4] ? `${m[4].padStart(2, "0")}:${m[5]}` : undefined
  return { data, horario }
}

type RsuRace = {
  race: {
    race_id: number
    name: string
    url?: string
    next_date?: string | null
    address?: { city?: string; state?: string; country_code?: string }
    events?: { start_time?: string; distance?: string | null; event_type?: string }[]
  }
}

async function fromRunSignup(start: string, end: string): Promise<CorridaEvento[]> {
  const url =
    `https://api.runsignup.com/rest/races?format=json&events=T` +
    `&results_per_page=80&sort=${encodeURIComponent("date ASC")}` +
    `&start_date=${start}&end_date=${end}&search_start_date_only=T`
  const data = await getJson<{ races?: RsuRace[] }>(url, 16000)
  const out: CorridaEvento[] = []
  for (const item of data.races ?? []) {
    const race = item.race
    const ev = (race.events ?? []).find((e) => e.event_type === "running_race") ?? race.events?.[0]
    if (!ev || ev.event_type === "virtual_race" || ev.event_type === "nonprofit_event") continue
    const parsed = parseUsDate(ev.start_time) ?? parseUsDate(race.next_date)
    if (!parsed || parsed.data < start || parsed.data > end) continue
    const addr = race.address ?? {}
    out.push({
      id: `rsu-${race.race_id}`,
      titulo: race.name,
      data: parsed.data,
      horario: parsed.horario,
      cidade: addr.city ?? "",
      estado: addr.state,
      pais: addr.country_code ?? "US",
      distancias: parseDistancias(`${race.name} ${ev.distance ?? ""}`),
      url: race.url ?? "https://runsignup.com/",
      fonte: "runsignup",
    })
  }
  return out
}

type WikiBinding = Record<string, { value: string }>

async function fromWikidata(start: string, end: string): Promise<CorridaEvento[]> {
  const query = `
    SELECT DISTINCT ?event ?eventLabel ?date ?countryLabel ?cityLabel ?website WHERE {
      VALUES ?class { wd:Q4022 wd:Q215677 }
      ?event wdt:P31/wdt:P279* ?class .
      ?event wdt:P585 ?date .
      FILTER(?date >= "${start}T00:00:00Z"^^xsd:dateTime && ?date <= "${end}T23:59:59Z"^^xsd:dateTime)
      OPTIONAL { ?event wdt:P17 ?country }
      OPTIONAL { ?event wdt:P276 ?city }
      OPTIONAL { ?event wdt:P856 ?website }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,en". }
    }
    ORDER BY ?date
    LIMIT 40
  `
  const url = `https://query.wikidata.org/sparql?${new URLSearchParams({ format: "json", query })}`
  const data = await getJson<{ results: { bindings: WikiBinding[] } }>(url)
  return data.results.bindings.map((b) => {
    const qid = (b.event?.value ?? "").split("/").pop() ?? crypto.randomUUID()
    const titulo = b.eventLabel?.value ?? "Prova"
    const paisLabel = b.countryLabel?.value ?? ""
    const pais = /brasil/i.test(paisLabel) ? "BR" : "INT"
    return {
      id: `wd-${qid}`,
      titulo,
      data: (b.date?.value ?? "").slice(0, 10),
      cidade: b.cityLabel?.value ?? "",
      pais,
      distancias: parseDistancias(titulo),
      url: b.website?.value ?? b.event?.value ?? "https://www.wikidata.org/",
      fonte: "wikidata" as const,
    }
  })
}

function dedupe(eventos: CorridaEvento[]) {
  const seen = new Set<string>()
  return eventos.filter((e) => {
    const key = `${e.data}|${e.titulo.toLowerCase().replace(/\s+/g, " ").slice(0, 48)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function defaultCorridasWindow() {
  const now = new Date()
  const end = new Date(now)
  end.setDate(end.getDate() + 120)
  return {
    start: now.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

export async function montarCorridas(start: string, end: string): Promise<CorridasResposta> {
  const key = `${start}|${end}`
  if (cache && cache.key === key && Date.now() - cache.at < CACHE_MS) return cache.payload

  const fontes: FonteStatus[] = []
  const chunks: CorridaEvento[][] = []

  async function tryFonte(
    id: FonteStatus["id"],
    nome: string,
    fn: () => Promise<CorridaEvento[]>,
  ) {
    try {
      const eventos = await fn()
      chunks.push(eventos)
      fontes.push({ id, nome, ok: true, quantidade: eventos.length })
    } catch {
      fontes.push({ id, nome, ok: false, quantidade: 0 })
    }
  }

  await Promise.all([
    tryFonte("corridasderuars", "Corridas de Rua RS", () => fromCorridasDeRuaRs(start, end)),
    tryFonte("runsignup", "RunSignup", () => fromRunSignup(start, end)),
    tryFonte("wikidata", "Wikidata", () => fromWikidata(start, end)),
  ])

  const rsOk = fontes.find((f) => f.id === "corridasderuars")?.ok
  const br = chunks.flat().filter((e) => e.pais === "BR" || e.fonte === "corridasderuars")
  if (!rsOk || br.length === 0) {
    const fb = provasFallback.filter((e: CorridaEvento) => e.data >= start && e.data <= end)
    chunks.push(fb)
    fontes.push({
      id: "fallback",
      nome: "Calendário local (reserva)",
      ok: true,
      quantidade: fb.length,
    })
  }

  const eventos = dedupe(chunks.flat()).sort((a, b) =>
    `${a.data}${a.horario ?? ""}`.localeCompare(`${b.data}${b.horario ?? ""}`),
  )
  const payload = { eventos, fontes, geradoEm: new Date().toISOString() }
  cache = { key, at: Date.now(), payload }
  return payload
}

export async function fetchCorridasFromRequest(reqUrl: string): Promise<CorridasResposta> {
  const url = new URL(reqUrl, "http://localhost")
  const def = defaultCorridasWindow()
  const start = url.searchParams.get("start") ?? def.start
  const end = url.searchParams.get("end") ?? def.end
  return montarCorridas(start, end)
}
