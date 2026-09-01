self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open("plasts-run-v2").then((cache) => cache.addAll(["/logo-plasts-run.png"])))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== "plasts-run-v2").map((k) => caches.delete(k)))).then(() => self.clients.claim()),
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
