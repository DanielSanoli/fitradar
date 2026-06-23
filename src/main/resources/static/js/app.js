// Painel do criador.
let me = null;

async function bootstrapCreator() {
  me = FR.requireRole("CREATOR", "/");
  if (!me) return;

  try {
    me = await FR.validateSession();
    if (!me) return;
  } catch (e) {
    FR.toast(e.message || "Erro ao validar sessão.", true);
    return;
  }

  document.getElementById("who").textContent = me.name;
  document.getElementById("logout").onclick = () => FR.logout("/");
  initTabs();
  renderAccessBanner();
  loadRetention();
  loadStudents();
  loadPrograms();
  loadLeaderboard();
  loadMarketplace();
  loadSpace();
  initMarketplaceForm();
  initOnboarding();
  FRRadar.init("CREATOR");
  const openRadar = document.getElementById("open-radar-widget");
  if (openRadar) openRadar.onclick = () => FRRadar.open();
}

bootstrapCreator();

function panelLoadError(e, targetId, retryFn) {
  if (e.status === 401) return;
  if (e.status === 402) {
    renderAccessBanner();
    FR.setPanelError(targetId, e.message, retryFn);
    return;
  }
  FR.setPanelError(targetId, e.message, retryFn);
}

async function initOnboarding() {
  if (localStorage.getItem("fitradar_onboarding_done")) return;
  try {
    const status = await FR.get("/api/v1/onboarding/status");
    if (status.onboardingComplete) {
      localStorage.setItem("fitradar_onboarding_done", "1");
      return;
    }
    const banner = document.createElement("div");
    banner.id = "onboarding-banner";
    banner.className = "card onboarding-banner";
    banner.innerHTML = `
      <h2 style="margin:0">Primeiros passos</h2>
      <p class="muted">Configure seu espaço, crie um programa e convide seu primeiro aluno.</p>
      <div class="onboarding-steps">
        <span class="onboarding-step ${status.hasSpace ? "done" : ""}">1. Espaço</span>
        <span class="onboarding-step ${status.hasProgram ? "done" : ""}">2. Programa</span>
        <span class="onboarding-step ${status.hasStudent ? "done" : ""}">3. Aluno</span>
      </div>
      <div class="row">
        ${status.demoSeedAvailable ? '<button class="btn-ghost btn-sm" id="demo-seed">Ver demo preenchido</button>' : ""}
        <button class="btn-ghost btn-sm" id="dismiss-onboarding">Entendi</button>
      </div>`;
    document.querySelector(".container").prepend(banner);
    const demoBtn = document.getElementById("demo-seed");
    if (demoBtn) {
      demoBtn.onclick = async () => {
        try {
          FR.showLoading(true);
          await FR.post("/api/v1/onboarding/demo-seed");
          FR.toast("Demo criado — explore em Programas");
          banner.remove();
          loadPrograms();
        } catch (e) { FR.toast(e.message, true); }
        finally { FR.showLoading(false); }
      };
    }
    document.getElementById("dismiss-onboarding").onclick = () => {
      localStorage.setItem("fitradar_onboarding_done", "1");
      banner.remove();
    };
  } catch (_) { /* onboarding opcional */ }
}

function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((t) => {
    t.onclick = () => {
      tabs.forEach((x) => {
        x.classList.remove("active");
        x.setAttribute("aria-selected", "false");
      });
      t.classList.add("active");
      t.setAttribute("aria-selected", "true");
      ["retention", "students", "programs", "ranking", "marketplace", "space"].forEach((name) => {
        document.getElementById("tab-" + name).classList.toggle("hidden", name !== t.dataset.tab);
      });
    };
  });
}

function renderAccessBanner() {
  const u = FR.user();
  if (!u || u.accessAllowed) return;
  const el = document.getElementById("access-banner");
  el.classList.remove("hidden");
  el.innerHTML = `<strong>${FR.esc(u.accessMessage || "Sua assinatura precisa de atenção.")}</strong>
    <div style="margin-top:.6rem"><button class="btn-sm" id="upgrade">Assinar o Pro</button></div>`;
  document.getElementById("upgrade").onclick = async () => {
    try {
      const r = await FR.post("/api/v1/billing/checkout/pro");
      if (r && r.checkoutUrl && isAllowedCheckoutUrl(r.checkoutUrl)) {
        location.href = r.checkoutUrl;
      } else FR.toast("Checkout indisponível ou URL inválida.", true);
    } catch (e) { FR.toast(e.message, true); }
  };
}

function isAllowedCheckoutUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return host === "asaas.com" || host.endsWith(".asaas.com");
  } catch {
    return false;
  }
}

/* ----------------------------- Retenção ----------------------------- */
async function loadRetention() {
  FR.setPanelLoading("overview-stats", 5);
  FR.setPanelLoading("at-risk", 4);
  FR.setPanelLoading("alerts", 3);
  try {
    const ov = await FR.get("/api/v1/retention/overview");
    const adh = ov.avgAdherence != null ? ov.avgAdherence + "%" : "—";
    document.getElementById("overview-stats").innerHTML = `
      ${stat(ov.activeStudents, "Alunos ativos")}
      ${stat(adh, "Aderência média")}
      ${stat(ov.atRiskCount, "Em risco")}
      ${stat(ov.checkInsThisWeek, "Check-ins na semana")}
      ${stat(ov.newStudentsThisWeek, "Novos na semana")}`;
  } catch (e) { panelLoadError(e, "overview-stats", loadRetention); }

  try {
    const risk = await FR.get("/api/v1/retention/students-at-risk?minLevel=MEDIUM");
    if (!risk.length) {
      FRUI.setEmpty("at-risk", {
        icon: "🎉",
        title: "Comunidade saudável",
        message: "Nenhum aluno em risco médio ou alto no momento.",
      });
    } else FRUI.setContent("at-risk", risk.map((r) => `
      <div class="item">
        <div class="grow">
          <div class="title">${FR.esc(r.studentName)} <span class="badge ${r.level}">${r.level}</span></div>
          <div class="sub">${FR.esc((r.assumptions || []).join(" · "))}</div>
          <div class="bar" style="margin-top:.45rem"><span style="width:${r.score}%"></span></div>
        </div>
        <button class="btn-ghost btn-sm" onclick="genNudge('${r.studentId}')">Gerar nudge</button>
      </div>`).join(""));
  } catch (e) { panelLoadError(e, "at-risk", () => loadRetention()); }

  loadAlerts();
}

async function loadAlerts() {
  try {
    const alerts = await FR.pageContent("/api/v1/retention/alerts");
    const box = document.getElementById("alerts");
    if (!alerts.length) {
      FRUI.setEmpty("alerts", {
        icon: "🔔",
        title: "Sem alertas",
        message: "Quando o Radar detectar algo, os alertas aparecem aqui.",
      });
      return;
    }
    FRUI.setContent("alerts", alerts.map((a) => `
      <div class="item" style="${a.read ? 'opacity:.55' : ''}">
        <div class="grow">
          <div class="title"><span class="badge ${a.severity}">${a.severity}</span> ${FR.esc(a.message)}</div>
          <div class="sub">${FR.esc(a.actionSuggestion || "")}</div>
        </div>
        ${a.read ? "" : `<button class="btn-ghost btn-sm" onclick="markRead('${a.id}')">Marcar lido</button>`}
      </div>`).join(""));
  } catch (e) { panelLoadError(e, "alerts", loadAlerts); }
}

async function markRead(id) {
  try { await FR.post(`/api/v1/retention/alerts/${id}/read`); loadAlerts(); }
  catch (e) { FR.toast(e.message, true); }
}

document.getElementById("evaluate").onclick = async () => {
  try { await FR.post("/api/v1/retention/evaluate"); FR.toast("Regras reavaliadas"); loadAlerts(); }
  catch (e) { FR.toast(e.message, true); }
};

async function genNudge(studentId) {
  try {
    const n = await FR.post(`/api/v1/copilot/nudge/${studentId}`);
    openModal(`<h2>Nudge para ${FR.esc(n.studentName)}</h2>
      <textarea id="nudge-text" style="min-height:150px">${FR.esc(n.message)}</textarea>
      <p class="muted" style="font-size:.8rem">${FR.esc((n.assumptions || []).join(" · "))}</p>
      <div class="row"><button class="grow" id="copy-nudge">Copiar mensagem</button>
      <button class="btn-ghost" onclick="closeModal()">Fechar</button></div>`);
    document.getElementById("copy-nudge").onclick = () => {
      navigator.clipboard.writeText(document.getElementById("nudge-text").value).then(() => FR.toast("Copiado!"));
    };
  } catch (e) { FR.toast(e.message, true); }
}

function stat(value, label) {
  return `<div class="stat"><div class="value">${FR.esc(value)}</div><div class="label">${FR.esc(label)}</div></div>`;
}

/* ----------------------------- Alunos ----------------------------- */
let programCache = [];

async function loadStudents() {
  FRUI.setLoading("students", { rows: 4, variant: "card" });
  try {
    const students = await FR.pageContent("/api/v1/students");
    if (!students.length) {
      FRUI.setEmpty("students", {
        icon: "👥",
        title: "Nenhum aluno ainda",
        message: "Convide seu primeiro aluno para acompanhar aderência e risco de churn.",
        actionLabel: "+ Convidar aluno",
        actionId: "empty-invite-student",
        onAction: () => document.getElementById("add-student").click(),
      });
      return;
    }
    FRUI.setContent("students", students.map((s) => `
      <div class="item">
        <div class="grow"><div class="title">${FR.esc(s.name)}</div><div class="sub">${FR.esc(s.email)}</div></div>
        <button class="btn-ghost btn-sm" onclick="manageEnroll('${s.id}','${FR.esc(s.name)}')">Matrículas</button>
      </div>`).join(""));
  } catch (e) { FRUI.setError("students", { message: e.message, onRetry: loadStudents }); }
}

document.getElementById("add-student").onclick = () => {
  openModal(`<h2>Convidar aluno</h2>
    <form id="invite-form">
      <label>Nome</label><input id="inv-name" required />
      <label>E-mail</label><input id="inv-email" type="email" required />
      <div class="row"><button class="grow" type="submit">Convidar</button>
      <button type="button" class="btn-ghost" onclick="closeModal()">Cancelar</button></div>
    </form>`);
  document.getElementById("invite-form").onsubmit = async (e) => {
    e.preventDefault();
    try {
      const r = await FR.post("/api/v1/students", {
        name: document.getElementById("inv-name").value,
        email: document.getElementById("inv-email").value,
      });
      openModal(`<h2>Aluno convidado!</h2>
        <p>Repasse o acesso a <strong>${FR.esc(r.name)}</strong>:</p>
        <div class="item"><div class="grow"><div class="sub">E-mail</div><div class="title">${FR.esc(r.email)}</div></div></div>
        <div class="item" style="margin-top:.5rem"><div class="grow"><div class="sub">Senha temporária</div><div class="title">${FR.esc(r.temporaryPassword)}</div></div></div>
        <button style="margin-top:1rem" onclick="closeModal()">Pronto</button>`);
      loadStudents();
    } catch (err) { FR.toast(err.message, true); }
  };
};

async function manageEnroll(studentId, name) {
  await ensurePrograms();
  let enrollments = [];
  try { enrollments = await FR.get(`/api/v1/students/${studentId}/enrollments`); } catch (e) {}
  const options = programCache.map((p) => `<option value="${p.id}">${FR.esc(p.title)}</option>`).join("");
  openModal(`<h2>Matrículas — ${FR.esc(name)}</h2>
    <div class="list" id="enroll-list">${
      enrollments.length ? enrollments.map((en) => `
        <div class="item"><div class="grow"><div class="title">${FR.esc(en.programTitle)}</div>
        <div class="sub">${en.active ? "ativa" : "inativa"} · desde ${en.startDate || "—"}</div></div>
        ${en.active ? `<button class="btn-danger btn-sm" onclick="unenroll('${studentId}','${en.id}','${FR.esc(name)}')">Encerrar</button>` : ""}</div>`).join("")
      : `<p class="muted">Sem matrículas.</p>`
    }</div>
    <hr style="border-color:var(--border);margin:1rem 0" />
    <label>Matricular em um programa</label>
    <select id="enroll-program">${options || '<option value="">Crie um programa primeiro</option>'}</select>
    <div class="row"><button class="grow" id="do-enroll" ${programCache.length ? "" : "disabled"}>Matricular</button>
    <button class="btn-ghost" onclick="closeModal()">Fechar</button></div>`);
  const btn = document.getElementById("do-enroll");
  if (btn) btn.onclick = async () => {
    try {
      await FR.post(`/api/v1/students/${studentId}/enrollments`, { programId: document.getElementById("enroll-program").value });
      FR.toast("Aluno matriculado");
      manageEnroll(studentId, name);
    } catch (e) { FR.toast(e.message, true); }
  };
}

async function unenroll(studentId, enrollmentId, name) {
  try { await FR.del(`/api/v1/students/${studentId}/enrollments/${enrollmentId}`); FR.toast("Matrícula encerrada"); manageEnroll(studentId, name); }
  catch (e) { FR.toast(e.message, true); }
}

/* ----------------------------- Programas ----------------------------- */
async function ensurePrograms() {
  if (!programCache.length) {
    try { programCache = await FR.get("/api/v1/programs"); } catch (e) {}
  }
}

async function loadPrograms() {
  FRUI.setLoading("programs", { rows: 3, variant: "card" });
  try {
    programCache = await FR.get("/api/v1/programs");
    if (!programCache.length) {
      FRUI.setEmpty("programs", {
        icon: "📋",
        title: "Nenhum programa",
        message: "Crie seu primeiro programa de treinos para matricular alunos.",
        actionLabel: "+ Novo programa",
        actionId: "empty-add-program",
        onAction: () => document.getElementById("add-program").click(),
      });
      return;
    }
    FRUI.setContent("programs", programCache.map((p) => `
      <div class="card">
        <div class="row" style="align-items:center">
          <div class="grow"><div class="title">${FR.esc(p.title)} ${p.active ? "" : '<span class="badge MEDIUM">inativo</span>'}</div>
          <div class="sub">${FR.esc(p.description || "")} · ${p.workoutCount} treino(s) · ${priceLabel(p)}</div></div>
          <button class="btn-ghost btn-sm" onclick="toggleWorkouts('${p.id}')">Treinos</button>
          <button class="btn-danger btn-sm" onclick="delProgram('${p.id}')">Excluir</button>
        </div>
        <div id="workouts-${p.id}" class="list hidden" style="margin-top:.8rem"></div>
      </div>`).join(""));
  } catch (e) { FRUI.setError("programs", { message: e.message, onRetry: loadPrograms }); }
}

document.getElementById("add-program").onclick = () => {
  openModal(`<h2>Novo programa</h2>
    <form id="prog-form">
      <label>Título</label><input id="prog-title" required />
      <label>Descrição</label><textarea id="prog-desc"></textarea>
      <label>Preço (R$ — vazio = gratuito)</label><input id="prog-price" type="number" min="0" step="0.01" placeholder="0.00" />
      <div class="row"><button class="grow" type="submit">Criar</button>
      <button type="button" class="btn-ghost" onclick="closeModal()">Cancelar</button></div>
    </form>`);
  document.getElementById("prog-form").onsubmit = async (e) => {
    e.preventDefault();
    try {
      const priceRaw = document.getElementById("prog-price").value;
      const price = priceRaw ? parseFloat(priceRaw) : null;
      await FR.post("/api/v1/programs", {
        title: document.getElementById("prog-title").value,
        description: document.getElementById("prog-desc").value,
        active: true,
        price: price && price > 0 ? price : null,
      });
      closeModal(); FR.toast("Programa criado"); loadPrograms();
    } catch (err) { FR.toast(err.message, true); }
  };
};

async function delProgram(id) {
  if (!FRUI.confirmAction("Excluir este programa e todos os treinos? Essa ação não pode ser desfeita.")) return;
  try { await FR.del(`/api/v1/programs/${id}`); FR.toast("Programa excluído"); loadPrograms(); }
  catch (e) { FR.toast(e.message, true); }
}

async function toggleWorkouts(programId) {
  const box = document.getElementById("workouts-" + programId);
  if (!box.classList.contains("hidden")) { box.classList.add("hidden"); return; }
  box.classList.remove("hidden");
  await renderWorkouts(programId);
}

async function renderWorkouts(programId) {
  const box = document.getElementById("workouts-" + programId);
  try {
    const workouts = await FR.get(`/api/v1/programs/${programId}/workouts`);
    box.innerHTML = workouts.map((w) => `
      <div class="item"><div class="grow"><div class="title">#${w.dayIndex} ${FR.esc(w.title)}</div>
      <div class="sub">${FR.esc(w.description || "")}</div></div>
      <button class="btn-danger btn-sm" onclick="delWorkout('${programId}','${w.id}')">x</button></div>`).join("")
      + `<button class="btn-ghost btn-sm" style="margin-top:.4rem" onclick="addWorkout('${programId}')">+ Treino</button>`;
  } catch (e) { FR.toast(e.message, true); }
}

function addWorkout(programId) {
  openModal(`<h2>Novo treino</h2>
    <form id="wk-form">
      <label>Título</label><input id="wk-title" required />
      <label>Ordem (dia)</label><input id="wk-day" type="number" min="0" value="0" />
      <label>Descrição</label><input id="wk-desc" />
      <label>Conteúdo (exercícios, markdown)</label><textarea id="wk-content"></textarea>
      <div class="row"><button class="grow" type="submit">Adicionar</button>
      <button type="button" class="btn-ghost" onclick="closeModal()">Cancelar</button></div>
    </form>`);
  document.getElementById("wk-form").onsubmit = async (e) => {
    e.preventDefault();
    try {
      await FR.post(`/api/v1/programs/${programId}/workouts`, {
        title: document.getElementById("wk-title").value,
        dayIndex: parseInt(document.getElementById("wk-day").value || "0", 10),
        description: document.getElementById("wk-desc").value,
        contentMarkdown: document.getElementById("wk-content").value,
      });
      closeModal(); FR.toast("Treino adicionado"); loadPrograms();
    } catch (err) { FR.toast(err.message, true); }
  };
}

async function delWorkout(programId, workoutId) {
  try { await FR.del(`/api/v1/programs/${programId}/workouts/${workoutId}`); renderWorkouts(programId); loadPrograms(); }
  catch (e) { FR.toast(e.message, true); }
}

/* ----------------------------- Espaço ----------------------------- */
async function loadSpace() {
  try {
    const s = await FR.get("/api/v1/creator-space");
    if (s) {
      document.getElementById("space-name").value = s.name || "";
      document.getElementById("space-slug").value = s.slug || "";
      document.getElementById("space-logo").value = s.logoUrl || "";
      document.getElementById("space-color").value = s.primaryColor || "";
      document.getElementById("space-bio").value = s.bio || "";
    }
  } catch (e) { /* espaço ainda não criado */ }
}

document.getElementById("space-form").onsubmit = async (e) => {
  e.preventDefault();
  try {
    await FR.put("/api/v1/creator-space", {
      name: document.getElementById("space-name").value,
      slug: document.getElementById("space-slug").value || null,
      logoUrl: document.getElementById("space-logo").value || null,
      primaryColor: document.getElementById("space-color").value || null,
      bio: document.getElementById("space-bio").value || null,
    });
    FR.toast("Espaço salvo");
  } catch (err) { FR.toast(err.message, true); }
};

/* ----------------------------- Modal ----------------------------- */
function openModal(html, label) { FRUI.openModal(html, { label: label || "Diálogo" }); }
function closeModal() { FRUI.closeModal(); }

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

function priceLabel(p) {
  return p.paid && p.price != null ? `R$ ${p.price}` : "gratuito";
}

/* ----------------------------- Ranking ----------------------------- */
async function loadLeaderboard() {
  FRUI.setLoading("leaderboard", { rows: 5, variant: "card" });
  try {
    const rows = await FR.get("/api/v1/gamification/leaderboard?limit=20");
    if (!rows.length) {
      FRUI.setEmpty("leaderboard", {
        icon: "🏆",
        title: "Ranking vazio",
        message: "Incentive check-ins — o ranking aparece quando houver atividade.",
      });
      return;
    }
    FRUI.setContent("leaderboard", rows.map((r) => `
      <div class="item">
        <div class="title" style="width:2rem">#${r.rank}</div>
        <div class="grow">
          <div class="title">${FR.esc(r.studentName)}</div>
          <div class="sub">Streak ${r.currentStreak} · ${r.totalCheckInsDone} check-in(s)</div>
        </div>
      </div>`).join(""));
  } catch (e) { FRUI.setError("leaderboard", { message: e.message, onRetry: loadLeaderboard }); }
}

/* ----------------------------- Marketplace ----------------------------- */
async function loadMarketplace() {
  FRUI.setLoading("sales", { rows: 3, variant: "card" });
  try {
    const st = await FR.get("/api/v1/billing/marketplace/status");
    document.getElementById("marketplace-status").innerHTML = st.connected
      ? `<span class="badge LOW">Conectado</span> Taxa plataforma: ${st.platformFeePercent}%`
      : `<span class="badge MEDIUM">Não conectado</span> Taxa plataforma: ${st.platformFeePercent}%`;
    if (st.walletId) document.getElementById("wallet-id").value = st.walletId;
  } catch (e) {
    document.getElementById("marketplace-status").innerHTML =
      `<span class="badge MEDIUM">Indisponível</span> <span class="muted">${FR.esc(e.message)}</span>`;
  }

  try {
    const sales = await FR.get("/api/v1/billing/marketplace/sales");
    if (!sales.length) {
      FRUI.setEmpty("sales", {
        icon: "💳",
        title: "Nenhuma venda",
        message: "Quando você vender programas pagos, as vendas aparecem aqui.",
      });
      return;
    }
    FRUI.setContent("sales", sales.map((s) => `
      <div class="item">
        <div class="grow">
          <div class="title">${FR.esc(s.programTitle)} · ${FR.esc(s.studentName)}</div>
          <div class="sub">R$ ${s.amount} (você: R$ ${s.creatorNet}, taxa: R$ ${s.platformFee}) · ${s.status}</div>
        </div>
      </div>`).join(""));
  } catch (e) { FRUI.setError("sales", { message: e.message, onRetry: loadMarketplace }); }
}

function initMarketplaceForm() {
  document.getElementById("wallet-form").onsubmit = async (e) => {
    e.preventDefault();
    try {
      await FR.post("/api/v1/billing/marketplace/connect", { walletId: document.getElementById("wallet-id").value.trim() });
      FR.toast("Carteira conectada");
      loadMarketplace();
    } catch (err) { FR.toast(err.message, true); }
  };
}
