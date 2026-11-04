import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import { Cadastro } from "./Cadastro"
import { renderApp } from "../test/helpers"

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

vi.mock("../lib/supabase", () => ({
  supabaseEnabled: false,
  supabase: null,
  localAuthAllowed: () => true,
}))

describe("Cadastro", () => {
  it("explica que a conta é uma só em qualquer aparelho", () => {
    renderApp(<Cadastro />, { route: "/cadastro" })
    expect(screen.getByText(/cadastre só uma vez/i)).toBeInTheDocument()
    expect(screen.getByText(/banco do grupo/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /entrar/i })).toBeInTheDocument()
  })
})
