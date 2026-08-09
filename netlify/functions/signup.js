const bcrypt = require("bcryptjs");
const { sql } = require("./_db");
const { isOwnerEmail, json } = require("./_auth");
const { sendMail } = require("./_email");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "invalid_json" });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  if (!email || !email.includes("@")) return json(400, { error: "E-mail inválido." });
  if (password.length < 8) return json(400, { error: "A senha precisa ter pelo menos 8 caracteres." });

  const existing = await sql`select id from users where email = ${email}`;
  if (existing.length > 0) {
    return json(400, { error: "Já existe um cadastro com esse e-mail." });
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
    return json(200, { message: "Cadastro enviado! Você poderá entrar assim que for aprovado." });
  }

  return json(200, { message: "Cadastro concluído. Você já pode entrar." });
};
