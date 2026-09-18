import { beforeEach, describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import { screen } from "@testing-library/react"
import { Login } from "./Login"
import { renderApp } from "../test/helpers"

vi.mock("../lib/supabase", () => ({
  supabaseEnabled: false,
  supabase: null,
  localAuthAllowed: () => true,
  CLOUD_SETUP_ERROR: "nuvem não configurada",
}))

beforeEach(() => {
  localStorage.clear()
})

describe("Login", () => {
  it("mostra o formulário do Plast's Run", () => {
    renderApp(<Login />, { route: "/login" })
    expect(screen.getByText(/Login · Plast's Run/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^e-mail$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^senha$/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /criar conta/i })).toBeInTheDocument()
  })

  it("não diz que a conta é só deste aparelho", async () => {
    const user = userEvent.setup()
    renderApp(<Login />, { route: "/login" })
    await user.type(screen.getByLabelText(/^e-mail$/i), "ana@plasts.run")
    await user.type(screen.getByLabelText(/^senha$/i), "corrida12")
    await user.click(screen.getByRole("button", { name: /entrar/i }))
    const alert = await screen.findByText(/não conferem|incorretos/i)
    expect(alert).toBeInTheDocument()
    expect(alert.textContent).not.toMatch(/neste aparelho/i)
  })
})
