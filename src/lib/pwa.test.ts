import { afterEach, describe, expect, it, vi } from "vitest"
import { isPhone, isStandalone, phoneUrl } from "./pwa"

describe("phoneUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("usa a URL pública quando ela existe", () => {
    vi.stubEnv("VITE_PUBLIC_APP_URL", "https://runclub.vercel.app/")
    expect(phoneUrl("/g/plasts-run")).toBe("https://runclub.vercel.app/g/plasts-run")
  })

  it("cai no origin atual sem URL pública", () => {
    vi.stubEnv("VITE_PUBLIC_APP_URL", "")
    expect(phoneUrl("/login")).toMatch(/\/login$/)
  })
})

describe("isPhone / isStandalone", () => {
  it("detecta user agent de celular", () => {
    vi.stubGlobal("navigator", { ...navigator, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)" })
    expect(isPhone()).toBe(true)
    vi.stubGlobal("navigator", { ...navigator, userAgent: "Mozilla/5.0 (Windows NT 10.0)" })
    expect(isPhone()).toBe(false)
  })

  it("não marca desktop como app instalado", () => {
    expect(isStandalone()).toBe(false)
  })
})
