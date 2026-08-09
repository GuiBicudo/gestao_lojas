const { sql } = require("./_db");
const { getSessionFromEvent, isOwnerEmail, json } = require("./_auth");

exports.handler = async (event) => {
  const session = await getSessionFromEvent(event);
  if (!session) return json(200, { authenticated: false });

  // Já aproveita essa consulta (que já acontece a cada carregamento do app) pra marcar
  // "último acesso" — alimenta a coluna correspondente na aba Usuários, sem precisar de
  // uma escrita extra em toda requisição autenticada.
  const rows = await sql`
    update users set last_seen_at = now()
    where id = ${session.id}
    returning id, email, status, trial_ends_at, blocked_at
  `;
  const user = rows[0];
  if (!user || user.status !== "approved") return json(200, { authenticated: false });

  const isAdmin = isOwnerEmail(user.email);
  const blocked = !isAdmin && !!user.blocked_at;
  const trialExpired = !isAdmin && !!user.trial_ends_at && new Date(user.trial_ends_at) < new Date();

  return json(200, {
    authenticated: true,
    email: user.email,
    isAdmin,
    blocked,
    trialEndsAt: user.trial_ends_at,
    hasAccess: isAdmin || (!blocked && !trialExpired),
  });
};
