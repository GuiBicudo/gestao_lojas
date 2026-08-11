// Agrupa ler e salvar o estado do app (antes eram state-get.js e state-save.js separados)
// num único arquivo — mesmo motivo dos outros agrupamentos: o plano gratuito da Vercel só
// permite até 12 Serverless Functions por projeto. Aqui nem precisa de um pedaço dinâmico
// na URL: GET /api/state lê, POST /api/state salva — o próprio método HTTP já diferencia.
const { sql } = require("./_db");
const { getSessionFromEvent, isOwnerEmail, json } = require("./_auth");
const { toVercelHandler } = require("./_vercelAdapter");

async function handleGet(event) {
  const session = await getSessionFromEvent(event);
  if (!session) return json(401, { error: "not_authenticated" });

  const rows = await sql`select data from app_state where user_id = ${session.id}`;
  const data = rows[0] ? rows[0].data : null;

  return json(200, { data });
}

async function handleSave(event) {
  const session = await getSessionFromEvent(event);
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
}

async function handler(event) {
  if (event.httpMethod === "GET") return handleGet(event);
  if (event.httpMethod === "POST") return handleSave(event);
  return json(405, { error: "method_not_allowed" });
}

module.exports = toVercelHandler(handler);
