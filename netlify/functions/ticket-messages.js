const { sql } = require("./_db");
const { getSessionFromEvent, isOwnerEmail, json } = require("./_auth");

exports.handler = async (event) => {
  const session = await getSessionFromEvent(event);
  if (!session) return json(401, { error: "not_authenticated" });

  const ticketId = event.queryStringParameters && event.queryStringParameters.ticketId;
  if (!ticketId) return json(400, { error: "ticketId é obrigatório." });

  const [ticket] = await sql`select id, user_id, subject, status from tickets where id = ${ticketId}`;
  if (!ticket) return json(404, { error: "Ticket não encontrado." });

  const isAdmin = isOwnerEmail(session.email);
  if (!isAdmin && ticket.user_id !== session.id) return json(403, { error: "forbidden" });

  const messages = await sql`
    select id, sender, message, created_at
    from ticket_messages
    where ticket_id = ${ticketId}
    order by created_at asc
  `;

  return json(200, { ticket, messages });
};
