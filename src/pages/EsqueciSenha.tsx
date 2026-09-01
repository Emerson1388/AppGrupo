import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { useApp } from "../context/AppContext"
import { AuthShell } from "../components/AuthShell"
import { supabaseEnabled } from "../lib/supabase"

export function EsqueciSenha() {
  const { requestPasswordReset } = useApp()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [demoToken, setDemoToken] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { token } = await requestPasswordReset(email)
    setBusy(false)
    setSent(true)
    setDemoToken(token)
  }

  return (
    <AuthShell>
      <h1 className="mt-6 font-display text-3xl font-extrabold">Recuperar senha</h1>
      <p className="mt-2 text-sm text-muted">
        Se o e-mail existir, enviamos um link. Não informamos se a conta está cadastrada.
      </p>
      {sent ? (
        <div className="mt-8 space-y-3 text-sm text-sand">
          <p>Se houver conta nesse e-mail, o link de redefinição foi gerado.</p>
          {!supabaseEnabled && demoToken && (
            <Link
              to={`/redefinir-senha?token=${encodeURIComponent(demoToken)}`}
              className="block rounded-xl bg-ember py-3 text-center text-sm font-bold text-on-accent"
            >
              Redefinir senha agora
            </Link>
          )}
        </div>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
          <label className="block text-xs font-semibold text-muted">
            E-mail
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-3 text-sm outline-none focus:border-ember"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-ember py-3 text-sm font-bold text-on-accent disabled:opacity-60"
          >
            {busy ? "Enviando…" : "Enviar link"}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted">
        <Link to="/login" className="font-semibold text-lime">
          Voltar ao login
        </Link>
      </p>
    </AuthShell>
  )
}
