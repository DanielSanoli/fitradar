/**
 * Componentes reutilizáveis de UI — loading (skeleton), vazio com CTA, erro com retry.
 */
const FRUI = (() => {
  function el(target) {
    return typeof target === "string" ? document.getElementById(target) : target;
  }

  function skeletonHtml(rows, variant) {
    const n = rows || 3;
    const cls = variant === "stat" ? "skeleton skeleton-stat" : variant === "card" ? "skeleton skeleton-card" : "skeleton";
    return Array.from({ length: n }, () => `<div class="${cls}"></div>`).join("");
  }

  function emptyHtml({ icon, title, message, actionLabel, actionId, actionClass }) {
    const btn = actionLabel && actionId
      ? `<button type="button" class="${actionClass || "btn-sm"}" id="${actionId}" style="margin-top:.85rem">${FR.esc(actionLabel)}</button>`
      : "";
    return `<div class="panel-state panel-empty" role="status">
      ${icon ? `<div class="panel-state-icon" aria-hidden="true">${icon}</div>` : ""}
      ${title ? `<p class="panel-state-title">${FR.esc(title)}</p>` : ""}
      <p class="panel-state-message">${FR.esc(message || "Nada por aqui ainda.")}</p>
      ${btn}
    </div>`;
  }

  function errorHtml({ message, retryId }) {
    const retryBtn = retryId
      ? `<button type="button" class="btn-ghost btn-sm" id="${retryId}" style="margin-top:.85rem">Tentar novamente</button>`
      : "";
    return `<div class="panel-state panel-error" role="alert">
      <p class="panel-state-title">Não foi possível carregar</p>
      <p class="panel-state-message">${FR.esc(message || "Erro ao carregar.")}</p>
      ${retryBtn}
    </div>`;
  }

  function setLoading(target, opts) {
    const node = el(target);
    if (!node) return;
    const rows = (opts && opts.rows) || 3;
    const variant = opts && opts.variant;
    node.innerHTML = skeletonHtml(rows, variant);
    node.setAttribute("aria-busy", "true");
  }

  function setEmpty(target, opts) {
    const node = el(target);
    if (!node) return;
    node.innerHTML = emptyHtml(opts || {});
    node.removeAttribute("aria-busy");
    if (opts && opts.actionId && opts.onAction) {
      const btn = node.querySelector("#" + opts.actionId);
      if (btn) btn.addEventListener("click", opts.onAction);
    }
  }

  function setError(target, opts) {
    const node = el(target);
    if (!node) return;
    const retryId = (opts && opts.retryId) || ("retry-" + Math.random().toString(36).slice(2, 9));
    node.innerHTML = errorHtml({ message: opts && opts.message, retryId });
    node.removeAttribute("aria-busy");
    if (opts && opts.onRetry) {
      const btn = node.querySelector("#" + retryId);
      if (btn) btn.addEventListener("click", opts.onRetry);
    }
  }

  function setContent(target, html) {
    const node = el(target);
    if (!node) return;
    node.innerHTML = html;
    node.removeAttribute("aria-busy");
  }

  function buttonLoading(button, loading, loadingText) {
    const btn = el(button);
    if (!btn) return;
    if (loading) {
      if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
      btn.disabled = true;
      btn.classList.add("is-loading");
      btn.setAttribute("aria-busy", "true");
      if (loadingText) btn.textContent = loadingText;
    } else {
      btn.disabled = false;
      btn.classList.remove("is-loading");
      btn.removeAttribute("aria-busy");
      if (btn.dataset.originalText) {
        btn.textContent = btn.dataset.originalText;
        delete btn.dataset.originalText;
      }
    }
  }

  function openModal(html, options) {
    const modal = document.getElementById("modal");
    const card = document.getElementById("modal-card");
    if (!modal || !card) return;
    card.innerHTML = html;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    if (options && options.label) {
      card.setAttribute("role", "dialog");
      card.setAttribute("aria-modal", "true");
      card.setAttribute("aria-label", options.label);
    }
    const focusable = card.querySelector("input, button, select, textarea, [tabindex]");
    if (focusable) focusable.focus();
    document.body.classList.add("modal-open");
  }

  function closeModal() {
    const modal = document.getElementById("modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function confirmAction(message, confirmLabel) {
    return window.confirm(message || "Tem certeza?");
  }

  return {
    skeletonHtml,
    emptyHtml,
    errorHtml,
    setLoading,
    setEmpty,
    setError,
    setContent,
    buttonLoading,
    openModal,
    closeModal,
    confirmAction,
  };
})();

if (typeof globalThis !== "undefined") {
  globalThis.FRUI = FRUI;
}
