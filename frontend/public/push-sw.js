self.addEventListener("push", (event) => {
  let data = { title: "FitRadar", body: "Hora de voltar aos treinos!", url: "/student" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {
    /* payload texto */
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "FitRadar", {
      body: data.body || "",
      icon: "/icons/icon.svg",
      badge: "/icons/icon.svg",
      tag: data.tag || "fitradar-nudge",
      renotify: true,
      data: { url: data.url || "/student" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/student";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    }),
  );
});
