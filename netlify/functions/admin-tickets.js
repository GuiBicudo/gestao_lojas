const { sql } = require("./_db");
const { getSessionFromEvent, isOwnerEmail, json } = require("./_auth");
const { cleanupExpiredTickets } = require("./_ticketCleanup");

exports.handler = async (event) => {
  const session = getSessionFromEvent(event);
  if (!session || !isOwnerEmail(session.email)) return json(403, { error: "forbidden" });

  await cleanupExpiredTickets();

  // Precisa envolver num subselect: "last_message_sender" é um apelido calculado, e o
  // Postgres não deixa usar apelido dentro de uma expressão no ORDER BY (só como nome puro),
  // então a comparação "= 'user'" quebrava a query inteira (por isso os tickets sumiram).
  const rows = await sql`
    select * from (
      select t.id, t.subject, t.message, t.status, t.created_at, t.closed_at,
             u.email as user_email,
             (select max(created_at) from ticket_messages where ticket_id = t.id) as last_message_at,
             (select sender from ticket_messages where ticket_id = t.id order by created_at desc limit 1) as last_message_sender
      from tickets t
      join users u on u.id = t.user_id
    ) sub
    order by (status = 'open') desc, (last_message_sender = 'user') desc, last_message_at desc nulls last, created_at desc
  `;

  return json(200, { tickets: rows });
};
