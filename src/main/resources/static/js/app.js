// Painel do criador.
const me = FR.requireRole("CREATOR", "/");
if (me) {
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
  initAsk();
  initMarketplaceForm();
}

function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((t) => {
    t.onclick = () => {
      tabs.forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      ["retention", "students", "programs", "ranking", "marketplace", "space"].forEach((name) => {
        document.getElementById("tab-" + name).classList.toggle("hidden", name !== t.dataset.tab);
      });
    };
  });
}

function renderAccessBanner() {
  if (me.accessAllowed) return;
  const el = document.getElementById("access-banner");
  el.classList.remove("hidden");
  el.innerHTML = `<strong>${FR.esc(me.accessMessage || "Sua assinatura precisa de atenção.")}</strong>
    <div style="margin-top:.6rem"><button class="btn-sm" id="upgrade">Assinar o Pro</button></div>`;
  document.getElementById("upgrade").onclick = async () => {
    try {
      const r = await FR.post("/api/v1/billing/checkout/pro");
      if (r && r.checkoutUrl) location.href = r.checkoutUrl;
      else FR.toast("Checkout indisponível no momento", true);
    } catch (e) { FR.toast(e.message, true); }
  };
}

/* ----------------------------- Retenção ----------------------------- */
async function loadRetention() {
  try {
    const ov = await FR.get("/api/v1/retention/overview");
    const adh = ov.avgAdherence != null ? ov.avgAdherence + "%" : "—";
    document.getElementById("overview-stats").innerHTML = `
      ${stat(ov.activeStudents, "Alunos ativos")}
      ${stat(adh, "Aderência média")}
      ${stat(ov.atRiskCount, "Em risco")}
      ${stat(ov.checkInsThisWeek, "Check-ins na semana")}
      ${stat(ov.newStudentsThisWeek, "Novos na semana")}`;
  } catch (e) { FR.toast(e.message, true); }

  try {
    const risk = await FR.get("/api/v1/retention/students-at-risk?minLevel=MEDIUM");
    const box = document.getElementById("at-risk");
    if (!risk.length) { box.innerHTML = `<p class="muted">Nenhum aluno em risco. 🎉</p>`; }
    else box.innerHTML = risk.map((r) => `
      <div class="item">
        <div class="grow">
          <div class="title">${FR.esc(r.studentName)} <span class="badge ${r.level}">${r.level}</span></div>
          <div class="sub">${FR.esc((r.assumptions || []).join(" · "))}</div>
          <div class="bar" style="margin-top:.45rem"><span style="width:${r.score}%"></span></div>
        </div>
        <button class="btn-ghost btn-sm" onclick="genNudge('${r.studentId}')">Gerar nudge</button>
      </div>`).join("");
  } catch (e) { FR.toast(e.message, true); }

  loadAlerts();
}

async function loadAlerts() {
  try {
    const alerts = await FR.get("/api/v1/retention/alerts");
    const box = document.getElementById("alerts");
    if (!alerts.length) { box.innerHTML = `<p class="muted">Sem alertas no momento.</p>`; return; }
    box.innerHTML = alerts.map((a) => `
      <div class="item" style="${a.read ? 'opacity:.55' : ''}">
        <div class="grow">
          <div class="title"><span class="badge ${a.severity}">${a.severity}</span> ${FR.esc(a.message)}</div>
          <div class="sub">${FR.esc(a.actionSuggestion || "")}</div>
        </div>
        ${a.read ? "" : `<button class="btn-ghost btn-sm" onclick="markRead('${a.id}')">Marcar lido</button>`}
      </div>`).join("");
  } catch (e) { FR.toast(e.message, true); }
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

/* ----------------------------- Pergunte ao Radar ----------------------------- */
function initAsk() {
  const chat = document.getElementById("chat");
  addMsg(chat, "bot", "Oi! Pergunte sobre os alunos em risco ou a visão geral da sua comunidade.");
  document.getElementById("ask-form").onsubmit = (e) => { e.preventDefault(); ask(document.getElementById("ask-input").value); };
  document.querySelectorAll(".chip").forEach((c) => (c.onclick = () => ask(c.dataset.q)));
}

async function ask(question) {
  question = (question || "").trim();
  if (!question) return;
  const chat = document.getElementById("chat");
  addMsg(chat, "user", question);
  document.getElementById("ask-input").value = "";
  try {
    const r = await FR.post("/api/v1/copilot/ask", { question });
    addMsg(chat, "bot", r.answer);
  } catch (e) { addMsg(chat, "bot", "Erro: " + e.message); }
}

function addMsg(chat, who, text) {
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

/* ----------------------------- Alunos ----------------------------- */
let programCache = [];

async function loadStudents() {
  try {
    const students = await FR.get("/api/v1/students");
    const box = document.getElementById("students");
    if (!students.length) { box.innerHTML = `<p class="muted">Nenhum aluno ainda. Convide o primeiro!</p>`; return; }
    box.innerHTML = students.map((s) => `
      <div class="item">
        <div class="grow"><div class="title">${FR.esc(s.name)}</div><div class="sub">${FR.esc(s.email)}</div></div>
        <button class="btn-ghost btn-sm" onclick="manageEnroll('${s.id}','${FR.esc(s.name)}')">Matrículas</button>
      </div>`).join("");
  } catch (e) { FR.toast(e.message, true); }
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
  try {
    programCache = await FR.get("/api/v1/programs");
    const box = document.getElementById("programs");
    if (!programCache.length) { box.innerHTML = `<p class="muted">Nenhum programa. Crie o primeiro!</p>`; return; }
    box.innerHTML = programCache.map((p) => `
      <div class="card">
        <div class="row" style="align-items:center">
          <div class="grow"><div class="title">${FR.esc(p.title)} ${p.active ? "" : '<span class="badge MEDIUM">inativo</span>'}</div>
          <div class="sub">${FR.esc(p.description || "")} · ${p.workoutCount} treino(s) · ${priceLabel(p)}</div></div>
          <button class="btn-ghost btn-sm" onclick="toggleWorkouts('${p.id}')">Treinos</button>
          <button class="btn-danger btn-sm" onclick="delProgram('${p.id}')">Excluir</button>
        </div>
        <div id="workouts-${p.id}" class="list hidden" style="margin-top:.8rem"></div>
      </div>`).join("");
  } catch (e) { FR.toast(e.message, true); }
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
  if (!confirm("Excluir este programa?")) return;
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
function openModal(html) {
  document.getElementById("modal-card").innerHTML = html;
  document.getElementById("modal").classList.remove("hidden");
}
function closeModal() { document.getElementById("modal").classList.add("hidden"); }

function priceLabel(p) {
  return p.paid && p.price != null ? `R$ ${p.price}` : "gratuito";
}

/* ----------------------------- Ranking ----------------------------- */
async function loadLeaderboard() {
  try {
    const rows = await FR.get("/api/v1/gamification/leaderboard?limit=20");
    const box = document.getElementById("leaderboard");
    if (!rows.length) { box.innerHTML = `<p class="muted">Sem dados ainda — incentive check-ins!</p>`; return; }
    box.innerHTML = rows.map((r) => `
      <div class="item">
        <div class="title" style="width:2rem">#${r.rank}</div>
        <div class="grow">
          <div class="title">${FR.esc(r.studentName)}</div>
          <div class="sub">Streak ${r.currentStreak} · ${r.totalCheckInsDone} check-in(s)</div>
        </div>
      </div>`).join("");
  } catch (e) { FR.toast(e.message, true); }
}

/* ----------------------------- Marketplace ----------------------------- */
async function loadMarketplace() {
  try {
    const st = await FR.get("/api/v1/billing/marketplace/status");
    document.getElementById("marketplace-status").innerHTML = st.connected
      ? `<span class="badge LOW">Conectado</span> Taxa plataforma: ${st.platformFeePercent}%`
      : `<span class="badge MEDIUM">Não conectado</span> Taxa plataforma: ${st.platformFeePercent}%`;
    if (st.walletId) document.getElementById("wallet-id").value = st.walletId;
  } catch (e) { FR.toast(e.message, true); }

  try {
    const sales = await FR.get("/api/v1/billing/marketplace/sales");
    const box = document.getElementById("sales");
    if (!sales.length) { box.innerHTML = `<p class="muted">Nenhuma venda ainda.</p>`; return; }
    box.innerHTML = sales.map((s) => `
      <div class="item">
        <div class="grow">
          <div class="title">${FR.esc(s.programTitle)} · ${FR.esc(s.studentName)}</div>
          <div class="sub">R$ ${s.amount} (você: R$ ${s.creatorNet}, taxa: R$ ${s.platformFee}) · ${s.status}</div>
        </div>
      </div>`).join("");
  } catch (e) { FR.toast(e.message, true); }
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
