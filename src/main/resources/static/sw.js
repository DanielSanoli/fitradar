/* FitRadar PWA — cache shell + offline + push. */
const CACHE = "fitradar-student-v2";

const PRECACHE = [
  "/student.html",
  "/offline.html",
  "/css/app.css",
  "/js/api.js",
  "/js/ui.js",
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
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ message: "Sem conexão — tente novamente online." }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
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
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => {
        if (request.destination === "document") {
          return caches.match("/offline.html");
        }
        return new Response("", { status: 503 });
      });
    })
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "FitRadar", body: "Hora de voltar aos treinos!" };
  try {
    if (event.data) data = event.data.json();
  } catch (_) { /* payload texto simples */ }
  event.waitUntil(
    self.registration.showNotification(data.title || "FitRadar", {
      body: data.body || "",
      icon: "/icons/icon.svg",
      badge: "/icons/icon.svg",
      tag: data.tag || "fitradar-nudge",
      renotify: true,
      data: data.url ? { url: data.url } : { url: "/student.html" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/student.html";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes("student.html") && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
