import { render, type RenderOptions } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import type { ReactElement, ReactNode } from "react"
import { AppProvider } from "../context/AppContext"
import { ThemeProvider } from "../context/ThemeContext"
import type { Treino } from "../types"

export function makeTreino(patch: Partial<Treino> = {}): Treino {
  return {
    id: "t-test",
    grupoId: "g1",
    titulo: "Regenerativo",
    tipo: "regenerativo",
    data: "2026-09-12",
    horario: "19:00",
    local: "Parcão",
    distanciaKm: 5,
    paceSugerido: "6:00",
    nivel: "iniciante",
    qrToken: "qr_test",
    criadoPor: "",
    ...patch,
  }
}

export function renderApp(
  ui: ReactElement,
  options: { route?: string } & Omit<RenderOptions, "wrapper"> = {},
) {
  const { route = "/", ...rest } = options
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ThemeProvider>
        <AppProvider>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </AppProvider>
      </ThemeProvider>
    )
  }
  return render(ui, { wrapper: Wrapper, ...rest })
}
