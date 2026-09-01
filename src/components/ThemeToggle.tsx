import { Moon, Sun } from "lucide-react"
import { useTheme, type Theme } from "../context/ThemeContext"

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme()

  if (compact) {
    const next: Theme = theme === "dark" ? "light" : "dark"
    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted hover:text-ink"
        aria-label={next === "light" ? "Ativar tema claro" : "Ativar tema escuro"}
        title={theme === "dark" ? "Tema escuro" : "Tema claro"}
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    )
  }

  return (
    <div className="grid grid-cols-2 rounded-xl border border-line bg-card p-1 text-xs font-bold">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`flex items-center justify-center gap-1.5 rounded-lg py-2 ${
          theme === "light" ? "bg-ember text-on-accent" : "text-muted"
        }`}
      >
        <Sun size={14} />
        Claro
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`flex items-center justify-center gap-1.5 rounded-lg py-2 ${
          theme === "dark" ? "bg-ember text-on-accent" : "text-muted"
        }`}
      >
        <Moon size={14} />
        Escuro
      </button>
    </div>
  )
}
