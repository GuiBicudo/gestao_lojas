const bcrypt = require("bcryptjs");
const { sql } = require("./_db");
const { signSessionCookie, isOwnerEmail, json } = require("./_auth");
const { getClientIp, isRateLimited, recordAttempt, RATE_LIMIT_RESPONSE } = require("./_rateLimit");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "invalid_json" });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const ip = getClientIp(event);

  // Limita tentativas de login por IP e por conta antes de sequer checar a senha — sem
  // isso, dava pra tentar senha atrás de senha sem limite nenhum (força bruta de graça).
  if (await isRateLimited("login", ip, email)) return json(429, RATE_LIMIT_RESPONSE);

  const rows = await sql`select id, email, password_hash, status, blocked_at, trial_ends_at, token_version from users where email = ${email}`;
  const user = rows[0];

  // Mensagem genérica em caso de e-mail OU senha errados — evita confirmar para quem está
  // tentando adivinhar se um e-mail existe cadastrado (user enumeration).
  const genericError = { error: "invalid_credentials", message: "E-mail ou senha incorretos." };

  if (!user) {
    await recordAttempt("login", ip, email);
    return json(401, genericError);
  }

  const passwordOk = await bcrypt.compare(password, user.password_hash);
  if (!passwordOk) {
    await recordAttempt("login", ip, email);
    return json(401, genericError);
  }

  if (user.status === "pending") {
    return json(403, { error: "pending", message: "Seu cadastro ainda está aguardando aprovação." });
  }
  if (user.status === "rejected") {
    return json(403, { error: "rejected", message: "Seu cadastro não foi aprovado." });
  }

  // Nem conta bloqueada nem trial vencido impedem o login — a pessoa consegue entrar
  // normalmente, e é o /api/me + o front-end que decidem o que ela vê: tela de "bloqueado"
  // com formulário de ticket, ou abas travadas com convite pra virar premium.

  const setCookie = signSessionCookie({ id: user.id, email: user.email, token_version: user.token_version });
  return json(200, { ok: true }, { "Set-Cookie": setCookie });
};
