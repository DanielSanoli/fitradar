// Cliente de API compartilhado do FitRadar.
const FR = (() => {
  const TOKEN = "fitradar_token";
  const REFRESH = "fitradar_refresh";
  const USER = "fitradar_user";

  let sessionRedirecting = false;

  function setAuth(auth) {
    if (!auth) return;
    if (auth.token) localStorage.setItem(TOKEN, auth.token);
    if (auth.refreshToken) localStorage.setItem(REFRESH, auth.refreshToken);
    if (auth.user) localStorage.setItem(USER, JSON.stringify(auth.user));
  }

  function updateStoredUser(nextUser) {
    if (!nextUser) return;
    localStorage.setItem(USER, JSON.stringify(nextUser));
  }

  function clearAuth() {
    localStorage.removeItem(TOKEN);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(USER);
  }

  function token() { return localStorage.getItem(TOKEN); }
  function refreshToken() { return localStorage.getItem(REFRESH); }
  function user() {
    const raw = localStorage.getItem(USER);
    return raw ? JSON.parse(raw) : null;
  }

  function redirectToLogin(message) {
    if (sessionRedirecting) return;
    sessionRedirecting = true;
    clearAuth();
    toast(message || "Sessão expirada. Entre novamente.", true);
    window.setTimeout(() => { location.href = "/"; }, 400);
  }

  function parseResponseBody(text) {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  function apiErrorMessage(status, data) {
    if (data && (data.message || data.error)) return data.message || data.error;
    if (status === 401) return "Sessão expirada. Faça login novamente.";
    if (status === 402) return "Assinatura necessária para acessar este recurso.";
    return "Erro " + status;
  }

  async function rawRequest(method, path, body, withAuth) {
    const headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (withAuth && token()) headers.Authorization = "Bearer " + token();
    const res = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return res;
  }

  async function tryRefresh() {
    const rt = refreshToken();
    if (!rt) return false;
    const res = await rawRequest("POST", "/api/v1/auth/refresh", { refreshToken: rt }, false);
    if (!res.ok) return false;
    const data = parseResponseBody(await res.text());
    if (!data) return false;
    setAuth(data);
    return true;
  }

  async function request(method, path, body) {
    let res = await rawRequest(method, path, body, true);
    if (res.status === 401 && (await tryRefresh())) {
      res = await rawRequest(method, path, body, true);
    }

    if (res.status === 204) return null;

    const text = await res.text();
    const data = parseResponseBody(text);

    if (res.status === 401) {
      redirectToLogin(apiErrorMessage(401, data));
      const err = new Error("Sessão expirada. Faça login novamente.");
      err.status = 401;
      throw err;
    }

    if (!res.ok) {
      const message = apiErrorMessage(res.status, data);
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  }

  /** Valida JWT com o servidor e atualiza o usuário em cache. */
  async function validateSession() {
    const res = await rawRequest("GET", "/api/v1/auth/me", undefined, true);
    if (res.status === 401) {
      if (await tryRefresh()) return validateSession();
      redirectToLogin("Sessão expirada. Entre novamente.");
      return null;
    }
    const text = await res.text();
    const data = parseResponseBody(text);
    if (!res.ok) {
      const err = new Error(apiErrorMessage(res.status, data));
      err.status = res.status;
      throw err;
    }
    updateStoredUser(data);
    return data;
  }

  const get = (p) => request("GET", p);
  const post = (p, b) => request("POST", p, b);
  const put = (p, b) => request("PUT", p, b);
  const del = (p) => request("DELETE", p);

  const login = (email, password) =>
    rawRequest("POST", "/api/v1/auth/login", { email, password }, false).then(handleAuth);
  const register = (name, email, password) =>
    rawRequest("POST", "/api/v1/auth/register", { name, email, password }, false).then(handleAuth);

  async function handleAuth(res) {
    const text = await res.text();
    const data = parseResponseBody(text);
    if (!res.ok) throw new Error((data && data.message) || "Falha na autenticação");
    setAuth(data);
    return data;
  }

  function requireRole(role, loginPage) {
    const u = user();
    if (!u || !token()) { location.href = loginPage; return null; }
    if (role && u.role !== role) { location.href = loginPage; return null; }
    return u;
  }

  function logout(redirect) {
    clearAuth();
    location.href = redirect || "/";
  }

  function toast(message, isError) {
    let el = document.getElementById("toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; document.body.appendChild(el); }
    el.textContent = message;
    el.className = "show" + (isError ? " error" : "");
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.className = ""; }, 3200);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function setPanelLoading(elOrId, rows) {
    if (typeof FRUI !== "undefined") FRUI.setLoading(elOrId, { rows: rows || 3 });
  }

  function setPanelEmpty(elOrId, message) {
    if (typeof FRUI !== "undefined") FRUI.setEmpty(elOrId, { message });
    else {
      const el = typeof elOrId === "string" ? document.getElementById(elOrId) : elOrId;
      if (el) el.innerHTML = `<div class="panel-empty">${esc(message || "Nada por aqui ainda.")}</div>`;
    }
  }

  function setPanelError(elOrId, message, onRetry) {
    if (typeof FRUI !== "undefined") FRUI.setError(elOrId, { message, onRetry });
    else {
      const el = typeof elOrId === "string" ? document.getElementById(elOrId) : elOrId;
      if (el) el.innerHTML = `<div class="panel-error">${esc(message || "Erro ao carregar.")}</div>`;
    }
  }

  let loadingCount = 0;
  function showLoading(on) {
    let el = document.getElementById("global-loading");
    if (!el) {
      el = document.createElement("div");
      el.id = "global-loading";
      el.innerHTML = '<div class="spinner" role="status" aria-label="Carregando"></div>';
      document.body.appendChild(el);
    }
    loadingCount = Math.max(0, loadingCount + (on ? 1 : -1));
    el.classList.toggle("show", loadingCount > 0);
  }

  async function pageContent(path) {
    const data = await get(path);
    if (data && Array.isArray(data.content)) return data.content;
    if (Array.isArray(data)) return data;
    return [];
  }

  return {
    setAuth, clearAuth, updateStoredUser, token, user, request, get, post, put, del, pageContent,
    login, register, requireRole, logout, validateSession, toast, esc,
    setPanelLoading, setPanelEmpty, setPanelError, showLoading,
  };
})();

if (typeof globalThis !== "undefined") {
  globalThis.FR = FR;
}
