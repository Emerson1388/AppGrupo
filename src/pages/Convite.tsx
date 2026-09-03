import { Link, Navigate, useParams } from "react-router-dom"
import { useApp } from "../context/AppContext"
import { Logo } from "../components/Logo"
import { ThemeToggle } from "../components/ThemeToggle"
import { PhoneAccess } from "../components/PhoneAccess"
import { SpotifyLink } from "../components/SpotifyLink"

export function Convite() {
  const { slug } = useParams()
  const { me, data } = useApp()
  const grupo = data.grupo
  const ok = !slug || slug === grupo.slug

  if (me) return <Navigate to="/" replace />

  return (
    <div className="relative min-h-svh bg-bg px-5 py-10 text-ink">
      <div className="absolute right-5 top-5 w-48">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex min-h-[80svh] w-full max-w-md flex-col justify-center pt-8">
        <Logo className="h-28 w-auto sm:h-32" />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-ember">
          Convite do grupo
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold leading-none">
          {ok ? grupo.nome : "Grupo"}
        </h1>
        <p className="mt-3 text-sand">
          Entre com este link e você vira membro: agenda de treinos, check-in, feed e mensagens
          privadas com o clube.
        </p>
        <Link
          to="/cadastro"
          className="mt-8 rounded-xl bg-ember py-3 text-center text-sm font-bold text-on-accent"
        >
          Entrar como membro
        </Link>
        <div className="mt-4">
          <SpotifyLink />
        </div>
        <div className="mt-6">
          <PhoneAccess />
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          Já faz parte?{" "}
          <Link to="/login" className="font-semibold text-lime">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
