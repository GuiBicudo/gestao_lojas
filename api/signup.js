const bcrypt = require("bcryptjs");
const { sql } = require("./_db");
const { isOwnerEmail, json } = require("./_auth");
const { sendMail } = require("./_email");
const { getClientIp, isRateLimited, recordAttempt, RATE_LIMIT_RESPONSE } = require("./_rateLimit");

const { toVercelHandler } = require("./_vercelAdapter");
// Mensagem sempre igual, exista ou não o e-mail — evita confirmar pra quem está testando
// e-mails só pra descobrir quais já têm conta (user enumeration). Quando o e-mail já existe
// de verdade, quem é avisado é o dono da conta, por e-mail — não quem está preenchendo o
// formulário.
const GENERIC_SIGNUP_RESPONSE = { message: "Cadastro enviado! Você poderá entrar assim que for aprovado." };

async function handler(event) {
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
      console.error("[signup] falha ao enviar e-mail de aviso (e-mail já cadastrado):", e);
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
      console.error("[signup] falha ao enviar e-mail de notificação:", e);
    }
    return json(200, GENERIC_SIGNUP_RESPONSE);
  }

  return json(200, { message: "Cadastro concluído. Você já pode entrar." });
}

module.exports = toVercelHandler(handler);
