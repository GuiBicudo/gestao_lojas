const { sql } = require("./_db");
const { getSessionFromEvent, isOwnerEmail, json } = require("./_auth");
const { sendMail } = require("./_email");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  const session = await getSessionFromEvent(event);
  if (!session || !isOwnerEmail(session.email)) return json(403, { error: "forbidden" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "invalid_json" });
  }

  const userId = body.userId;
  const decision = body.decision === "reject" ? "rejected" : "approved";
  if (!userId) return json(400, { error: "userId é obrigatório." });

  const [user] = await sql`
    update users
    set status = ${decision},
        approved_at = case when ${decision} = 'approved' then now() else approved_at end,
        trial_ends_at = case when ${decision} = 'approved' then now() + make_interval(days => 7) else trial_ends_at end
    where id = ${userId} and status = 'pending'
    returning id, email
  `;

  if (!user) return json(404, { error: "Cadastro pendente não encontrado." });

  try {
    await sendMail({
      to: user.email,
      subject: decision === "approved"
        ? "Seu cadastro foi aprovado — Gestão de Lojas"
        : "Seu cadastro não foi aprovado — Gestão de Lojas",
      html: decision === "approved"
        ? `<p>Seu cadastro no Gestão de Lojas foi aprovado. Você já pode entrar com seu e-mail e senha.</p>`
        : `<p>Seu cadastro no Gestão de Lojas não foi aprovado.</p>`,
    });
  } catch (e) {
    console.error("[admin-approve] falha ao enviar e-mail:", e);
  }

  return json(200, { ok: true, status: decision });
};
