// Envio de e-mail (Resend) — sempre dentro de try/catch nos chamadores, para que uma falha
// no envio de e-mail nunca derrube o cadastro/aprovação em si.
const { Resend } = require("resend");

async function sendMail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[_email] RESEND_API_KEY não configurada — e-mail não enviado.");
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM || "Gestão de Lojas <onboarding@resend.dev>";
  await resend.emails.send({ from, to, subject, html });
}

module.exports = { sendMail };
