const { sql } = require("./_db");
const { getSessionFromEvent, isOwnerEmail, json } = require("./_auth");

exports.handler = async (event) => {
  const session = getSessionFromEvent(event);
  if (!session) return json(200, { authenticated: false });

  const rows = await sql`select id, email, status from users where id = ${session.id}`;
  const user = rows[0];
  if (!user || user.status !== "approved") return json(200, { authenticated: false });

  return json(200, {
    authenticated: true,
    email: user.email,
    isAdmin: isOwnerEmail(user.email),
  });
};
