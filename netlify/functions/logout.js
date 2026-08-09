const { clearSessionCookie, json } = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });
  return json(200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
};
