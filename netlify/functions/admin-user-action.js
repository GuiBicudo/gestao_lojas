const { sql } = require("./_db");
const { getSessionFromEvent, isOwnerEmail, json } = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  const session = await getSessionFromEvent(event);
  if (!session || !isOwnerEmail(session.email)) return json(403, { error: "forbidden" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "invalid_json" });
  }

  const { userId, action } = body;
  if (!userId || !action) return json(400, { error: "userId e action são obrigatórios." });

  const [target] = await sql`select email from users where id = ${userId}`;
  if (!target) return json(404, { error: "Usuário não encontrado." });
  if (isOwnerEmail(target.email)) return json(400, { error: "Não é possível alterar a conta do dono." });

  if (action === "block") {
    await sql`update users set blocked_at = now() where id = ${userId}`;
  } else if (action === "unblock") {
    await sql`update users set blocked_at = null where id = ${userId}`;
  } else if (action === "extend_trial") {
    const days = Number(body.days) || 7;
    await sql`
      update users
      set trial_ends_at = greatest(coalesce(trial_ends_at, now()), now()) + make_interval(days => ${days})
      where id = ${userId}
    `;
  } else if (action === "clear_trial") {
    await sql`update users set trial_ends_at = null where id = ${userId}`;
  } else if (action === "expire_trial") {
    // Força o trial pro passado agora mesmo — útil pra testar o bloqueio das abas sem
    // esperar dias de verdade passarem.
    await sql`update users set trial_ends_at = now() - interval '1 minute' where id = ${userId}`;
  } else {
    return json(400, { error: "Ação inválida." });
  }

  const [updated] = await sql`
    select id, email, status, created_at, approved_at, trial_ends_at, blocked_at
    from users where id = ${userId}
  `;

  return json(200, { ok: true, user: updated });
};
