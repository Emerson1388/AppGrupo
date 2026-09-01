import { useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useApp } from "../context/AppContext"
import { Logo } from "../components/Logo"

export function CheckinQr() {
  const { token } = useParams()
  const { checkinByToken, data } = useApp()
  const ran = useRef(false)
  const [msg, setMsg] = useState("Validando QR…")

  useEffect(() => {
    if (!token || ran.current) return
    ran.current = true
    const err = checkinByToken(token)
    const treino = data.treinos.find((t) => t.qrToken === token)
    setMsg(err ?? `Presença confirmada${treino ? ` em ${treino.titulo}` : ""}.`)
  }, [token, checkinByToken, data.treinos])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-bg px-6 text-center text-ink">
      <Logo className="mx-auto h-20 w-auto" />
      <p className="mt-6 font-display text-3xl font-extrabold">Check-in</p>
      <p className="mt-3 max-w-sm text-sand">{msg}</p>
      <Link to="/agenda" className="mt-8 rounded-full bg-ember px-5 py-2 text-sm font-bold text-on-accent">
        Ver agenda
      </Link>
    </div>
  )
}
