import { useState, type FormEvent } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { useApp } from "../context/AppContext"
import { AuthShell } from "../components/AuthShell"
import { PasswordField } from "../components/PasswordField"
import { passwordIssues } from "../lib/password"
import type { Nivel } from "../types"

export function Cadastro() {
  const { me, signup } = useApp()
  const navigate = useNavigate()
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [nivel, setNivel] = useState<Nivel>("iniciante")
  const [lgpd, setLgpd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (me) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError("As senhas não coincidem.")
      return
    }
    const weak = passwordIssues(password)
    if (weak.length) {
      setError(`Senha fraca: ${weak.join(", ")}.`)
      return
    }
    setBusy(true)
    setError(null)
    const result = await signup({ nome, email, password, nivel, lgpdConsent: lgpd })
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.pendingEmail) {
      navigate("/verificar-email", {
        state: { email: result.pendingEmail, confirmToken: result.confirmToken },
      })
      return
    }
    navigate("/")
  }

  return (
    <AuthShell>
      <p className="mt-4 text-sm text-muted">
        Cadastre uma vez. A mesma senha entra no computador e no celular. Se o app pedir, confirme o
        e-mail antes do primeiro login no outro aparelho.
      </p>

      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
        <label className="block text-xs font-semibold text-muted">
          Nome completo
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            autoComplete="name"
            className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-3 text-sm text-ink outline-none focus:border-ember"
          />
        </label>
        <label className="block text-xs font-semibold text-muted">
          E-mail
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-3 text-sm text-ink outline-none focus:border-ember"
          />
        </label>
        <PasswordField
          label="Senha"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder="8+ caracteres, letra e número"
        />
        <PasswordField
          label="Confirmar senha"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />
        <label className="block text-xs font-semibold text-muted">
          Nível
          <select
            value={nivel}
            onChange={(e) => setNivel(e.target.value as Nivel)}
            className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-3 text-sm text-ink"
          >
            <option value="iniciante">Iniciante</option>
            <option value="intermediario">Intermediário</option>
            <option value="avancado">Avançado</option>
          </select>
        </label>
        <label className="flex items-start gap-2 text-xs leading-relaxed text-sand">
          <input
            type="checkbox"
            checked={lgpd}
            onChange={(e) => setLgpd(e.target.checked)}
            className="mt-0.5"
            required
          />
          <span>
            Li e concordo com a{" "}
            <Link to="/privacidade" className="font-semibold text-lime">
              Política de Privacidade
            </Link>{" "}
            e os{" "}
            <Link to="/termos" className="font-semibold text-lime">
              Termos de Uso
            </Link>
            . Autorizo o tratamento dos meus dados para operar o grupo de corrida (LGPD, art. 7º, I).
          </span>
        </label>
        {error && <p className="text-sm text-ember">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-ember py-3 text-sm font-bold text-on-accent disabled:opacity-60"
        >
          {busy ? "Criando conta…" : "Criar conta e confirmar e-mail"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link to="/login" className="font-semibold text-lime">
          Entrar
        </Link>
      </p>
    </AuthShell>
  )
}
