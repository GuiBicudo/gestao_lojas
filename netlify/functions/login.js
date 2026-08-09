const bcrypt = require("bcryptjs");
const { sql } = require("./_db");
const { signSessionCookie, isOwnerEmail, json } = require("./_auth");

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

  const rows = await sql`select id, email, password_hash, status, blocked_at, trial_ends_at from users where email = ${email}`;
  const user = rows[0];

  // Mensagem genérica em caso de e-mail OU senha errados — evita confirmar para quem está
  // tentando adivinhar se um e-mail existe cadastrado (user enumeration).
  const genericError = { error: "invalid_credentials", message: "E-mail ou senha incorretos." };

  if (!user) return json(401, genericError);

  const passwordOk = await bcrypt.compare(password, user.password_hash);
  if (!passwordOk) return json(401, genericError);

  if (user.status === "pending") {
    return json(403, { error: "pending", message: "Seu cadastro ainda está aguardando aprovação." });
  }
  if (user.status === "rejected") {
    return json(403, { error: "rejected", message: "Seu cadastro não foi aprovado." });
  }

  const isOwner = isOwnerEmail(user.email);

  if (!isOwner && user.blocked_at) {
    return json(403, { error: "blocked", message: "Seu acesso foi bloqueado. Entre em contato com o administrador." });
  }

  // Trial vencido NÃO impede o login — a pessoa consegue entrar normalmente, mas as áreas
  // pagas ficam travadas dentro do app (ver /api/me e a checagem de acesso no front-end).
  // Isso permite mostrar um convite pra virar premium em vez de simplesmente barrar a porta.

  const setCookie = signSessionCookie({ id: user.id, email: user.email });
  return json(200, { ok: true }, { "Set-Cookie": setCookie });
};
