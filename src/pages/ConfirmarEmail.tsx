import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useApp } from "../context/AppContext"
import { AuthShell } from "../components/AuthShell"

export function ConfirmarEmail() {
  const { confirmEmail } = useApp()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [msg, setMsg] = useState("Validando link…")
  const ran = useRef(false)
  const token = params.get("token")

  useEffect(() => {
    if (ran.current) return
    if (!token) {
      setMsg("Link incompleto.")
      return
    }
    ran.current = true
    const err = confirmEmail(token)
    if (err) {
      setMsg(err)
      return
    }
    setMsg("E-mail confirmado. Você já é membro do grupo.")
    const t = window.setTimeout(() => navigate("/", { replace: true }), 1200)
    return () => window.clearTimeout(t)
  }, [token, confirmEmail, navigate])

  return (
    <AuthShell>
      <h1 className="mt-6 font-display text-3xl font-extrabold">Confirmação</h1>
      <p className="mt-3 text-sand">{msg}</p>
      <Link to="/login" className="mt-8 inline-block text-sm font-semibold text-lime">
        Ir para o login
      </Link>
    </AuthShell>
  )
}
