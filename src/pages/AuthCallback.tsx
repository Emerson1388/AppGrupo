import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AuthShell } from "../components/AuthShell"
import { supabase } from "../lib/supabase"

export function AuthCallback() {
  const navigate = useNavigate()
  const [msg, setMsg] = useState("Confirmando sessão…")

  useEffect(() => {
    if (!supabase) {
      setMsg("Supabase não configurado.")
      return
    }
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        setMsg("Não foi possível confirmar o e-mail. Tente entrar de novo.")
        return
      }
      setMsg("E-mail confirmado. Entrando…")
      navigate("/", { replace: true })
    })
  }, [navigate])

  return (
    <AuthShell>
      <h1 className="mt-6 font-display text-3xl font-extrabold">Confirmação</h1>
      <p className="mt-3 text-sand">{msg}</p>
      <Link to="/login" className="mt-8 inline-block text-sm font-semibold text-lime">
        Login
      </Link>
    </AuthShell>
  )
}
