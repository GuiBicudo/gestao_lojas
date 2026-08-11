// Agrupa as rotas de administração (aprovar cadastro, listar/agir sobre usuários, listar/agir
// sobre tickets) num único arquivo — mesmo motivo do api/auth/[action].js: o plano gratuito
// da Vercel só permite até 12 Serverless Functions por projeto. A rota vem do pedaço
// dinâmico da URL: /api/admin/pending, /api/admin/approve, /api/admin/users,
// /api/admin/user-action, /api/admin/tickets, /api/admin/ticket-action. A lógica de cada
// uma é exatamente a mesma que já existia nos arquivos separados.
const { sql } = require("../_db");
const { getSessionFromEvent, isOwnerEmail, json } = require("../_auth");
const { sendMail } = require("../_email");
const { cleanupExpiredTickets } = require("../_ticketCleanup");
const { toVercelHandler } = require("../_vercelAdapter");

async function handlePending(event) {
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

async function handleApprove(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  const session = await getSessionFromEvent(event);
  if (!session || !isOwnerEmail(session.email)) return json(403, { error: "forbidden" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "invalid_json" });
  }

  const userId = body.userId;
  const decision = body.decision === "reject" ? "rejected" : "approved";
  if (!userId) return json(400, { error: "userId é obrigatório." });

  const [user] = await sql`
    update users
    set status = ${decision},
        approved_at = case when ${decision} = 'approved' then now() else approved_at end,
        trial_ends_at = case when ${decision} = 'approved' then now() + make_interval(days => 7) else trial_ends_at end
    where id = ${userId} and status = 'pending'
    returning id, email
  `;

  if (!user) return json(404, { error: "Cadastro pendente não encontrado." });

  try {
    await sendMail({
      to: user.email,
      subject: decision === "approved"
        ? "Seu cadastro foi aprovado — ShopStock"
        : "Seu cadastro não foi aprovado — ShopStock",
      html: decision === "approved"
        ? `<p>Seu cadastro no ShopStock foi aprovado. Você já pode entrar com seu e-mail e senha.</p>`
        : `<p>Seu cadastro no ShopStock não foi aprovado.</p>`,
    });
  } catch (e) {
    console.error("[admin/approve] falha ao enviar e-mail:", e);
  }

  return json(200, { ok: true, status: decision });
}

async function handleUsers(event) {
  const session = await getSessionFromEvent(event);
  if (!session || !isOwnerEmail(session.email)) return json(403, { error: "forbidden" });

  const rows = await sql`
    select id, email, status, created_at, approved_at, trial_ends_at, blocked_at, last_seen_at
    from users
    order by created_at desc
  `;

  return json(200, { users: rows });
}

async function handleUserAction(event) {
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
    select id, email, status, created_at, approved_at, trial_ends_at, blocked_at, last_seen_at
    from users where id = ${userId}
  `;

  return json(200, { ok: true, user: updated });
}

async function handleTickets(event) {
  const session = await getSessionFromEvent(event);
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
}

async function handleTicketAction(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  const session = await getSessionFromEvent(event);
  if (!session || !isOwnerEmail(session.email)) return json(403, { error: "forbidden" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "invalid_json" });
  }

  const { ticketId, action } = body;
  if (!ticketId || !action) return json(400, { error: "ticketId e action são obrigatórios." });

  if (action === "close") {
    await sql`update tickets set status = 'closed', closed_at = now() where id = ${ticketId}`;
  } else if (action === "reopen") {
    await sql`update tickets set status = 'open', closed_at = null where id = ${ticketId}`;
  } else if (action === "delete") {
    // Apaga o ticket e, por causa do "on delete cascade", todas as mensagens dele junto.
    await sql`delete from tickets where id = ${ticketId}`;
  } else {
    return json(400, { error: "Ação inválida." });
  }

  return json(200, { ok: true });
}

async function handler(event) {
  const action = event.queryStringParameters && event.queryStringParameters.action;
  switch (action) {
    case "pending": return handlePending(event);
    case "approve": return handleApprove(event);
    case "users": return handleUsers(event);
    case "user-action": return handleUserAction(event);
    case "tickets": return handleTickets(event);
    case "ticket-action": return handleTicketAction(event);
    default: return json(404, { error: "not_found" });
  }
}

module.exports = toVercelHandler(handler);
