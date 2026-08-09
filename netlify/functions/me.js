const { sql } = require("./_db");
const { getSessionFromEvent, isOwnerEmail, json } = require("./_auth");

exports.handler = async (event) => {
  const session = getSessionFromEvent(event);
  if (!session) return json(200, { authenticated: false });

  const rows = await sql`select id, email, status, trial_ends_at, blocked_at from users where id = ${session.id}`;
  const user = rows[0];
  if (!user || user.status !== "approved") return json(200, { authenticated: false });

  const isAdmin = isOwnerEmail(user.email);

  // Se a conta foi bloqueada depois que a sessão já existia (cookie de até 30 dias), o /api/me
  // é chamado no carregamento da página e derruba a sessão mesmo sem precisar de logout explícito.
  if (!isAdmin && user.blocked_at) return json(200, { authenticated: false });

  const trialExpired = !isAdmin && !!user.trial_ends_at && new Date(user.trial_ends_at) < new Date();

  return json(200, {
    authenticated: true,
    email: user.email,
    isAdmin,
    trialEndsAt: user.trial_ends_at,
    hasAccess: isAdmin || !trialExpired,
  });
};
