import { describe, expect, it } from "vitest"
import { hashPassword, passwordIssues, randomToken, verifyPassword } from "./password"

describe("passwordIssues", () => {
  it("aceita senha com 8+ caracteres, letra e número", () => {
    expect(passwordIssues("corrida1")).toEqual([])
  })

  it("reprova senha curta", () => {
    expect(passwordIssues("Ab1")).toContain("mínimo de 8 caracteres")
  })

  it("reprova senha só numérica", () => {
    expect(passwordIssues("12345678")).toContain("pelo menos uma letra")
  })

  it("reprova senha só com letras", () => {
    expect(passwordIssues("abcdefgh")).toContain("pelo menos um número")
  })
})

describe("hashPassword / verifyPassword", () => {
  it("valida a senha correta e rejeita a errada", async () => {
    const { hash, salt } = await hashPassword("treino2026")
    await expect(verifyPassword("treino2026", hash, salt)).resolves.toBe(true)
    await expect(verifyPassword("treino2025", hash, salt)).resolves.toBe(false)
  })
})

describe("randomToken", () => {
  it("gera tokens hex de 64 caracteres e diferentes entre si", () => {
    const a = randomToken()
    const b = randomToken()
    expect(a).toMatch(/^[0-9a-f]{64}$/)
    expect(b).toMatch(/^[0-9a-f]{64}$/)
    expect(a).not.toBe(b)
  })
})
