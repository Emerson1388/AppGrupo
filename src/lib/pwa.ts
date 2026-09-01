export function phoneUrl(path = "/g/plasts-run") {
  if (typeof window === "undefined") return path
  const host = window.location.hostname
  let origin = window.location.origin
  if (host === "localhost" || host === "127.0.0.1") {
    try {
      if (typeof __LAN_ORIGIN__ === "string" && __LAN_ORIGIN__) origin = __LAN_ORIGIN__
    } catch {
      /* Vite define ausente — usa o origin atual */
    }
  }
  return `${origin}${path}`
}

export function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

export function isPhone() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export function registerSW() {
  if (!("serviceWorker" in navigator)) return
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined)
  })
}
