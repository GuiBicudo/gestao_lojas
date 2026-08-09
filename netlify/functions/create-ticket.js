const { sql } = require("./_db");
const { getSessionFromEvent, json } = require("./_auth");
const { sendMail } = require("./_email");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  const session = getSessionFromEvent(event);
  if (!session) return json(401, { error: "not_authenticated" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "invalid_json" });
  }

  const subject = (body.subject || "").trim().slice(0, 200);
  const message = (body.message || "").trim();
  if (!message) return json(400, { error: "Escreva uma mensagem antes de enviar." });

  const [ticket] = await sql`
    insert into tickets (user_id, subject, message)
    values (${session.id}, ${subject || null}, ${message})
    returning id, created_at
  `;

  try {
    await sendMail({
      to: process.env.OWNER_EMAIL,
      subject: "Novo ticket de suporte — Gestão de Lojas",
      html: `<p><strong>${session.email}</strong> abriu um ticket:</p>
             <p><strong>Assunto:</strong> ${subject || "(sem assunto)"}</p>
             <p><strong>Mensagem:</strong><br>${message.replace(/\n/g, "<br>")}</p>
             <p>Entre no sistema e acesse a aba "Tickets" para responder.</p>`,
    });
  } catch (e) {
    console.error("[create-ticket] falha ao enviar e-mail:", e);
  }

  return json(200, { ok: true, ticket });
};
