const { sql } = require("./_db");
const { getSessionFromEvent, clearSessionCookie, json } = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  // Incrementa token_version além de limpar o cookie — assim o token que essa pessoa (ou
  // qualquer outra cópia dele, se tiver vazado de algum jeito) tinha guardado deixa de
  // funcionar imediatamente, em vez de continuar válido até expirar sozinho (30 dias).
  const session = await getSessionFromEvent(event);
  if (session) {
    await sql`update users set token_version = token_version + 1 where id = ${session.id}`;
  }

  return json(200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
};
