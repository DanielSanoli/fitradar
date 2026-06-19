// Área do aluno.
const authEl = document.getElementById("auth");
const appEl = document.getElementById("app");

if (FR.token() && FR.user() && FR.user().role === "STUDENT") {
  start();
} else if (FR.token() && FR.user() && FR.user().role === "CREATOR") {
  location.href = "/app.html";
}

document.getElementById("login-form").onsubmit = async (e) => {
  e.preventDefault();
  try {
    const r = await FR.login(document.getElementById("email").value, document.getElementById("password").value);
    if (r.user.role === "CREATOR") { location.href = "/app.html"; return; }
    start();
  } catch (err) { FR.toast(err.message, true); }
};

function start() {
  authEl.classList.add("hidden");
  appEl.classList.remove("hidden");
  document.getElementById("who").textContent = FR.user().name;
  document.getElementById("logout").onclick = () => FR.logout("/student.html");
  loadSpace();
  loadProgress();
  loadGamification();
  loadPrograms();
  loadWorkouts();
}

async function loadSpace() {
  try {
    const s = await FR.get("/api/v1/my/space");
    if (s && s.name) document.getElementById("space-name").textContent = s.name;
  } catch (e) {}
}

async function loadProgress() {
  try {
    const p = await FR.get("/api/v1/my/progress");
    const adh = p.adherence != null ? p.adherence + "%" : "—";
    document.getElementById("progress-stats").innerHTML = `
      ${stat(adh, "Aderência (30d)")}
      ${stat(p.currentStreak, "Streak (dias)")}
      ${stat(p.weeklyDone, "Treinos na semana")}`;
    const card = document.getElementById("next-card");
    if (!p.enrolled) {
      card.innerHTML = `<h3>Comece um programa</h3><p>${FR.esc(p.message || "Peça ao seu treinador para te matricular.")}</p>`;
    } else if (p.nextWorkoutTitle) {
      card.innerHTML = `<div class="sub muted">Próximo treino</div><h3 style="margin:.2rem 0">${FR.esc(p.nextWorkoutTitle)}</h3>
        <p class="muted" style="margin:0">${FR.esc(p.message || "")}</p>`;
    } else {
      card.innerHTML = `<h3>Tudo em dia! 💪</h3><p>${FR.esc(p.message || "")}</p>`;
    }
  } catch (e) { FR.toast(e.message, true); }
}

async function loadGamification() {
  try {
    const g = await FR.get("/api/v1/my/gamification");
    const card = document.getElementById("badges-card");
    const badges = (g.badges || []).map((b) => `<span class="badge LOW" style="margin-right:.35rem">${FR.esc(b.label)}</span>`).join("");
    card.innerHTML = `<h3 style="margin-top:0">Conquistas</h3>
      <p class="muted" style="margin:.2rem 0 .8rem">Streak ${g.currentStreak} · recorde ${g.longestStreak} · rank #${g.rank || "—"}</p>
      ${badges || `<span class="muted">Faça check-ins para desbloquear badges!</span>`}`;
  } catch (e) {}
}

async function loadPrograms() {
  try {
    const programs = await FR.get("/api/v1/my/programs");
    const box = document.getElementById("programs");
    if (!programs.length) { box.innerHTML = `<p class="muted">Nenhum programa disponível.</p>`; return; }
    box.innerHTML = programs.map((p) => {
      let action = "";
      if (p.enrolled) action = `<span class="badge LOW">matriculado</span>`;
      else if (p.purchasePending) action = `<span class="badge MEDIUM">pagamento pendente</span>`;
      else if (p.paid) action = `<button class="btn-sm" onclick="buyProgram('${p.id}')">Comprar R$ ${p.price}</button>`;
      else action = `<button class="btn-sm" onclick="enrollProgram('${p.id}')">Entrar grátis</button>`;
      return `<div class="item"><div class="grow"><div class="title">${FR.esc(p.title)}</div>
        <div class="sub">${FR.esc(p.description || "")}</div></div>${action}</div>`;
    }).join("");
  } catch (e) { FR.toast(e.message, true); }
}

async function enrollProgram(id) {
  try {
    await FR.post(`/api/v1/my/programs/${id}/enroll`);
    FR.toast("Matriculado!");
    loadPrograms();
    loadWorkouts();
    loadProgress();
  } catch (e) { FR.toast(e.message, true); }
}

async function buyProgram(id) {
  try {
    const r = await FR.post(`/api/v1/my/programs/${id}/checkout`);
    if (r.checkoutUrl) location.href = r.checkoutUrl;
    else FR.toast(r.message || "Checkout indisponível", true);
  } catch (e) { FR.toast(e.message, true); }
}

let doneWorkoutIds = new Set();

async function loadWorkouts() {
  try {
    const checkIns = await FR.pageContent("/api/v1/my/check-ins");
    const today = new Date().toISOString().slice(0, 10);
    doneWorkoutIds = new Set(checkIns.filter((c) => c.date === today && c.status === "DONE").map((c) => c.workoutId));
  } catch (e) {}

  try {
    const workouts = await FR.get("/api/v1/my/workouts");
    const box = document.getElementById("workouts");
    if (!workouts.length) { box.innerHTML = `<p class="muted">Nenhum treino disponível ainda.</p>`; return; }
    box.innerHTML = workouts.map((w) => {
      const done = doneWorkoutIds.has(w.id);
      return `<div class="item">
        <div class="grow"><div class="title">#${w.dayIndex} ${FR.esc(w.title)}</div>
        <div class="sub">${FR.esc(w.description || "")}</div></div>
        ${done ? `<span class="badge LOW">feito hoje</span>`
               : `<button class="btn-sm" onclick="openCheckIn('${w.id}','${FR.esc(w.title)}')">Marcar feito</button>`}
      </div>`;
    }).join("");
  } catch (e) { FR.toast(e.message, true); }
}

function openCheckIn(workoutId, title) {
  openModal(`<h2>Check-in</h2><p class="muted" style="margin-top:-.4rem">${FR.esc(title)}</p>
    <label>Como você se sentiu? (1 a 5)</label>
    <select id="ci-feeling">
      <option value="">—</option><option value="1">1 · difícil</option><option value="2">2</option>
      <option value="3" selected>3 · ok</option><option value="4">4</option><option value="5">5 · ótimo</option>
    </select>
    <label>Notas (opcional)</label><textarea id="ci-notes"></textarea>
    <label class="row" style="align-items:flex-start;gap:.5rem;font-size:.85rem;color:var(--text-dim);cursor:pointer">
      <input type="checkbox" id="ci-consent" style="width:auto;margin:.15rem 0 0" />
      <span>Ao informar sensação ou notas, autorizo compartilhar com meu criador conforme a <a href="/privacy.html" target="_blank" rel="noopener">Política de Privacidade</a>.</span>
    </label>
    <div class="row">
      <button class="grow" id="ci-done">Concluí 💪</button>
      <button class="btn-ghost" id="ci-skip">Pulei</button>
    </div>
    <button class="btn-ghost" style="width:100%;margin-top:.5rem" onclick="closeModal()">Cancelar</button>`);

  const submit = async (skipped) => {
    try {
      const feeling = document.getElementById("ci-feeling").value;
      const notes = document.getElementById("ci-notes").value.trim();
      const hasSensitive = (!skipped && feeling) || notes.length > 0;
      if (hasSensitive && !document.getElementById("ci-consent").checked) {
        FR.toast("Marque o consentimento para compartilhar sensação ou notas.", true);
        return;
      }
      await FR.post("/api/v1/my/check-ins", {
        workoutId,
        skipped,
        feeling: feeling ? parseInt(feeling, 10) : null,
        notes: notes || null,
      });
      closeModal();
      FR.toast(skipped ? "Check-in registrado" : "Boa! Treino registrado");
      loadProgress();
      loadWorkouts();
      loadGamification();
    } catch (e) { FR.toast(e.message, true); }
  };
  document.getElementById("ci-done").onclick = () => submit(false);
  document.getElementById("ci-skip").onclick = () => submit(true);
}

function stat(value, label) {
  return `<div class="stat"><div class="value">${FR.esc(value)}</div><div class="label">${FR.esc(label)}</div></div>`;
}

function openModal(html) {
  document.getElementById("modal-card").innerHTML = html;
  document.getElementById("modal").classList.remove("hidden");
}
function closeModal() { document.getElementById("modal").classList.add("hidden"); }
