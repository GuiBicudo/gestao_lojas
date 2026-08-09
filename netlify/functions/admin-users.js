const { sql } = require("./_db");
const { getSessionFromEvent, isOwnerEmail, json } = require("./_auth");

exports.handler = async (event) => {
  const session = await getSessionFromEvent(event);
  if (!session || !isOwnerEmail(session.email)) return json(403, { error: "forbidden" });

  const rows = await sql`
    select id, email, status, created_at, approved_at, trial_ends_at, blocked_at
    from users
    order by created_at desc
  `;

  return json(200, { users: rows });
};
