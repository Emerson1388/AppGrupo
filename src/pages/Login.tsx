import { useState, type FormEvent } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { useApp } from "../context/AppContext"
import { AuthShell } from "../components/AuthShell"
import { PasswordField } from "../components/PasswordField"
import { PhoneAccess } from "../components/PhoneAccess"

export function Login() {
  const { me, login, data } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? "/"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (me) return <Navigate to={from.startsWith("/g/") ? "/" : from} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const err = await login(email, password)
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    navigate(from.startsWith("/g/") ? "/" : from)
  }

  return (
    <AuthShell>
      <p className="mt-4 text-lg leading-snug text-sand">
        Use o mesmo e-mail e a mesma senha em qualquer aparelho. A conta fica na nuvem, não só neste
        celular ou computador.
      </p>

      <div className="mt-8 rounded-3xl border border-line bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Login · {data.grupo.nome}
        </p>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-5 space-y-3">
          <label className="block text-xs font-semibold text-muted">
            E-mail
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-3 text-sm text-ink outline-none focus:border-ember"
              placeholder="voce@email.com"
              type="email"
              autoComplete="username"
              required
            />
          </label>
          <PasswordField
            label="Senha"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
          <div className="text-right">
            <Link to="/esqueci-senha" className="text-xs font-semibold text-lime">
              Esqueci a senha
            </Link>
          </div>
          {error && (
            <div className="space-y-1">
              <p className="text-sm text-ember">{error}</p>
              <p className="text-xs text-muted">
                Primeira vez neste celular?{" "}
                <Link to="/cadastro" className="font-semibold text-lime">
                  Criar conta
                </Link>
              </p>
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-ember py-3 text-sm font-bold text-on-accent disabled:opacity-60"
          >
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Novo no grupo?{" "}
        <Link to="/cadastro" className="font-semibold text-lime">
          Criar conta
        </Link>
      </p>
      <p className="mt-2 text-center text-[11px] text-muted">
        <Link to="/privacidade" className="underline">
          Privacidade
        </Link>
        {" · "}
        <Link to="/termos" className="underline">
          Termos
        </Link>
      </p>
      <div className="mt-6">
        <PhoneAccess />
      </div>
    </AuthShell>
  )
}
