self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open("appgrupo-v3").then((cache) => cache.addAll(["/logo-plasts-run.png"])))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== "appgrupo-v3").map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request))
    return
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((cached) => cached || caches.match("/logo-plasts-run.png"))),
  )
})
