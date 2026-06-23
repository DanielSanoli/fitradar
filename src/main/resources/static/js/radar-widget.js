// Widget flutuante do Radar (criador e aluno) — app estático.
const FRRadar = (() => {
  const CONFIG = {
    CREATOR: {
      title: "Pergunte ao Radar",
      subtitle: "Copiloto de retenção · lê os sinais da sua comunidade",
      greeting: (name) =>
        `Oi${name ? ", " + firstName(name) : ""}! Pergunte sobre os alunos em risco ou a visão geral da sua comunidade.`,
      chips: ["Quais alunos estão em risco?", "Como está minha comunidade?", "Quem merece um parabéns?"],
      fabBottom: "5rem",
    },
    STUDENT: {
      title: "Como estou indo?",
      subtitle: "Seu progresso e streak · dados do motor de retenção",
      greeting: (name) =>
        `Oi${name ? ", " + firstName(name) : ""}! Pergunte sobre seu progresso, aderência ou streak.`,
      chips: ["Como estou indo?", "Qual meu streak?", "Como está minha aderência?"],
      fabBottom: "1.25rem",
    },
  };

  let role = "CREATOR";
  let open = false;
  let loading = false;
  let bound = false;
  let els = {};

  function firstName(name) {
    return (name || "").split(/\s+/)[0] || name;
  }

  function cfg() {
    return CONFIG[role] || CONFIG.CREATOR;
  }

  function mount() {
    if (document.getElementById("radar-fab")) {
      els = {
        shell: document.getElementById("radar-widget"),
        fab: document.getElementById("radar-fab"),
        panel: document.getElementById("radar-panel"),
        backdrop: document.getElementById("radar-backdrop"),
        chat: document.getElementById("radar-chat"),
        chips: document.getElementById("radar-chips"),
        form: document.getElementById("radar-ask-form"),
        input: document.getElementById("radar-ask-input"),
        title: document.getElementById("radar-panel-title"),
        subtitle: document.getElementById("radar-panel-subtitle"),
        close: document.getElementById("radar-panel-close"),
      };
      return;
    }

    const shell = document.createElement("div");
    shell.id = "radar-widget";
    shell.innerHTML = `
      <button type="button" id="radar-fab" class="radar-fab" aria-label="Abrir o Radar" aria-expanded="false" aria-controls="radar-panel">
        <span class="radar-fab-dot" aria-hidden="true"></span>
      </button>
      <div id="radar-backdrop" class="radar-backdrop hidden" aria-hidden="true"></div>
      <section id="radar-panel" class="radar-panel hidden" role="dialog" aria-modal="true" aria-labelledby="radar-panel-title" aria-hidden="true">
        <header class="radar-panel-header">
          <div class="radar-panel-brand" aria-hidden="true"><span class="radar-fab-dot"></span></div>
          <div>
            <h2 id="radar-panel-title" class="radar-panel-title"></h2>
            <p id="radar-panel-subtitle" class="radar-panel-subtitle"></p>
          </div>
          <button type="button" id="radar-panel-close" class="radar-panel-close" aria-label="Fechar">×</button>
        </header>
        <div id="radar-chat" class="chat radar-panel-chat" role="log" aria-live="polite" aria-relevant="additions"></div>
        <div id="radar-chips" class="chips" role="group" aria-label="Perguntas sugeridas"></div>
        <form id="radar-ask-form" class="radar-ask-form">
          <label class="hidden" for="radar-ask-input">Pergunta ao Radar</label>
          <input id="radar-ask-input" placeholder="Digite sua pergunta…" autocomplete="off" />
          <button type="submit">Enviar</button>
        </form>
        <p class="radar-disclaimer"><span aria-hidden="true">i</span> As respostas do Radar são sugestões — não substituem orientação médica/profissional.</p>
      </section>`;
    document.body.appendChild(shell);

    els = {
      shell,
      fab: shell.querySelector("#radar-fab"),
      panel: shell.querySelector("#radar-panel"),
      backdrop: shell.querySelector("#radar-backdrop"),
      chat: shell.querySelector("#radar-chat"),
      chips: shell.querySelector("#radar-chips"),
      form: shell.querySelector("#radar-ask-form"),
      input: shell.querySelector("#radar-ask-input"),
      title: shell.querySelector("#radar-panel-title"),
      subtitle: shell.querySelector("#radar-panel-subtitle"),
      close: shell.querySelector("#radar-panel-close"),
    };
  }

  function renderHeader() {
    const c = cfg();
    els.title.textContent = c.title;
    els.subtitle.textContent = c.subtitle;
    els.fab.style.bottom = c.fabBottom;
    els.chips.innerHTML = c.chips
      .map(
        (chip) =>
          `<button type="button" class="chip" data-q="${FR.esc(chip)}">${FR.esc(chip)}</button>`,
      )
      .join("");
    els.chips.querySelectorAll(".chip").forEach((btn) => {
      btn.onclick = () => ask(btn.dataset.q);
    });
  }

  function resetChat() {
    els.chat.innerHTML = "";
    const c = cfg();
    const name = FR.user() ? FR.user().name : "";
    addMsg("bot", c.greeting(name));
  }

  function bind() {
    if (bound) return;
    bound = true;
    els.fab.onclick = () => toggle();
    els.close.onclick = () => close();
    els.backdrop.onclick = () => close();
    els.form.onsubmit = (e) => {
      e.preventDefault();
      ask(els.input.value);
    };
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && open) close();
    });
  }

  function toggle() {
    if (open) close();
    else openPanel();
  }

  function openPanel() {
    open = true;
    els.fab.setAttribute("aria-expanded", "true");
    els.fab.setAttribute("aria-label", "Fechar o Radar");
    els.panel.classList.remove("hidden");
    els.panel.setAttribute("aria-hidden", "false");
    els.backdrop.classList.remove("hidden");
    els.backdrop.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    els.input.focus();
  }

  function close() {
    open = false;
    els.fab.setAttribute("aria-expanded", "false");
    els.fab.setAttribute("aria-label", "Abrir o Radar");
    els.panel.classList.add("hidden");
    els.panel.setAttribute("aria-hidden", "true");
    els.backdrop.classList.add("hidden");
    els.backdrop.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function addMsg(who, text) {
    const div = document.createElement("div");
    div.className = "msg " + who;
    div.setAttribute("role", "article");
    div.setAttribute("aria-label", who === "user" ? "Sua mensagem" : "Resposta do Radar");
    div.textContent = text;
    els.chat.appendChild(div);
    els.chat.scrollTop = els.chat.scrollHeight;
  }

  async function ask(question) {
    question = (question || "").trim();
    if (!question || loading) return;
    addMsg("user", question);
    els.input.value = "";
    const submitBtn = els.form.querySelector('button[type="submit"]');
    loading = true;
    FRUI.buttonLoading(submitBtn, true, "Enviando…");
    try {
      const r = await FR.post("/api/v1/copilot/ask", { question });
      addMsg("bot", r.answer);
    } catch (e) {
      addMsg("bot", "Não consegui responder agora. Tente de novo em instantes.\n\n" + e.message);
    } finally {
      loading = false;
      FRUI.buttonLoading(submitBtn, false);
    }
  }

  function init(nextRole) {
    role = nextRole === "STUDENT" ? "STUDENT" : "CREATOR";
    mount();
    renderHeader();
    resetChat();
    bind();
    els.shell.classList.remove("hidden");
  }

  return { init, open: openPanel, close };
})();

if (typeof globalThis !== "undefined") {
  globalThis.FRRadar = FRRadar;
}
