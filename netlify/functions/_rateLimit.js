// Rate limiting simples pra login, cadastro e recuperação de senha — sem isso, alguém
// podia tentar senha atrás de senha (força bruta) de graça, sem nenhum limite (era o item
// "1. Rate limit ausente" da revisão de segurança). Guarda as tentativas no próprio Postgres
// (não em memória) porque cada chamada de function pode cair numa instância diferente —
// memória local não seria confiável pra isso.
const { sql } = require("./_db");

const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_ATTEMPTS_PER_IP = 20;
const MAX_ATTEMPTS_PER_EMAIL = 8;

// Netlify manda o IP de verdade do visitante nesse header (o "x-forwarded-for" também
// existe, mas pode ter mais de um IP encadeado — pega só o primeiro por garantia).
function getClientIp(event) {
  const headers = event.headers || {};
  const nfIp = headers["x-nf-client-connection-ip"] || headers["X-Nf-Client-Connection-Ip"];
  if (nfIp) return nfIp;
  const forwarded = headers["x-forwarded-for"] || headers["X-Forwarded-For"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

// Apaga tentativas com mais de 24h — evita que a tabela cresça pra sempre. Igual ao padrão
// já usado pra limpar tickets antigos: "de carona" numa chamada que já ia acontecer mesmo,
// em vez de precisar de um job agendado à parte.
async function cleanupOldAttempts() {
  try {
    await sql`delete from auth_attempts where created_at < now() - interval '24 hours'`;
  } catch (e) {
    console.error("[rateLimit] falha ao limpar tentativas antigas:", e);
  }
}

// scope: 'login' | 'signup' | 'forgot_password'. Retorna true se IP ou e-mail já bateram
// no limite de tentativas recentes e a ação deve ser bloqueada com 429.
async function isRateLimited(scope, ip, email) {
  await cleanupOldAttempts();
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const [byIp] = await sql`
    select count(*)::int as c from auth_attempts
    where scope = ${scope} and ip = ${ip} and created_at > ${since}
  `;
  if (byIp.c >= MAX_ATTEMPTS_PER_IP) return true;

  if (email) {
    const [byEmail] = await sql`
      select count(*)::int as c from auth_attempts
      where scope = ${scope} and email = ${email} and created_at > ${since}
    `;
    if (byEmail.c >= MAX_ATTEMPTS_PER_EMAIL) return true;
  }

  return false;
}

async function recordAttempt(scope, ip, email) {
  try {
    await sql`insert into auth_attempts (scope, ip, email) values (${scope}, ${ip}, ${email || null})`;
  } catch (e) {
    console.error("[rateLimit] falha ao registrar tentativa:", e);
  }
}

const RATE_LIMIT_RESPONSE = {
  error: "too_many_attempts",
  message: "Muitas tentativas. Aguarde alguns minutos antes de tentar de novo.",
};

module.exports = { getClientIp, isRateLimited, recordAttempt, RATE_LIMIT_RESPONSE };
