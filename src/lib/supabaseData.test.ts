import { describe, expect, it } from "vitest"
import { authErrorMessage, cloudErrorMessage } from "./supabaseData"

describe("authErrorMessage", () => {
  it("traduz e-mail não confirmado", () => {
    expect(authErrorMessage("Email not confirmed")).toMatch(/e-mail de confirmação/i)
  })

  it("traduz login inválido", () => {
    expect(authErrorMessage("Invalid login credentials")).toMatch(/não conferem/i)
  })

  it("traduz e-mail já cadastrado", () => {
    expect(authErrorMessage("User already registered")).toBe("Esse e-mail já está cadastrado.")
  })

  it("traduz senha fraca do provedor", () => {
    expect(authErrorMessage("Password should be at least 8 characters")).toMatch(/8 caracteres/)
  })

  it("esconde erros técnicos do provedor", () => {
    expect(authErrorMessage("PGRST116 unexpected")).toMatch(/sessão expirada|tente de novo/i)
  })
})

describe("cloudErrorMessage", () => {
  it("traduz check-in fora da janela", () => {
    expect(cloudErrorMessage("Check-in fora da janela")).toMatch(/45 min/)
  })

  it("traduz presença duplicada", () => {
    expect(cloudErrorMessage("duplicate key value")).toMatch(/já registrada/i)
  })
})
