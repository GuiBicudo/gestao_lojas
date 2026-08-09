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

  // Nem conta bloqueada nem trial vencido impedem o login — a pessoa consegue entrar
  // normalmente, e é o /api/me + o front-end que decidem o que ela vê: tela de "bloqueado"
  // com formulário de ticket, ou abas travadas com convite pra virar premium.

  const setCookie = signSessionCookie({ id: user.id, email: user.email });
  return json(200, { ok: true }, { "Set-Cookie": setCookie });
};
