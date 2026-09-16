const CACHE = "appgrupo-v4"
const SHELL = ["/logo-plasts-run.png", "/avatar-default.svg"]

function shouldBypass(request) {
  const url = new URL(request.url)
  if (url.protocol !== "http:" && url.protocol !== "https:") return true
  if (url.hostname.includes("supabase.co")) return true
  if (url.pathname.includes("/storage/")) return true
  if (url.pathname.includes("/rest/v1/")) return true
  if (url.pathname.includes("/auth/v1/")) return true
  if (request.destination === "image") return true
  return false
}

self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return
  if (shouldBypass(event.request)) return
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request))
    return
  }
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request)
      if (cached) return cached
      return new Response("", { status: 504, statusText: "Offline" })
    }),
  )
})
