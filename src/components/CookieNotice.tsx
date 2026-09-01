import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

const KEY = "runclub.lgpd.ok"

export function CookieNotice() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(localStorage.getItem(KEY) !== "1")
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg">
      <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-xs leading-relaxed text-sand">
          Usamos armazenamento local só para manter sua sessão, preferências e dados do grupo no
          aparelho. Ao continuar, você concorda com a{" "}
          <Link to="/privacidade" className="font-semibold text-lime">
            Política de Privacidade
          </Link>{" "}
          (LGPD).
        </p>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(KEY, "1")
            setOpen(false)
          }}
          className="rounded-xl bg-ember px-4 py-2 text-xs font-bold text-on-accent"
        >
          Entendi
        </button>
      </div>
    </div>
  )
}
