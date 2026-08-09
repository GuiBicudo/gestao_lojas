const { sql } = require("./_db");
const { getSessionFromEvent, isOwnerEmail, json } = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  const session = getSessionFromEvent(event);
  if (!session) return json(401, { error: "not_authenticated" });

  // Defesa extra: mesmo com o front-end travando a tela, o backend também recusa salvar
  // dados novos se a conta foi bloqueada ou o trial venceu (sessões antigas de até 30 dias
  // não sabem disso sozinhas).
  if (!isOwnerEmail(session.email)) {
    const [user] = await sql`select trial_ends_at, blocked_at from users where id = ${session.id}`;
    if (user && user.blocked_at) {
      return json(403, { error: "blocked", message: "Seu acesso foi bloqueado." });
    }
    if (user && user.trial_ends_at && new Date(user.trial_ends_at) < new Date()) {
      return json(403, { error: "trial_expired", message: "Seu período de teste expirou." });
    }
  }

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
