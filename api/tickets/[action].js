// Agrupa as rotas de tickets de suporte do usuário (abrir, listar os seus, ver mensagens,
// responder) e o pedido de acesso premium num único arquivo — mesmo motivo do
// api/auth/[action].js: o plano gratuito da Vercel só permite até 12 Serverless Functions
// por projeto. A rota vem do pedaço dinâmico da URL: /api/tickets/create,
// /api/tickets/mine, /api/tickets/messages, /api/tickets/reply,
// /api/tickets/request-premium. A lógica de cada uma é exatamente a mesma que já existia
// nos arquivos separados.
const { sql } = require("../_db");
const { getSessionFromEvent, isOwnerEmail, json } = require("../_auth");
const { sendMail } = require("../_email");
const { cleanupExpiredTickets } = require("../_ticketCleanup");
const { toVercelHandler } = require("../_vercelAdapter");

async function handleCreate(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  const session = await getSessionFromEvent(event);
  if (!session) return json(401, { error: "not_authenticated" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "invalid_json" });
  }

  const subject = (body.subject || "").trim().slice(0, 200);
  const message = (body.message || "").trim().slice(0, 256);
  if (!message) return json(400, { error: "Escreva uma mensagem antes de enviar." });

  const [ticket] = await sql`
    insert into tickets (user_id, subject, message)
    values (${session.id}, ${subject || null}, ${message})
    returning id, created_at
  `;

  // A primeira mensagem também entra na conversa, pra "Seus tickets" e a aba de
  // Administração mostrarem tudo (inclusive o texto inicial) na mesma thread.
  await sql`insert into ticket_messages (ticket_id, sender, message) values (${ticket.id}, 'user', ${message})`;

  // Sem e-mail aqui de propósito: o aviso de ticket novo/mensagem nova é só dentro do
  // sistema (som + destaque na aba Tickets). E-mail fica reservado pra cadastro de conta.

  return json(200, { ok: true, ticket });
}

async function handleMine(event) {
  const session = await getSessionFromEvent(event);
  if (!session) return json(401, { error: "not_authenticated" });

  await cleanupExpiredTickets();

  const rows = await sql`
    select t.id, t.subject, t.status, t.created_at, t.closed_at,
           (select max(created_at) from ticket_messages where ticket_id = t.id) as last_message_at,
           (select sender from ticket_messages where ticket_id = t.id order by created_at desc limit 1) as last_message_sender
    from tickets t
    where t.user_id = ${session.id}
    order by (t.status = 'open') desc, t.created_at desc
  `;

  return json(200, { tickets: rows });
}

async function handleMessages(event) {
  const session = await getSessionFromEvent(event);
  if (!session) return json(401, { error: "not_authenticated" });

  const ticketId = event.queryStringParameters && event.queryStringParameters.ticketId;
  if (!ticketId) return json(400, { error: "ticketId é obrigatório." });

  const [ticket] = await sql`select id, user_id, subject, status from tickets where id = ${ticketId}`;
  if (!ticket) return json(404, { error: "Ticket não encontrado." });

  const isAdmin = isOwnerEmail(session.email);
  if (!isAdmin && ticket.user_id !== session.id) return json(403, { error: "forbidden" });

  const messages = await sql`
    select id, sender, message, created_at
    from ticket_messages
    where ticket_id = ${ticketId}
    order by created_at asc
  `;

  return json(200, { ticket, messages });
}

async function handleReply(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  const session = await getSessionFromEvent(event);
  if (!session) return json(401, { error: "not_authenticated" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "invalid_json" });
  }

  const { ticketId } = body;
  const message = (body.message || "").trim().slice(0, 256);
  if (!ticketId || !message) return json(400, { error: "ticketId e message são obrigatórios." });

  const [ticket] = await sql`select id, user_id, status from tickets where id = ${ticketId}`;
  if (!ticket) return json(404, { error: "Ticket não encontrado." });

  const isAdmin = isOwnerEmail(session.email);
  if (!isAdmin && ticket.user_id !== session.id) return json(403, { error: "forbidden" });

  // Ticket resolvido não aceita resposta do usuário — evita reabrir sozinho por engano.
  // Se precisar de mais alguma coisa, é pra abrir um ticket novo. O admin continua podendo
  // responder normalmente (pra deixar uma última nota, por exemplo).
  if (!isAdmin && ticket.status === "closed") {
    return json(403, { error: "ticket_closed", message: "Esse ticket já foi resolvido. Abra um novo ticket se precisar de mais alguma coisa." });
  }

  const sender = isAdmin ? "admin" : "user";

  await sql`insert into ticket_messages (ticket_id, sender, message) values (${ticketId}, ${sender}, ${message})`;

  // Só avisa por e-mail quando é o ADMIN respondendo (o usuário precisa saber, já que ele
  // pode não estar com o site aberto). Resposta do usuário pro admin não manda e-mail —
  // fica só o aviso dentro do sistema (som + destaque na aba Tickets).
  if (isAdmin) {
    try {
      const [target] = await sql`select email from users where id = ${ticket.user_id}`;
      if (target) {
        await sendMail({
          to: target.email,
          subject: "Nova resposta no seu ticket — Gestão de Lojas",
          html: `<p>O administrador respondeu seu ticket:</p><p>${message.replace(/\n/g, "<br>")}</p>`,
        });
      }
    } catch (e) {
      console.error("[tickets/reply] falha ao enviar e-mail:", e);
    }
  }

  return json(200, { ok: true });
}

// Chamado quando um usuário sem acesso (trial vencido) clica em "Torne-se premium" numa
// área travada. Por enquanto só avisa o dono por e-mail — no futuro pode virar um link de
// pagamento de verdade (ex: Stripe/checkout), mantendo essa mesma rota como ponto de entrada.
async function handleRequestPremium(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  const session = await getSessionFromEvent(event);
  if (!session) return json(401, { error: "not_authenticated" });

  const [user] = await sql`select email, trial_ends_at from users where id = ${session.id}`;
  if (!user) return json(404, { error: "Usuário não encontrado." });

  try {
    await sendMail({
      to: process.env.OWNER_EMAIL,
      subject: "Pedido de acesso premium — Gestão de Lojas",
      html: `<p>O usuário <strong>${user.email}</strong> esbarrou numa área travada e clicou em "Torne-se premium".</p>
             <p>Trial dele venceu em: ${user.trial_ends_at ? new Date(user.trial_ends_at).toLocaleString("pt-BR") : "—"}</p>
             <p>Entre no sistema e acesse a aba "Usuários" pra estender o trial ou liberar o acesso.</p>`,
    });
  } catch (e) {
    console.error("[tickets/request-premium] falha ao enviar e-mail:", e);
  }

  return json(200, { ok: true });
}

async function handler(event) {
  const action = event.queryStringParameters && event.queryStringParameters.action;
  switch (action) {
    case "create": return handleCreate(event);
    case "mine": return handleMine(event);
    case "messages": return handleMessages(event);
    case "reply": return handleReply(event);
    case "request-premium": return handleRequestPremium(event);
    default: return json(404, { error: "not_found" });
  }
}

module.exports = toVercelHandler(handler);
