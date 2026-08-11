// Adaptador que permite reaproveitar as mesmas functions escritas no formato Netlify
// (que recebem um "event" e devolvem { statusCode, headers, body }) rodando na Vercel (que
// usa o formato Node.js clássico de servidor: (req, res)). Cada arquivo de rota só precisa
// exportar `toVercelHandler(handler)` no lugar de `exports.handler = handler` — o resto do
// código de cada function (validações, queries no banco, etc.) fica exatamente igual.
function toVercelHandler(fn) {
  return async (req, res) => {
    const event = {
      httpMethod: req.method,
      headers: req.headers || {},
      body: req.body !== undefined && req.body !== null && req.body !== "" ? JSON.stringify(req.body) : "",
      queryStringParameters: req.query || {},
    };

    let result;
    try {
      result = await fn(event);
    } catch (err) {
      console.error("[vercelAdapter] erro não tratado:", err);
      result = {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "internal_error" }),
      };
    }

    const headers = result.headers || {};
    Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
    res.status(result.statusCode).send(result.body);
  };
}

module.exports = { toVercelHandler };
