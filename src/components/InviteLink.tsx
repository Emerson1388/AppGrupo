import { useState } from "react"
import { useApp } from "../context/AppContext"

export function InviteLink() {
  const { data } = useApp()
  const [ok, setOk] = useState(false)
  const url = `${window.location.origin}/g/${data.grupo.slug}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setOk(true)
      window.setTimeout(() => setOk(false), 2000)
    } catch {
      setOk(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="w-full rounded-xl border border-line bg-card px-3 py-2 text-left text-xs"
    >
      <p className="font-semibold text-muted">Link do grupo</p>
      <p className="truncate font-mono text-sand">{url}</p>
      <p className="mt-1 font-bold text-ember">{ok ? "Copiado" : "Copiar convite"}</p>
    </button>
  )
}
