const { sql } = require("./_db");
const { getSessionFromEvent, isOwnerEmail, json } = require("./_auth");
const { sendMail } = require("./_email");

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
      console.error("[ticket-reply] falha ao enviar e-mail:", e);
    }
  }

  return json(200, { ok: true });
};
