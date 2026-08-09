const { sql } = require("./_db");
const { getSessionFromEvent, json } = require("./_auth");

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

  const data = body.data;
  if (data === undefined) return json(400, { error: "data é obrigatório." });

  await sql`
    insert into app_state (user_id, data, updated_at)
    values (${session.id}, ${JSON.stringify(data)}::jsonb, now())
    on conflict (user_id) do update set data = excluded.data, updated_at = now()
  `;

  return json(200, { ok: true });
};
