const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { sql } = require("./_db");
const { json } = require("./_auth");

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "invalid_json" });
  }

  const token = body.token || "";
  const password = body.password || "";

  if (!token) return json(400, { error: "Link inválido ou expirado." });
  if (password.length < 8) return json(400, { error: "A senha precisa ter pelo menos 8 caracteres." });

  const tokenHash = hashToken(token);
  const rows = await sql`
    select id, user_id, expires_at, used
    from password_reset_tokens
    where token_hash = ${tokenHash}
  `;
  const record = rows[0];

  if (!record || record.used || new Date(record.expires_at) < new Date()) {
    return json(400, { error: "Link inválido ou expirado. Peça um novo link de recuperação." });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Também revoga qualquer sessão antiga (token_version + 1) — se a troca de senha foi
  // porque a conta estava comprometida, isso derruba o acesso de quem tinha a senha velha.
  await sql`update users set password_hash = ${passwordHash}, token_version = token_version + 1 where id = ${record.user_id}`;
  await sql`update password_reset_tokens set used = true where id = ${record.id}`;

  return json(200, { ok: true, message: "Senha redefinida! Você já pode entrar com a nova senha." });
};
