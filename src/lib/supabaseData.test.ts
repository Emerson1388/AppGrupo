import { describe, expect, it } from "vitest"
import { authErrorMessage } from "./supabaseData"

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

  it("devolve a mensagem original quando não reconhece", () => {
    expect(authErrorMessage("Network down")).toBe("Network down")
  })
})
