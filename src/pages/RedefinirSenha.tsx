import { useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useApp } from "../context/AppContext"
import { AuthShell } from "../components/AuthShell"
import { PasswordField } from "../components/PasswordField"
import { passwordIssues } from "../lib/password"

export function RedefinirSenha() {
  const { resetPassword } = useApp()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get("token") ?? ""
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
    if (!token) {
      setError("Link inválido.")
      return
    }
    setBusy(true)
    const err = await resetPassword(token, password)
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    navigate("/login")
  }

  return (
    <AuthShell>
      <h1 className="mt-6 font-display text-3xl font-extrabold">Nova senha</h1>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
        <PasswordField
          label="Nova senha"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <PasswordField
          label="Confirmar"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />
        {error && <p className="text-sm text-ember">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-ember py-3 text-sm font-bold text-on-accent disabled:opacity-60"
        >
          {busy ? "Salvando…" : "Salvar senha"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        <Link to="/login" className="font-semibold text-lime">
          Login
        </Link>
      </p>
    </AuthShell>
  )
}
