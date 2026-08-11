const crypto = require("crypto");
const { sql } = require("./_db");
const { json } = require("./_auth");
const { sendMail } = require("./_email");
const { getClientIp, isRateLimited, recordAttempt, RATE_LIMIT_RESPONSE } = require("./_rateLimit");

const { toVercelHandler } = require("./_vercelAdapter");
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function handler(event) {
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
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

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
      console.error("[forgot-password] falha ao enviar e-mail:", e);
    }
  }

  return json(200, genericMessage);
}

module.exports = toVercelHandler(handler);
