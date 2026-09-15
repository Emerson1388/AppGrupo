import { describe, expect, it } from "vitest"
import { newEntityId, persistPost } from "./supabaseSync"

describe("newEntityId", () => {
  it("gera UUID compatível com o Postgres", () => {
    expect(newEntityId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
  })
})

describe("persistPost", () => {
  it("recusa foto embutida em data URL", async () => {
    const result = await persistPost({
      id: "11111111-1111-4111-8111-111111111111",
      grupoId: "22222222-2222-4222-8222-222222222222",
      usuarioId: "33333333-3333-4333-8333-333333333333",
      texto: "treino",
      tipo: "foto",
      midiaUrl: "data:image/png;base64,aaaa",
      createdAt: new Date().toISOString(),
    })
    expect(result.error).toMatch(/armazenamento/i)
  })
})


describe("newEntityId", () => {
  it("gera UUID compatível com o Postgres", () => {
    expect(newEntityId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
  })
})
