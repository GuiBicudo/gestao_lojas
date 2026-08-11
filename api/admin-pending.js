const { sql } = require("./_db");
const { getSessionFromEvent, isOwnerEmail, json } = require("./_auth");

const { toVercelHandler } = require("./_vercelAdapter");
async function handler(event) {
  const session = await getSessionFromEvent(event);
  if (!session || !isOwnerEmail(session.email)) return json(403, { error: "forbidden" });

  const rows = await sql`
    select id, email, created_at
    from users
    where status = 'pending'
    order by created_at asc
  `;

  return json(200, { pending: rows });
}

module.exports = toVercelHandler(handler);
