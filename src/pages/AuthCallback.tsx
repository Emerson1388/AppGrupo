import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import type { Session } from "@supabase/supabase-js"
import { AuthShell } from "../components/AuthShell"
import { supabase } from "../lib/supabase"

export function AuthCallback() {
  const navigate = useNavigate()
  const [msg, setMsg] = useState("Confirmando sessão…")

  useEffect(() => {
    if (!supabase) {
      setMsg("Não foi possível confirmar o e-mail. Tente entrar de novo.")
      return
    }
    const client = supabase
    let cancel = false

    async function finish() {
      const url = new URL(window.location.href)
      let session: Session | null = (await client.auth.getSession()).data.session

      if (!session) {
        const code = url.searchParams.get("code")
        if (code) {
          const { data, error } = await client.auth.exchangeCodeForSession(code)
          if (!error) session = data.session
        }
      }

      if (!session) {
        session = await new Promise<Session | null>((resolve) => {
          let timer = 0
          const { data } = client.auth.onAuthStateChange((_event, next) => {
            if (!next) return
            window.clearTimeout(timer)
            data.subscription.unsubscribe()
            resolve(next)
          })
          timer = window.setTimeout(() => {
            data.subscription.unsubscribe()
            resolve(null)
          }, 2500)
        })
      }

      if (cancel) return
      if (!session) {
        setMsg("Não foi possível confirmar o e-mail. Tente entrar com o mesmo e-mail e senha.")
        return
      }
      const hash = window.location.hash
      if (hash.includes("type=recovery") || url.searchParams.get("type") === "recovery") {
        navigate("/redefinir-senha", { replace: true })
        return
      }
      setMsg("E-mail confirmado. Entrando…")
      navigate("/", { replace: true })
    }

    void finish()
    return () => {
      cancel = true
    }
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
