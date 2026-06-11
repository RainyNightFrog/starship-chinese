/** Vercel Serverless — CORS 包裝（兼容 Express handler 簽名） */
export function withCors(handler) {
  return async (req, res) => {
    const allowed = process.env.ALLOWED_ORIGINS
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const origin = req.headers.origin;
    if (allowed?.length && origin && allowed.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!allowed?.length) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    return handler(req, res);
  };
}
