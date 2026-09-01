import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type Theme = "light" | "dark"

const STORAGE_KEY = "runclub.theme"

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === "light" || saved === "dark") return saved
  const fromDom = document.documentElement.classList.contains("light") ? "light" : "dark"
  return fromDom
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(theme)
  root.style.colorScheme = theme
  localStorage.setItem(STORAGE_KEY, theme)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute("content", theme === "dark" ? "#050805" : "#f4faf1")
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme fora do ThemeProvider")
  return ctx
}
