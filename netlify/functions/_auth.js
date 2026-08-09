// Helpers de sessão (JWT em cookie httpOnly) e checagem de admin, compartilhados pelas
// functions de autenticação/aprovação/estado.
const jwt = require("jsonwebtoken");
const cookie = require("cookie");

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
    { sub: user.id, email: user.email },
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
function getSessionFromEvent(event) {
  const header = event.headers && (event.headers.cookie || event.headers.Cookie);
  if (!header) return null;
  const parsed = cookie.parse(header);
  const token = parsed[COOKIE_NAME];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getJwtSecret());
    return { id: payload.sub, email: payload.email };
  } catch (e) {
    return null;
  }
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
