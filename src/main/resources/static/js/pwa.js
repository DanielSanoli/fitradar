/* Registro do service worker e prompt de instalação (PWA aluno). */
(function () {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* Falha silenciosa — app continua funcionando como web normal. */
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
    hideInstallBanner();
  });

  function showInstallBanner() {
    if (document.getElementById("pwa-install-banner")) {
      return;
    }
    const banner = document.createElement("div");
    banner.id = "pwa-install-banner";
    banner.className = "card";
    banner.style.cssText =
      "position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);z-index:50;" +
      "max-width:420px;width:calc(100% - 2rem);display:flex;gap:.6rem;align-items:center;";
    banner.innerHTML =
      '<div class="grow"><strong>Instalar FitRadar</strong><div class="sub muted">Acesso rápido aos treinos no celular.</div></div>' +
      '<button class="btn-sm" id="pwa-install-btn">Instalar</button>' +
      '<button class="btn-ghost btn-sm" id="pwa-dismiss-btn">×</button>';
    document.body.appendChild(banner);

    document.getElementById("pwa-install-btn").onclick = async () => {
      if (!deferredPrompt) {
        return;
      }
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      hideInstallBanner();
    };
    document.getElementById("pwa-dismiss-btn").onclick = hideInstallBanner;
  }

  function hideInstallBanner() {
    const banner = document.getElementById("pwa-install-banner");
    if (banner) {
      banner.remove();
    }
  }
})();
