import type { ReactNode } from "react"
import { Logo } from "./Logo"
import { ThemeToggle } from "./ThemeToggle"

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-svh overflow-hidden bg-bg px-5 py-10 text-ink">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-ember/20 blur-3xl" />
      <div className="absolute right-5 top-5 w-48">
        <ThemeToggle />
      </div>
      <div className="mx-auto w-full max-w-md pt-8">
        <Logo className="h-24 w-auto sm:h-28" />
        {children}
      </div>
    </div>
  )
}
