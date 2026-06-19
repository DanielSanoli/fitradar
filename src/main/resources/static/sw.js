/* FitRadar PWA — service worker (cache shell; push fica para fase posterior). */
const CACHE = "fitradar-student-v1";

const PRECACHE = [
  "/student.html",
  "/offline.html",
  "/css/app.css",
  "/js/api.js",
  "/js/student.js",
  "/js/pwa.js",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-maskable.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});

/* Push: handler configurado — ative VAPID no servidor quando as chaves estiverem disponíveis. */
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "FitRadar", body: "Nova notificação" };
  event.waitUntil(
    self.registration.showNotification(data.title || "FitRadar", {
      body: data.body || "",
      icon: "/icons/icon.svg",
      badge: "/icons/icon.svg",
      data: data.url ? { url: data.url } : {},
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/student.html";
  event.waitUntil(clients.openWindow(url));
});
