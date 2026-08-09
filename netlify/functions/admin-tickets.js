const { sql } = require("./_db");
const { getSessionFromEvent, isOwnerEmail, json } = require("./_auth");

exports.handler = async (event) => {
  const session = getSessionFromEvent(event);
  if (!session || !isOwnerEmail(session.email)) return json(403, { error: "forbidden" });

  const rows = await sql`
    select t.id, t.subject, t.message, t.status, t.created_at, t.closed_at,
           u.email as user_email,
           (select max(created_at) from ticket_messages where ticket_id = t.id) as last_message_at,
           (select sender from ticket_messages where ticket_id = t.id order by created_at desc limit 1) as last_message_sender
    from tickets t
    join users u on u.id = t.user_id
    order by (t.status = 'open') desc, t.created_at desc
  `;

  return json(200, { tickets: rows });
};
