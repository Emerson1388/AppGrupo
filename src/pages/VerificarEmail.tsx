import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { AuthShell } from "../components/AuthShell"
import { supabaseEnabled } from "../lib/supabase"

const LIBERAR_LOGIN_SQL = `update auth.users
set email_confirmed_at = now()
where email_confirmed_at is null;`

export function VerificarEmail() {
  const location = useLocation()
  const state = location.state as { email?: string; confirmToken?: string } | null
  const email = state?.email
  const token = state?.confirmToken
  const [copied, setCopied] = useState(false)

  async function copySql() {
    try {
      await navigator.clipboard.writeText(LIBERAR_LOGIN_SQL)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="mt-6 font-display text-3xl font-extrabold">Conta criada</h1>
      <p className="mt-3 text-sm leading-relaxed text-sand">
        {email
          ? `A conta de ${email} já está no banco. O e-mail de confirmação não está chegando, por isso o login diz que a senha não confere.`
          : "A conta já está no banco. O e-mail de confirmação não está chegando, por isso o login diz que a senha não confere."}
      </p>
      {supabaseEnabled ? (
        <>
          <p className="mt-3 text-xs text-muted">
            No Supabase: SQL Editor → cole o texto abaixo → Run. Depois volte e entre com a mesma
            senha. Não cadastre de novo.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-line bg-card p-3 font-mono text-[11px] leading-relaxed text-sand">
            {LIBERAR_LOGIN_SQL}
          </pre>
          <button
            type="button"
            onClick={() => void copySql()}
            className="mt-3 w-full rounded-xl border border-line py-3 text-sm font-bold"
          >
            {copied ? "SQL copiado" : "Copiar SQL"}
          </button>
        </>
      ) : (
        <p className="mt-3 text-xs text-muted">
          Neste ambiente ainda sem servidor de e-mail, use o botão abaixo para confirmar.
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
        Já rodei o SQL?{" "}
        <Link to="/login" className="font-semibold text-lime">
          Entrar
        </Link>
      </p>
    </AuthShell>
  )
}
