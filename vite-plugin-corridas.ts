import type { Plugin } from "vite"
import { fetchCorridasFromRequest } from "./server/fetchCorridas"

function attach(server: {
  middlewares: {
    use: (
      fn: (
        req: { url?: string },
        res: { setHeader: (k: string, v: string) => void; end: (body: string) => void; statusCode: number },
        next: () => void,
      ) => void,
    ) => void
  }
}) {
  server.middlewares.use((req, res, next) => {
    if (!req.url?.startsWith("/api/corridas")) {
      next()
      return
    }
    void fetchCorridasFromRequest(req.url)
      .then((payload) => {
        res.setHeader("Content-Type", "application/json; charset=utf-8")
        res.setHeader("Cache-Control", "public, max-age=120")
        res.end(JSON.stringify(payload))
      })
      .catch(() => {
        res.statusCode = 502
        res.setHeader("Content-Type", "application/json; charset=utf-8")
        res.end(JSON.stringify({ error: "Falha ao consultar as APIs de corrida." }))
      })
  })
}

export function corridasApiPlugin(): Plugin {
  return {
    name: "corridas-api",
    configureServer(server) {
      attach(server)
    },
    configurePreviewServer(server) {
      attach(server)
    },
  }
}
