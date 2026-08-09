// Chamado quando um usuário sem acesso (trial vencido) clica em "Torne-se premium" numa
// área travada. Por enquanto só avisa o dono por e-mail — no futuro pode virar um link de
// pagamento de verdade (ex: Stripe/checkout), mantendo essa mesma rota como ponto de entrada.
const { sql } = require("./_db");
const { getSessionFromEvent, json } = require("./_auth");
const { sendMail } = require("./_email");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  const session = getSessionFromEvent(event);
  if (!session) return json(401, { error: "not_authenticated" });

  const [user] = await sql`select email, trial_ends_at from users where id = ${session.id}`;
  if (!user) return json(404, { error: "Usuário não encontrado." });

  try {
    await sendMail({
      to: process.env.OWNER_EMAIL,
      subject: "Pedido de acesso premium — Gestão de Lojas",
      html: `<p>O usuário <strong>${user.email}</strong> esbarrou numa área travada e clicou em "Torne-se premium".</p>
             <p>Trial dele venceu em: ${user.trial_ends_at ? new Date(user.trial_ends_at).toLocaleString("pt-BR") : "—"}</p>
             <p>Entre no sistema e acesse a aba "Usuários" pra estender o trial ou liberar o acesso.</p>`,
    });
  } catch (e) {
    console.error("[request-premium] falha ao enviar e-mail:", e);
  }

  return json(200, { ok: true });
};
