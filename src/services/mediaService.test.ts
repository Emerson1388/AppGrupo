import { describe, expect, it } from "vitest"
import { assertMediaFile } from "./mediaService"

describe("assertMediaFile", () => {
  it("rejeita tipo perigoso", () => {
    expect(() => assertMediaFile(new Blob(["x"], { type: "text/html" }), "posts")).toThrow(/não permitido/i)
  })

  it("aceita jpeg pequeno", () => {
    expect(() => assertMediaFile(new Blob(["x"], { type: "image/jpeg" }), "avatars")).not.toThrow()
  })
})
