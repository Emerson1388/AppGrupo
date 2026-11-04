import { Link, Navigate, useLocation } from "react-router-dom"
import { AuthShell } from "../components/AuthShell"
import { supabaseEnabled } from "../lib/supabase"

export function VerificarEmail() {
  const location = useLocation()
  const state = location.state as { email?: string; confirmToken?: string } | null
  const token = state?.confirmToken

  if (supabaseEnabled || !token) {
    return <Navigate to="/login" replace />
  }

  return (
    <AuthShell>
      <h1 className="mt-6 font-display text-3xl font-extrabold">Confirme seu e-mail</h1>
      <p className="mt-3 text-sm leading-relaxed text-sand">
        Use o botão abaixo para ativar a conta neste ambiente local.
      </p>
      <Link
        to={`/confirmar-email?token=${encodeURIComponent(token)}`}
        className="mt-8 block rounded-xl bg-ember py-3 text-center text-sm font-bold text-on-accent"
      >
        Confirmar e-mail
      </Link>
      <p className="mt-6 text-center text-sm text-muted">
        <Link to="/login" className="font-semibold text-lime">
          Entrar
        </Link>
      </p>
    </AuthShell>
  )
}
