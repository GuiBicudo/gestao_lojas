const { sql } = require("./_db");
const { getSessionFromEvent, json } = require("./_auth");

exports.handler = async (event) => {
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
};
