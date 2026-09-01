import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Share2, Smartphone } from "lucide-react"
import { isPhone, isStandalone, phoneUrl } from "../lib/pwa"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PhoneAccess({ compact = false }: { compact?: boolean }) {
  const [url] = useState(() => phoneUrl("/g/plasts-run"))
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const phone = isPhone()
  const installed = isStandalone()

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    return () => window.removeEventListener("beforeinstallprompt", onPrompt)
  }, [])

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Plast's Run",
          text: "Entre no grupo Plast's Run",
          url,
        })
        return
      }
      await navigator.clipboard.writeText(url)
      setHint("Link copiado. Cole no WhatsApp do celular.")
    } catch {
      setHint(null)
    }
  }

  async function install() {
    if (installEvent) {
      await installEvent.prompt()
      const choice = await installEvent.userChoice
      if (choice.outcome === "accepted") setInstallEvent(null)
      return
    }
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      setHint("No iPhone: toque em Compartilhar e depois em Adicionar à Tela de Início.")
      return
    }
    setHint("No Chrome: menu ⋮ → Instalar app ou Adicionar à tela inicial.")
  }

  if (installed) return null

  return (
    <div className={`rounded-3xl border border-line bg-card ${compact ? "p-3" : "p-5"}`}>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        <Smartphone size={14} />
        No celular
      </p>
      {!phone && (
        <div className="mt-3 flex flex-col items-center">
          <div className="rounded-2xl bg-white p-3">
            <QRCodeSVG value={url} size={compact ? 132 : 168} />
          </div>
          <p className="mt-3 text-center text-xs text-sand">
            Mesma rede Wi-Fi. Aponte a câmera para o QR — não precisa digitar o link.
          </p>
          <p className="mt-1 break-all text-center font-mono text-[10px] text-muted">{url}</p>
        </div>
      )}
      {phone && (
        <p className="mt-2 text-sm text-sand">
          Instale na tela inicial e abra pelo ícone, sem voltar no navegador.
        </p>
      )}
      <div className={`mt-3 grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-2"}`}>
        <button
          type="button"
          onClick={() => void share()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-xs font-bold"
        >
          <Share2 size={14} />
          Enviar no celular
        </button>
        <button
          type="button"
          onClick={() => void install()}
          className="rounded-xl bg-ember py-2.5 text-xs font-bold text-on-accent"
        >
          Instalar app
        </button>
      </div>
      {hint && <p className="mt-2 text-xs text-lime">{hint}</p>}
    </div>
  )
}
