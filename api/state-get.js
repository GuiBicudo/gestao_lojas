const { sql } = require("./_db");
const { getSessionFromEvent, json } = require("./_auth");

const { toVercelHandler } = require("./_vercelAdapter");
async function handler(event) {
  const session = await getSessionFromEvent(event);
  if (!session) return json(401, { error: "not_authenticated" });

  const rows = await sql`select data from app_state where user_id = ${session.id}`;
  const data = rows[0] ? rows[0].data : null;

  return json(200, { data });
}

module.exports = toVercelHandler(handler);
