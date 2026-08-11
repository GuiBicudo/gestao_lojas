// Agrupa login, cadastro, logout, sessão atual e recuperação de senha num único arquivo —
// no plano gratuito da Vercel só dá pra ter até 12 Serverless Functions por projeto, e ter
// um arquivo por rota (como era no Netlify) estourava esse limite fácil. A rota escolhida
// vem do pedaço dinâmico da URL: /api/auth/login, /api/auth/signup, /api/auth/logout,
// /api/auth/me, /api/auth/forgot-password, /api/auth/reset-password. A lógica de cada uma
// é exatamente a mesma que já existia nos arquivos separados — só a "casca" mudou.
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { sql } = require("../_db");
const { signSessionCookie, clearSessionCookie, getSessionFromEvent, isOwnerEmail, json } = require("../_auth");
const { sendMail } = require("../_email");
const { getClientIp, isRateLimited, recordAttempt, RATE_LIMIT_RESPONSE } = require("../_rateLimit");
const { toVercelHandler } = require("../_vercelAdapter");

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function handleLogin(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "invalid_json" });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const ip = getClientIp(event);

  // Limita tentativas de login por IP e por conta antes de sequer checar a senha — sem
  // isso, dava pra tentar senha atrás de senha sem limite nenhum (força bruta de graça).
  if (await isRateLimited("login", ip, email)) return json(429, RATE_LIMIT_RESPONSE);

  const rows = await sql`select id, email, password_hash, status, blocked_at, trial_ends_at, token_version from users where email = ${email}`;
  const user = rows[0];

  // Mensagem genérica em caso de e-mail OU senha errados — evita confirmar para quem está
  // tentando adivinhar se um e-mail existe cadastrado (user enumeration).
  const genericError = { error: "invalid_credentials", message: "E-mail ou senha incorretos." };

  if (!user) {
    await recordAttempt("login", ip, email);
    return json(401, genericError);
  }

  const passwordOk = await bcrypt.compare(password, user.password_hash);
  if (!passwordOk) {
    await recordAttempt("login", ip, email);
    return json(401, genericError);
  }

  if (user.status === "pending") {
    return json(403, { error: "pending", message: "Seu cadastro ainda está aguardando aprovação." });
  }
  if (user.status === "rejected") {
    return json(403, { error: "rejected", message: "Seu cadastro não foi aprovado." });
  }

  // Nem conta bloqueada nem trial vencido impedem o login — a pessoa consegue entrar
  // normalmente, e é o /api/auth/me + o front-end que decidem o que ela vê: tela de
  // "bloqueado" com formulário de ticket, ou abas travadas com convite pra virar premium.

  const setCookie = signSessionCookie({ id: user.id, email: user.email, token_version: user.token_version });
  return json(200, { ok: true }, { "Set-Cookie": setCookie });
}

async function handleSignup(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "invalid_json" });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const ip = getClientIp(event);

  if (!email || !email.includes("@")) return json(400, { error: "E-mail inválido." });
  if (password.length < 8) return json(400, { error: "A senha precisa ter pelo menos 8 caracteres." });

  // Limita quantos cadastros/tentativas de cadastro saem do mesmo IP ou mirando o mesmo
  // e-mail — evita spam de contas e também dificulta usar esse endpoint pra ficar testando
  // e-mails em massa.
  if (await isRateLimited("signup", ip, email)) return json(429, RATE_LIMIT_RESPONSE);
  await recordAttempt("signup", ip, email);

  const GENERIC_SIGNUP_RESPONSE = { message: "Cadastro enviado! Você poderá entrar assim que for aprovado." };

  const existing = await sql`select id, email from users where email = ${email}`;
  if (existing.length > 0) {
    // Faz um hash "fantasma" mesmo sem precisar — bcrypt é a parte mais lenta desse
    // endpoint, então pular ela deixaria essa resposta visivelmente mais rápida que a de um
    // cadastro novo, o que também vaza (por tempo de resposta) que o e-mail já existe.
    await bcrypt.hash(password, 10);
    try {
      await sendMail({
        to: existing[0].email,
        subject: "Tentativa de cadastro com seu e-mail — Gestão de Lojas",
        html: `<p>Alguém tentou criar uma nova conta no Gestão de Lojas usando este e-mail, que já está cadastrado.</p>
               <p>Se foi você, use a opção "Esqueci minha senha" na tela de login para recuperar o acesso. Se não foi você, pode ignorar este e-mail com segurança.</p>`,
      });
    } catch (e) {
      console.error("[auth/signup] falha ao enviar e-mail de aviso (e-mail já cadastrado):", e);
    }
    return json(200, GENERIC_SIGNUP_RESPONSE);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // O e-mail do dono (OWNER_EMAIL) é aprovado automaticamente na hora — assim ele nunca
  // fica trancado do próprio sistema esperando aprovação de si mesmo.
  const status = isOwnerEmail(email) ? "approved" : "pending";
  const approvedAt = status === "approved" ? new Date().toISOString() : null;

  const [user] = await sql`
    insert into users (email, password_hash, status, approved_at)
    values (${email}, ${passwordHash}, ${status}, ${approvedAt})
    returning id, email, status
  `;

  await sql`
    insert into app_state (user_id, data)
    values (${user.id}, ${"{}"}::jsonb)
    on conflict (user_id) do nothing
  `;

  if (status === "pending") {
    try {
      await sendMail({
        to: process.env.OWNER_EMAIL,
        subject: "Novo cadastro aguardando aprovação — Gestão de Lojas",
        html: `<p>O e-mail <strong>${email}</strong> se cadastrou no Gestão de Lojas e está aguardando sua aprovação.</p>
               <p>Entre no sistema e acesse a aba "Aprovações" para aprovar ou rejeitar.</p>`,
      });
    } catch (e) {
      console.error("[auth/signup] falha ao enviar e-mail de notificação:", e);
    }
    return json(200, GENERIC_SIGNUP_RESPONSE);
  }

  return json(200, { message: "Cadastro concluído. Você já pode entrar." });
}

async function handleLogout(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  // Incrementa token_version além de limpar o cookie — assim o token que essa pessoa (ou
  // qualquer outra cópia dele, se tiver vazado de algum jeito) tinha guardado deixa de
  // funcionar imediatamente, em vez de continuar válido até expirar sozinho (30 dias).
  const session = await getSessionFromEvent(event);
  if (session) {
    await sql`update users set token_version = token_version + 1 where id = ${session.id}`;
  }

  return json(200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
}

async function handleMe(event) {
  const session = await getSessionFromEvent(event);
  if (!session) return json(200, { authenticated: false });

  // Já aproveita essa consulta (que já acontece a cada carregamento do app) pra marcar
  // "último acesso" — alimenta a coluna correspondente na aba Usuários, sem precisar de
  // uma escrita extra em toda requisição autenticada.
  const rows = await sql`
    update users set last_seen_at = now()
    where id = ${session.id}
    returning id, email, status, trial_ends_at, blocked_at
  `;
  const user = rows[0];
  if (!user || user.status !== "approved") return json(200, { authenticated: false });

  const isAdmin = isOwnerEmail(user.email);
  const blocked = !isAdmin && !!user.blocked_at;
  const trialExpired = !isAdmin && !!user.trial_ends_at && new Date(user.trial_ends_at) < new Date();

  return json(200, {
    authenticated: true,
    email: user.email,
    isAdmin,
    blocked,
    trialEndsAt: user.trial_ends_at,
    hasAccess: isAdmin || (!blocked && !trialExpired),
  });
}

async function handleForgotPassword(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "invalid_json" });
  }

  const email = (body.email || "").trim().toLowerCase();

  // Resposta sempre genérica, exista ou não o e-mail — evita confirmar pra quem está
  // tentando adivinhar e-mails cadastrados (user enumeration).
  const genericMessage = { message: "Se esse e-mail estiver cadastrado, você vai receber um link de recuperação em instantes." };

  if (!email) return json(200, genericMessage);

  const ip = getClientIp(event);
  // Limita pedidos de recuperação por IP/e-mail — sem isso, dava pra usar esse endpoint
  // pra encher a caixa de entrada de alguém (spam) ou ficar testando e-mails em massa.
  if (await isRateLimited("forgot_password", ip, email)) return json(429, RATE_LIMIT_RESPONSE);
  await recordAttempt("forgot_password", ip, email);

  const rows = await sql`select id, email from users where email = ${email}`;
  const user = rows[0];

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

    await sql`
      insert into password_reset_tokens (user_id, token_hash, expires_at)
      values (${user.id}, ${tokenHash}, ${expiresAt})
    `;

    const origin = process.env.SITE_URL || `https://${event.headers.host}`;
    const resetLink = `${origin}/?reset=${token}`;

    try {
      await sendMail({
        to: user.email,
        subject: "Recuperação de senha — Gestão de Lojas",
        html: `<p>Recebemos um pedido para redefinir sua senha no Gestão de Lojas.</p>
               <p><a href="${resetLink}">Clique aqui para criar uma nova senha</a>. O link expira em 1 hora.</p>
               <p>Se você não pediu isso, pode ignorar este e-mail.</p>`,
      });
    } catch (e) {
      console.error("[auth/forgot-password] falha ao enviar e-mail:", e);
    }
  }

  return json(200, genericMessage);
}

async function handleResetPassword(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "invalid_json" });
  }

  const token = body.token || "";
  const password = body.password || "";

  if (!token) return json(400, { error: "Link inválido ou expirado." });
  if (password.length < 8) return json(400, { error: "A senha precisa ter pelo menos 8 caracteres." });

  const tokenHash = hashToken(token);
  const rows = await sql`
    select id, user_id, expires_at, used
    from password_reset_tokens
    where token_hash = ${tokenHash}
  `;
  const record = rows[0];

  if (!record || record.used || new Date(record.expires_at) < new Date()) {
    return json(400, { error: "Link inválido ou expirado. Peça um novo link de recuperação." });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Também revoga qualquer sessão antiga (token_version + 1) — se a troca de senha foi
  // porque a conta estava comprometida, isso derruba o acesso de quem tinha a senha velha.
  await sql`update users set password_hash = ${passwordHash}, token_version = token_version + 1 where id = ${record.user_id}`;
  await sql`update password_reset_tokens set used = true where id = ${record.id}`;

  return json(200, { ok: true, message: "Senha redefinida! Você já pode entrar com a nova senha." });
}

async function handler(event) {
  const action = event.queryStringParameters && event.queryStringParameters.action;
  switch (action) {
    case "login": return handleLogin(event);
    case "signup": return handleSignup(event);
    case "logout": return handleLogout(event);
    case "me": return handleMe(event);
    case "forgot-password": return handleForgotPassword(event);
    case "reset-password": return handleResetPassword(event);
    default: return json(404, { error: "not_found" });
  }
}

module.exports = toVercelHandler(handler);
