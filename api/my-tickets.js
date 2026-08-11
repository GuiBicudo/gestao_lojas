const { sql } = require("./_db");
const { getSessionFromEvent, json } = require("./_auth");
const { cleanupExpiredTickets } = require("./_ticketCleanup");

const { toVercelHandler } = require("./_vercelAdapter");
async function handler(event) {
  const session = await getSessionFromEvent(event);
  if (!session) return json(401, { error: "not_authenticated" });

  await cleanupExpiredTickets();

  const rows = await sql`
    select t.id, t.subject, t.status, t.created_at, t.closed_at,
           (select max(created_at) from ticket_messages where ticket_id = t.id) as last_message_at,
           (select sender from ticket_messages where ticket_id = t.id order by created_at desc limit 1) as last_message_sender
    from tickets t
    where t.user_id = ${session.id}
    order by (t.status = 'open') desc, t.created_at desc
  `;

  return json(200, { tickets: rows });
}

module.exports = toVercelHandler(handler);
