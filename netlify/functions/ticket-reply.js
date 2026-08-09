const { sql } = require("./_db");
const { getSessionFromEvent, isOwnerEmail, json } = require("./_auth");
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

  const { ticketId } = body;
  const message = (body.message || "").trim();
  if (!ticketId || !message) return json(400, { error: "ticketId e message são obrigatórios." });

  const [ticket] = await sql`select id, user_id, status from tickets where id = ${ticketId}`;
  if (!ticket) return json(404, { error: "Ticket não encontrado." });

  const isAdmin = isOwnerEmail(session.email);
  if (!isAdmin && ticket.user_id !== session.id) return json(403, { error: "forbidden" });

  const sender = isAdmin ? "admin" : "user";

  await sql`insert into ticket_messages (ticket_id, sender, message) values (${ticketId}, ${sender}, ${message})`;

  // Se o próprio usuário responde num ticket que já tinha sido marcado como resolvido,
  // reabre sozinho — ele está voltando a precisar de ajuda.
  if (!isAdmin && ticket.status === "closed") {
    await sql`update tickets set status = 'open', closed_at = null where id = ${ticketId}`;
  }

  try {
    if (isAdmin) {
      const [target] = await sql`select email from users where id = ${ticket.user_id}`;
      if (target) {
        await sendMail({
          to: target.email,
          subject: "Nova resposta no seu ticket — Gestão de Lojas",
          html: `<p>O administrador respondeu seu ticket:</p><p>${message.replace(/\n/g, "<br>")}</p>`,
        });
      }
    } else {
      await sendMail({
        to: process.env.OWNER_EMAIL,
        subject: "Nova resposta em um ticket — Gestão de Lojas",
        html: `<p><strong>${session.email}</strong> respondeu um ticket:</p><p>${message.replace(/\n/g, "<br>")}</p>`,
      });
    }
  } catch (e) {
    console.error("[ticket-reply] falha ao enviar e-mail:", e);
  }

  return json(200, { ok: true });
};
