import { describe, expect, it } from "vitest"
import type { User } from "@supabase/supabase-js"
import {
  emailDomain,
  isAlreadyRegisteredError,
  isDatabaseSignupError,
  isDuplicateSignupUser,
} from "./signupAuth"

function userWith(identities: unknown[] | undefined): User {
  return { id: "11111111-1111-4111-8111-111111111111", identities } as User
}

describe("signupAuth", () => {
  it("detecta cadastro duplicado pelo Auth (identities vazias)", () => {
    expect(isDuplicateSignupUser(userWith([]))).toBe(true)
    expect(isDuplicateSignupUser(userWith([{ id: "i1" }]))).toBe(false)
    expect(isDuplicateSignupUser(null)).toBe(false)
  })

  it("detecta e-mail já registrado", () => {
    expect(isAlreadyRegisteredError("User already registered")).toBe(true)
    expect(isAlreadyRegisteredError("fail", "user_already_exists")).toBe(true)
    expect(isAlreadyRegisteredError("Invalid login credentials")).toBe(false)
  })

  it("detecta falha do trigger ao gravar o perfil", () => {
    expect(isDatabaseSignupError("Database error saving new user")).toBe(true)
    expect(isDatabaseSignupError("error creating user")).toBe(true)
    expect(isDatabaseSignupError("Invalid login credentials")).toBe(false)
  })

  it("log de diagnóstico usa só o domínio do e-mail", () => {
    expect(emailDomain("ana@plasts.run")).toBe("plasts.run")
    expect(emailDomain("sem-dominio")).toBe("")
  })
})
