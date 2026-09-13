import { describe, expect, it } from "vitest"
import { screen } from "@testing-library/react"
import { Agenda } from "./Agenda"
import { renderApp } from "../test/helpers"

describe("Agenda", () => {
  it("lista a seção de provas e os treinos do clube", async () => {
    renderApp(<Agenda />, { route: "/agenda" })
    expect(screen.getByRole("heading", { name: /próximos treinos/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /próximas provas/i })).toBeInTheDocument()
    expect(await screen.findByText(/circuito da longevidade/i)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /^regenerativo$/i })).toBeInTheDocument()
  })
})
