/* ===================== Autenticação (login / cadastro / aprovação) =====================
   Esse arquivo roda ANTES do app de verdade aparecer: ele decide se mostra a tela de
   login/cadastro (#auth-gate) ou o app (#app-root), conversando com as Netlify Functions
   em /api/*. O app.js já está carregado nesse ponto (ele só não chamou startApp() ainda —
   isso é o auth.js quem decide, depois de confirmar a sessão). */

const authGate = document.getElementById("auth-gate");
const appRoot = document.getElementById("app-root");

function showAuthGate() {
  appRoot.style.display = "none";
  authGate.style.display = "flex";
}

function showApp() {
  authGate.style.display = "none";
  appRoot.style.display = "flex";
}

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  let data = {};
  try { data = await res.json(); } catch (e) {}
  return { ok: res.ok, status: res.status, data };
}

/* ---------- Tela de login / cadastro / esqueci minha senha ---------- */

function renderAuthGate(mode, opts) {
  mode = mode || "login";
  opts = opts || {};

  const showTabs = mode === "login" || mode === "signup";

  authGate.innerHTML = `
    <div class="auth-card">
      <div class="auth-brand">
        <span class="brand-mark">◇</span>
        <strong>Gestão de Lojas</strong>
      </div>

      ${showTabs ? `
        <div class="segmented auth-tabs">
          <button class="segmented-btn ${mode === "login" ? "active" : ""}" data-mode="login">Entrar</button>
          <button class="segmented-btn ${mode === "signup" ? "active" : ""}" data-mode="signup">Cadastrar</button>
        </div>
      ` : ""}

      ${opts.notice ? `<div class="auth-notice ${opts.noticeType || ""}">${opts.notice}</div>` : ""}

      ${mode === "login" ? `
        <form id="auth-form" class="auth-form">
          <label>E-mail<input type="email" id="auth-email" required autocomplete="email"></label>
          <label>Senha<input type="password" id="auth-password" required autocomplete="current-password"></label>
          <button type="submit" class="primary-btn" id="auth-submit">Entrar</button>
        </form>
        <p class="auth-hint"><a href="#" id="auth-forgot-link">Esqueci minha senha</a></p>
      ` : mode === "signup" ? `
        <form id="auth-form" class="auth-form">
          <label>E-mail<input type="email" id="auth-email" required autocomplete="email"></label>
          <label>Senha<input type="password" id="auth-password" required autocomplete="new-password" minlength="8"></label>
          <label>Confirmar senha<input type="password" id="auth-password2" required autocomplete="new-password" minlength="8"></label>
          <button type="submit" class="primary-btn" id="auth-submit">Cadastrar</button>
        </form>
        <p class="auth-hint">Seu cadastro precisa ser aprovado antes de você conseguir entrar.</p>
      ` : `
        <form id="auth-form" class="auth-form">
          <label>E-mail<input type="email" id="auth-email" required autocomplete="email"></label>
          <button type="submit" class="primary-btn" id="auth-submit">Enviar link de recuperação</button>
        </form>
        <p class="auth-hint"><a href="#" id="auth-back-link">Voltar para o login</a></p>
      `}
    </div>
  `;

  authGate.querySelectorAll(".auth-tabs .segmented-btn").forEach(btn => {
    btn.addEventListener("click", () => renderAuthGate(btn.dataset.mode));
  });

  const forgotLink = authGate.querySelector("#auth-forgot-link");
  if (forgotLink) forgotLink.addEventListener("click", e => { e.preventDefault(); renderAuthGate("forgot"); });

  const backLink = authGate.querySelector("#auth-back-link");
  if (backLink) backLink.addEventListener("click", e => { e.preventDefault(); renderAuthGate("login"); });

  authGate.querySelector("#auth-form").addEventListener("submit", async e => {
    e.preventDefault();
    const email = authGate.querySelector("#auth-email").value.trim();
    const submitBtn = authGate.querySelector("#auth-submit");

    if (mode === "forgot") {
      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando...";
      const { data } = await apiPost("/api/forgot-password", { email });
      renderAuthGate("login", { notice: data.message || "Se esse e-mail estiver cadastrado, você vai receber um link de recuperação em instantes.", noticeType: "good" });
      return;
    }

    const password = authGate.querySelector("#auth-password").value;

    if (mode === "signup") {
      const password2 = authGate.querySelector("#auth-password2").value;
      if (password !== password2) {
        renderAuthGate("signup", { notice: "As senhas digitadas são diferentes.", noticeType: "bad" });
        return;
      }
    }

    submitBtn.disabled = true;
    submitBtn.textContent = mode === "login" ? "Entrando..." : "Cadastrando...";

    if (mode === "login") {
      const { ok, status, data } = await apiPost("/api/login", { email, password });
      if (ok) {
        await boot();
        return;
      }
      let notice = data.message || "E-mail ou senha incorretos.";
      if (status === 403 && data.error === "pending") notice = "Seu cadastro ainda está aguardando aprovação.";
      renderAuthGate("login", { notice, noticeType: "bad" });
    } else {
      const { ok, data } = await apiPost("/api/signup", { email, password });
      if (ok) {
        renderAuthGate("login", { notice: data.message || "Cadastro enviado! Você poderá entrar assim que for aprovado.", noticeType: "good" });
        return;
      }
      renderAuthGate("signup", { notice: data.error || "Não foi possível concluir o cadastro.", noticeType: "bad" });
    }
  });
}

/* ---------- Tela de redefinir senha (chegou por um link de e-mail com ?reset=token) ---------- */

function renderResetForm(token, opts) {
  opts = opts || {};

  authGate.innerHTML = `
    <div class="auth-card">
      <div class="auth-brand">
        <span class="brand-mark">◇</span>
        <strong>Gestão de Lojas</strong>
      </div>

      <p class="auth-hint" style="margin-top:0;">Escolha uma nova senha para sua conta.</p>

      ${opts.notice ? `<div class="auth-notice ${opts.noticeType || ""}">${opts.notice}</div>` : ""}

      <form id="reset-form" class="auth-form">
        <label>Nova senha<input type="password" id="reset-password" required autocomplete="new-password" minlength="8"></label>
        <label>Confirmar nova senha<input type="password" id="reset-password2" required autocomplete="new-password" minlength="8"></label>
        <button type="submit" class="primary-btn" id="reset-submit">Redefinir senha</button>
      </form>
      <p class="auth-hint"><a href="#" id="reset-back-link">Voltar para o login</a></p>
    </div>
  `;

  authGate.querySelector("#reset-back-link").addEventListener("click", e => {
    e.preventDefault();
    clearResetParam();
    renderAuthGate("login");
  });

  authGate.querySelector("#reset-form").addEventListener("submit", async e => {
    e.preventDefault();
    const password = authGate.querySelector("#reset-password").value;
    const password2 = authGate.querySelector("#reset-password2").value;
    if (password !== password2) {
      renderResetForm(token, { notice: "As senhas digitadas são diferentes.", noticeType: "bad" });
      return;
    }

    const submitBtn = authGate.querySelector("#reset-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Redefinindo...";

    const { ok, data } = await apiPost("/api/reset-password", { token, password });
    clearResetParam();
    if (ok) {
      renderAuthGate("login", { notice: data.message || "Senha redefinida! Você já pode entrar com a nova senha.", noticeType: "good" });
    } else {
      renderAuthGate("login", { notice: data.error || "Link inválido ou expirado. Peça um novo link de recuperação.", noticeType: "bad" });
    }
  });
}

/* ---------- Tela de conta bloqueada (com formulário de ticket) ---------- */

async function renderBlockedGate(opts) {
  opts = opts || {};

  authGate.innerHTML = `
    <div class="auth-card">
      <div class="auth-brand">
        <span class="brand-mark">◇</span>
        <strong>Gestão de Lojas</strong>
      </div>

      <p class="auth-hint" style="margin-top:0;">🔒 Seu acesso foi bloqueado pelo administrador.</p>
      <p class="auth-hint">Se acha que isso é um engano, explique o que aconteceu abaixo — sua mensagem vai direto pro administrador.</p>

      ${opts.notice ? `<div class="auth-notice ${opts.noticeType || ""}">${opts.notice}</div>` : ""}

      <div id="blocked-ticket-area"><div class="empty-state">Carregando...</div></div>
      <p class="auth-hint"><a href="#" id="blocked-logout-link">Sair</a></p>
    </div>
  `;

  authGate.querySelector("#blocked-logout-link").addEventListener("click", async e => {
    e.preventDefault();
    try { await apiPost("/api/logout"); } catch (err) {}
    window.location.reload();
  });

  const area = authGate.querySelector("#blocked-ticket-area");

  // Se já existe um ticket aberto, mostra a conversa em vez de um formulário em branco —
  // assim dá pra continuar a mesma conversa em vez de abrir um ticket novo toda hora.
  let openTicket = null;
  try {
    const res = await fetch("/api/my-tickets");
    const data = await res.json();
    openTicket = (data.tickets || []).find(t => t.status === "open") || null;
  } catch (e) {}

  if (openTicket && typeof renderTicketThread === "function") {
    area.innerHTML = "";
    await renderTicketThread(area, openTicket, { isAdmin: false });
    return;
  }

  area.innerHTML = `
    <form id="blocked-ticket-form" class="auth-form">
      <label>Assunto (opcional)<input type="text" id="blocked-ticket-subject" maxlength="200"></label>
      <label>Mensagem<textarea id="blocked-ticket-message" required rows="4" style="width:100%; font-family:inherit; padding:8px; border-radius:8px;"></textarea></label>
      <button type="submit" class="primary-btn" id="blocked-ticket-submit">Enviar ticket</button>
    </form>
  `;

  area.querySelector("#blocked-ticket-form").addEventListener("submit", async e => {
    e.preventDefault();
    const subject = area.querySelector("#blocked-ticket-subject").value.trim();
    const message = area.querySelector("#blocked-ticket-message").value.trim();
    const submitBtn = area.querySelector("#blocked-ticket-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";
    const { ok } = await apiPost("/api/create-ticket", { subject, message });
    if (ok) {
      renderBlockedGate({ notice: "Ticket enviado! O administrador vai analisar e entrar em contato.", noticeType: "good" });
    } else {
      renderBlockedGate({ notice: "Não foi possível enviar o ticket agora. Tente de novo em instantes.", noticeType: "bad" });
    }
  });
}

// tira o ?reset=... da URL depois de usado, sem recarregar a página
function clearResetParam() {
  const url = new URL(window.location.href);
  url.searchParams.delete("reset");
  window.history.replaceState({}, "", url.toString());
}

/* ---------- Boot: decide se mostra o app, a tela de login, ou o formulário de redefinir senha ---------- */

async function boot() {
  const resetToken = new URLSearchParams(window.location.search).get("reset");
  if (resetToken) {
    showAuthGate();
    renderResetForm(resetToken);
    return;
  }

  showAuthGate();
  renderAuthGate("login", { notice: "Verificando sessão...", noticeType: "" });

  let me;
  try {
    const res = await fetch("/api/me");
    me = await res.json();
  } catch (e) {
    renderAuthGate("login", { notice: "Não foi possível conectar ao servidor agora. Tente novamente.", noticeType: "bad" });
    return;
  }

  if (!me || !me.authenticated) {
    renderAuthGate("login");
    return;
  }

  if (me.blocked) {
    showAuthGate();
    await renderBlockedGate();
    return;
  }

  window.isAdmin = !!me.isAdmin;
  window.userEmail = me.email;
  window.trialEndsAt = me.trialEndsAt || null;
  window.hasAccess = me.isAdmin || !!me.hasAccess;
  showApp();
  window.startApp();
}

document.getElementById("btn-logout").addEventListener("click", async () => {
  try { await apiPost("/api/logout"); } catch (e) {}
  window.location.reload();
});

boot();
