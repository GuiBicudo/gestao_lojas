const { sql } = require("./_db");
const { getSessionFromEvent, json } = require("./_auth");

exports.handler = async (event) => {
  const session = getSessionFromEvent(event);
  if (!session) return json(401, { error: "not_authenticated" });

  const rows = await sql`
    select id, subject, status, created_at, closed_at
    from tickets
    where user_id = ${session.id}
    order by (status = 'open') desc, created_at desc
  `;

  return json(200, { tickets: rows });
};
