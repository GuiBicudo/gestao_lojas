// Helpers de sessão (JWT em cookie httpOnly) e checagem de admin, compartilhados pelas
// functions de autenticação/aprovação/estado.
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const { sql } = require("./_db");

const COOKIE_NAME = "gl_session";
const SESSION_DAYS = 30;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não configurada.");
  return secret;
}

function isOwnerEmail(email) {
  const owner = (process.env.OWNER_EMAIL || "").trim().toLowerCase();
  return !!owner && (email || "").trim().toLowerCase() === owner;
}

function signSessionCookie(user) {
  const token = jwt.sign(
    // "tv" (token version) fica gravado no próprio token, na hora que ele é emitido —
    // getSessionFromEvent compara com o valor atual no banco pra saber se essa sessão
    // ainda é válida ou se já foi revogada (logout, troca de senha).
    { sub: user.id, email: user.email, tv: user.token_version || 0 },
    getJwtSecret(),
    { expiresIn: `${SESSION_DAYS}d` }
  );
  return cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

function clearSessionCookie() {
  return cookie.serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

// Lê e valida a sessão a partir do header Cookie de um evento de Netlify Function.
// Retorna { id, email } ou null se não houver sessão válida.
// É assíncrona (faz uma consulta rápida ao banco) porque, além de validar a assinatura e
// validade do JWT, confere se o token não foi revogado desde que foi emitido — sem isso,
// um token continuaria funcionando normalmente por até 30 dias mesmo depois da pessoa
// clicar em "Sair" (JWT sozinho não tem como ser "invalidado", só expira sozinho).
async function getSessionFromEvent(event) {
  const header = event.headers && (event.headers.cookie || event.headers.Cookie);
  if (!header) return null;
  const parsed = cookie.parse(header);
  const token = parsed[COOKIE_NAME];
  if (!token) return null;

  let payload;
  try {
    payload = jwt.verify(token, getJwtSecret());
  } catch (e) {
    return null;
  }

  try {
    const rows = await sql`select token_version from users where id = ${payload.sub}`;
    const user = rows[0];
    if (!user || (user.token_version || 0) !== (payload.tv || 0)) return null;
  } catch (e) {
    console.error("[_auth] falha ao validar sessão:", e);
    return null;
  }

  return { id: payload.sub, email: payload.email };
}

function json(statusCode, body, extraHeaders) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...(extraHeaders || {}) },
    body: JSON.stringify(body),
  };
}

module.exports = {
  COOKIE_NAME,
  isOwnerEmail,
  signSessionCookie,
  clearSessionCookie,
  getSessionFromEvent,
  json,
};
