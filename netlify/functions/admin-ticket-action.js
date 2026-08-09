const { sql } = require("./_db");
const { getSessionFromEvent, isOwnerEmail, json } = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  const session = getSessionFromEvent(event);
  if (!session || !isOwnerEmail(session.email)) return json(403, { error: "forbidden" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "invalid_json" });
  }

  const { ticketId, action } = body;
  if (!ticketId || !action) return json(400, { error: "ticketId e action são obrigatórios." });

  if (action === "close") {
    await sql`update tickets set status = 'closed', closed_at = now() where id = ${ticketId}`;
  } else if (action === "reopen") {
    await sql`update tickets set status = 'open', closed_at = null where id = ${ticketId}`;
  } else if (action === "delete") {
    // Apaga o ticket e, por causa do "on delete cascade", todas as mensagens dele junto.
    await sql`delete from tickets where id = ${ticketId}`;
  } else {
    return json(400, { error: "Ação inválida." });
  }

  return json(200, { ok: true });
};
