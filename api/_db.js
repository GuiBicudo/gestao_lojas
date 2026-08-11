// Cliente Neon compartilhado pelas functions. Usa o driver HTTP (@neondatabase/serverless)
// em vez do driver "pg" tradicional porque functions serverless sobem/derrubam conexões o
// tempo todo — um client baseado em HTTP evita esgotar o pool de conexões do Postgres.
const { neon } = require("@neondatabase/serverless");

if (!process.env.DATABASE_URL) {
  console.warn("[_db] DATABASE_URL não configurada — as functions vão falhar ao acessar o banco.");
}

const sql = neon(process.env.DATABASE_URL);

module.exports = { sql };
