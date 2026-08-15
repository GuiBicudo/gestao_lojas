const { sql } = require("./_db");

// Ticket resolvido há mais de 24h é apagado sozinho (as mensagens vão junto, por causa do
// "on delete cascade" na tabela ticket_messages) — assim não acumula lixo no banco pra
// sempre. Sem job agendado à parte: essa função é chamada de forma "oportunista" sempre que
// alguém carrega a lista de tickets (aba Tickets do admin ou "Meus tickets" do usuário),
// que já acontece a cada poucos segundos por causa da checagem de notificação.
async function cleanupExpiredTickets() {
  try {
    await sql`delete from tickets where status = 'closed' and closed_at < now() - interval '24 hours'`;
  } catch (e) {
    console.error("[ticketCleanup] falha ao limpar tickets antigos:", e);
  }
}

module.exports = { cleanupExpiredTickets };
