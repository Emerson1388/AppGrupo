import { describe, expect, it } from "vitest"
import { assertMediaFile, avatarObjectPath } from "./mediaService"

describe("assertMediaFile", () => {
  it("rejeita tipo perigoso", () => {
    expect(() => assertMediaFile(new Blob(["x"], { type: "text/html" }), "posts")).toThrow(/não permitido/i)
  })

  it("aceita jpeg pequeno", () => {
    expect(() => assertMediaFile(new Blob(["x"], { type: "image/jpeg" }), "avatars")).not.toThrow()
  })

  it("recusa gif no avatar", () => {
    expect(() => assertMediaFile(new Blob(["x"], { type: "image/gif" }), "avatars")).toThrow(/JPG, PNG ou WebP/i)
  })
})

describe("avatarObjectPath", () => {
  it("grava a foto oficial na pasta do próprio usuário", () => {
    expect(avatarObjectPath("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee")).toBe(
      "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee/avatars/profile.jpg",
    )
  })
})
