import { describe, expect, it } from "vitest"
import { newEntityId } from "./supabaseSync"

describe("newEntityId", () => {
  it("gera UUID compatível com o Postgres", () => {
    expect(newEntityId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
  })
})
