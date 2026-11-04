import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { AuthCallback } from "./AuthCallback"
import { ThemeProvider } from "../context/ThemeContext"

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  })),
}))

vi.mock("../lib/supabase", () => ({
  supabaseEnabled: true,
  localAuthAllowed: () => false,
  supabase: {
    auth: {
      getSession: authMocks.getSession,
      exchangeCodeForSession: authMocks.exchangeCodeForSession,
      onAuthStateChange: authMocks.onAuthStateChange,
    },
  },
}))

describe("AuthCallback", () => {
  it("entra quando a sessão já veio do Auth", async () => {
    authMocks.getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
    })
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={["/auth/callback"]}>
          <AuthCallback />
        </MemoryRouter>
      </ThemeProvider>,
    )
    expect(await screen.findByText(/e-mail confirmado|entrando/i)).toBeInTheDocument()
  })
})
