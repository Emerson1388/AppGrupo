import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"
import { Convite } from "./Convite"
import { renderApp } from "../test/helpers"

describe("Convite", () => {
  it("mostra o convite do grupo e os atalhos de cadastro e login", () => {
    renderApp(<Convite />, { route: "/g/plasts-run" })
    expect(screen.getByText(/convite do grupo/i)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /plast's run/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /entrar como membro/i })).toHaveAttribute("href", "/cadastro")
    expect(screen.getByRole("link", { name: /entrar$/i })).toHaveAttribute("href", "/login")
  })
})
