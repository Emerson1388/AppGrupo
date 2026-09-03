import type { IncomingMessage, ServerResponse } from "node:http"
import { fetchCorridasFromRequest } from "../server/fetchCorridas.ts"

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204
    res.end()
    return
  }
  try {
    const payload = await fetchCorridasFromRequest(req.url ?? "/api/corridas")
    res.setHeader("Content-Type", "application/json; charset=utf-8")
    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600")
    res.statusCode = 200
    res.end(JSON.stringify(payload))
  } catch {
    res.statusCode = 502
    res.setHeader("Content-Type", "application/json; charset=utf-8")
    res.end(JSON.stringify({ error: "Falha ao consultar as APIs de corrida." }))
  }
}
