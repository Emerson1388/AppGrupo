import { Link, useLocation } from "react-router-dom"
import { AuthShell } from "../components/AuthShell"
import { supabaseEnabled } from "../lib/supabase"

export function VerificarEmail() {
  const location = useLocation()
  const state = location.state as { email?: string; confirmToken?: string } | null
  const email = state?.email
  const token = state?.confirmToken

  return (
    <AuthShell>
      <h1 className="mt-6 font-display text-3xl font-extrabold">Confirme seu e-mail</h1>
      <p className="mt-3 text-sm leading-relaxed text-sand">
        {email
          ? `Enviamos um link de confirmação para ${email}. Sem esse passo a conta não é ativada.`
          : "Enviamos um link de confirmação para o seu e-mail."}
      </p>
      {supabaseEnabled ? (
        <p className="mt-3 text-xs text-muted">
          Abra a caixa de entrada (e o spam). Depois de confirmar, a mesma senha entra no celular e
          no computador. O link vale 24 horas.
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted">
          Neste ambiente ainda sem servidor de e-mail, use o botão abaixo para confirmar. Com o
          Supabase ligado, o aviso chega de verdade na sua caixa.
        </p>
      )}
      {token && (
        <Link
          to={`/confirmar-email?token=${encodeURIComponent(token)}`}
          className="mt-8 block rounded-xl bg-ember py-3 text-center text-sm font-bold text-on-accent"
        >
          Confirmar e-mail
        </Link>
      )}
      <p className="mt-6 text-center text-sm text-muted">
        <Link to="/login" className="font-semibold text-lime">
          Voltar ao login
        </Link>
      </p>
    </AuthShell>
  )
}
