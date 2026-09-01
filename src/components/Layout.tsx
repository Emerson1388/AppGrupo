import { NavLink, Outlet, useNavigate } from "react-router-dom"
import {
  CalendarDays,
  CalendarRange,
  Dumbbell,
  Home,
  LogOut,
  MessageCircle,
  Plus,
  Trophy,
  User,
  Users,
} from "lucide-react"
import { useApp } from "../context/AppContext"
import { Logo } from "./Logo"
import { ThemeToggle } from "./ThemeToggle"
import { InviteLink } from "./InviteLink"
import { PhoneAccess } from "./PhoneAccess"
import { SpotifyLink } from "./SpotifyLink"

const nav = [
  { to: "/", label: "Feed", icon: Home, end: true },
  { to: "/agenda", label: "Agenda", icon: CalendarDays, end: false },
  { to: "/mensagens", label: "Chat", icon: MessageCircle, end: false },
  { to: "/ranking", label: "Ranking", icon: Trophy, end: false },
  { to: "/perfil", label: "Perfil", icon: User, end: false },
]

export function Layout() {
  const { me, data, logout, isStaff, unreadCount } = useApp()
  const navigate = useNavigate()

  return (
    <div className="min-h-svh bg-bg text-ink">
      <div className="mx-auto flex min-h-svh max-w-6xl">
        <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-line px-4 py-6 md:flex">
          <div className="px-1">
            <Logo className="h-14 w-auto" />
          </div>
          <nav className="mt-8 flex flex-1 flex-col gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    isActive ? "bg-card-2 text-ink" : "text-muted hover:bg-card hover:text-ink"
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
                {item.to === "/mensagens" && unreadCount > 0 && (
                  <span className="ml-auto rounded-full bg-ember px-1.5 text-[10px] text-on-accent">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            ))}
            <NavLink
              to="/corridas"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? "bg-card-2 text-ink" : "text-muted hover:bg-card hover:text-ink"
                }`
              }
            >
              <CalendarRange size={18} />
              Provas
            </NavLink>
            <NavLink
              to="/membros"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? "bg-card-2 text-ink" : "text-muted hover:bg-card hover:text-ink"
                }`
              }
            >
              <Users size={18} />
              Membros
            </NavLink>
            <NavLink
              to="/sugestoes"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? "bg-card-2 text-ink" : "text-muted hover:bg-card hover:text-ink"
                }`
              }
            >
              <Dumbbell size={18} />
              Treinos
            </NavLink>
          </nav>
          <div className="mb-3">
            <SpotifyLink compact />
          </div>
          {isStaff && (
            <div className="mb-3 space-y-2">
              <button
                type="button"
                onClick={() => navigate("/novo-treino")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-ember px-3 py-2.5 text-sm font-bold text-on-accent"
              >
                <Plus size={16} />
                Novo treino
              </button>
              <InviteLink />
              <PhoneAccess compact />
            </div>
          )}
          <div className="mb-3">
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Sair da sua conta neste aparelho?")) {
                logout()
                navigate("/login")
              }
            }}
            className="flex items-center gap-2 px-3 text-sm text-muted hover:text-ink"
          >
            <LogOut size={16} />
            Sair do aplicativo
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-bg/85 px-4 py-3 backdrop-blur md:px-8">
            <div className="md:hidden">
              <Logo className="h-10 w-auto" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold">{data.grupo.cidade}</p>
              <p className="text-xs text-muted">plano {data.grupo.plano}</p>
            </div>
            <div className="flex items-center gap-3">
              {isStaff && (
                <button
                  type="button"
                  onClick={() => navigate("/novo-treino")}
                  className="hidden rounded-full bg-ember px-3 py-1.5 text-xs font-bold text-on-accent sm:inline md:hidden"
                >
                  Novo treino
                </button>
              )}
              <div className="md:hidden">
                <ThemeToggle compact />
              </div>
              <button
                type="button"
                onClick={() => navigate("/perfil")}
                className="flex items-center gap-2"
              >
                <img
                  src={me?.fotoUrl}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-line"
                />
              </button>
            </div>
          </header>

          <main className="flex-1 px-4 pb-24 pt-5 md:px-8 md:pb-10">
            <div className="mx-auto max-w-2xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 py-3 text-[11px] font-semibold ${
                  isActive ? "text-ember" : "text-muted"
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
              {item.to === "/mensagens" && unreadCount > 0 && (
                <span className="absolute right-3 top-2 h-2 w-2 rounded-full bg-ember" />
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
