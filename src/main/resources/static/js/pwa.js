/* FitRadar PWA — registro SW, instalação e push (opt-in). */
(function () {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.FITRADAR_PWA = window.FITRADAR_PWA || { vapidPublicKey: "" };

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((reg) => {
      window.__fitradarSwReg = reg;
      initPushFlow(reg);
    }).catch(() => {
      /* Falha silenciosa — app continua como web normal. */
    });
  });

  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    showInstallBanner();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    hideBanner("pwa-install-banner");
    if (typeof FR !== "undefined") FR.toast("FitRadar instalado no seu celular!");
  });

  function showInstallBanner() {
    if (document.getElementById("pwa-install-banner") || localStorage.getItem("fitradar_pwa_install_dismissed")) {
      return;
    }
    const banner = document.createElement("div");
    banner.id = "pwa-install-banner";
    banner.className = "card pwa-banner";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Instalar aplicativo");
    banner.innerHTML =
      '<div class="grow"><strong>Instalar FitRadar</strong><div class="sub">Acesso rápido aos treinos no celular.</div></div>' +
      '<button type="button" class="btn-sm" id="pwa-install-btn">Instalar</button>' +
      '<button type="button" class="btn-ghost btn-sm" id="pwa-dismiss-btn" aria-label="Fechar">×</button>';
    document.body.appendChild(banner);

    document.getElementById("pwa-install-btn").onclick = async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      hideBanner("pwa-install-banner");
    };
    document.getElementById("pwa-dismiss-btn").onclick = () => {
      localStorage.setItem("fitradar_pwa_install_dismissed", "1");
      hideBanner("pwa-install-banner");
    };
  }

  function showPushBanner() {
    if (!("Notification" in window) || !("PushManager" in window)) return;
    if (Notification.permission !== "default") return;
    if (document.getElementById("pwa-push-banner") || localStorage.getItem("fitradar_push_dismissed")) return;

    const banner = document.createElement("div");
    banner.id = "pwa-push-banner";
    banner.className = "card pwa-banner";
    banner.style.bottom = "calc(5.5rem + env(safe-area-inset-bottom, 0))";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Ativar notificações");
    banner.innerHTML =
      '<div class="grow"><strong>Lembretes de treino</strong><div class="sub">Receba um toque quando for hora de voltar aos treinos.</div></div>' +
      '<button type="button" class="btn-sm" id="pwa-push-btn">Ativar</button>' +
      '<button type="button" class="btn-ghost btn-sm" id="pwa-push-dismiss" aria-label="Fechar">×</button>';
    document.body.appendChild(banner);

    document.getElementById("pwa-push-btn").onclick = async () => {
      const result = await Notification.requestPermission();
      hideBanner("pwa-push-banner");
      if (result === "granted") {
        await subscribeToPush(window.__fitradarSwReg);
        if (typeof FR !== "undefined") FR.toast("Notificações ativadas!");
      } else if (typeof FR !== "undefined") {
        FR.toast("Notificações não ativadas — você pode mudar isso nas configurações do navegador.", true);
      }
    };
    document.getElementById("pwa-push-dismiss").onclick = () => {
      localStorage.setItem("fitradar_push_dismissed", "1");
      hideBanner("pwa-push-banner");
    };
  }

  async function initPushFlow(registration) {
    if (!registration || !("PushManager" in window)) return;
    if (Notification.permission === "granted") {
      await subscribeToPush(registration);
      return;
    }
    setTimeout(showPushBanner, 2500);
  }

  async function subscribeToPush(registration) {
    const key = window.FITRADAR_PWA.vapidPublicKey;
    if (!key || !registration) return;
    try {
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        localStorage.setItem("fitradar_push_subscription", JSON.stringify(existing.toJSON()));
        return existing;
      }
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      localStorage.setItem("fitradar_push_subscription", JSON.stringify(sub.toJSON()));
      return sub;
    } catch (_) {
      /* VAPID ausente ou inválido — fluxo de permissão ainda funciona para testes locais. */
    }
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }

  function hideBanner(id) {
    const banner = document.getElementById(id);
    if (banner) banner.remove();
  }
})();
