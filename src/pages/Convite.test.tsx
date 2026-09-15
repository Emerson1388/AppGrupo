import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { Convite } from "./Convite"
import { AppProvider } from "../context/AppContext"
import { ThemeProvider } from "../context/ThemeContext"

function renderConvite(path: string) {
  return render(
    <ThemeProvider>
      <AppProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/g/:slug" element={<Convite />} />
          </Routes>
        </MemoryRouter>
      </AppProvider>
    </ThemeProvider>,
  )
}

describe("Convite", () => {
  it("mostra o convite do grupo e os atalhos de cadastro e login", () => {
    renderConvite("/g/plasts-run")
    expect(screen.getByText(/convite do grupo/i)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /plast's run/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /entrar como membro/i })).toHaveAttribute("href", "/cadastro")
    expect(screen.getByRole("link", { name: /entrar$/i })).toHaveAttribute("href", "/login")
  })

  it("não oferece cadastro para convite de outro grupo", () => {
    renderConvite("/g/grupo-invalido")
    expect(screen.getByText(/não corresponde a um grupo/i)).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /entrar como membro/i })).not.toBeInTheDocument()
  })
})
