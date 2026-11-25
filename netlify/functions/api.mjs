// Netlify Functions v2 (ESM murni): semua /api/* (lihat config.path) diteruskan ke Express (lib/app.js).
// Express dijalankan sebagai server HTTP lokal (127.0.0.1) di dalam function, lalu request diteruskan lewat fetch.
// Tanpa pembungkus CommonJS / serverless-http, jadi cocok dengan "type": "module" di package.json.
import http from 'node:http'

export const config = { path: '/api/*' }

let booting = null
function start() {
  return booting ??= (async () => {
    const { default: app } = await import('../../lib/app.js')
    const server = http.createServer(app)
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
    return server.address().port
  })().catch(e => { booting = null; throw e })
}

const DROP = new Set(['transfer-encoding', 'connection', 'keep-alive', 'content-encoding', 'content-length'])

export default async (req, context) => {
  const url = new URL(req.url)
  let port
  try { port = await start() }
  catch (e) {
    console.error('[api] gagal memuat app:', e)
    return Response.json({
      ok: false,
      error: { name: e?.name, message: String(e?.message || e).slice(0, 600), code: e?.code || null, stack: String(e?.stack || '').split('\n').slice(0, 6) }
    }, { status: 500 })
  }
  if (url.pathname === '/api/_diag') {
    return Response.json({ ok: true, node: process.version, cwd: process.cwd(), mongo: !!(process.env.MONGODB_URI || process.env.MONGO_URL), redis: !!(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) })
  }

  const headers = new Headers(req.headers)
  headers.set('accept-encoding', 'identity')
  headers.delete('content-length')
  const hasBody = !['GET', 'HEAD'].includes(req.method) && req.body
  const upstream = await fetch(`http://127.0.0.1:${port}${url.pathname}${url.search}`, {
    method: req.method,
    headers,
    body: hasBody ? req.body : undefined,
    duplex: hasBody ? 'half' : undefined,
    redirect: 'manual'
  })
  const out = new Headers()
  upstream.headers.forEach((v, k) => { if (!DROP.has(k.toLowerCase())) out.append(k, v) })
  for (const c of upstream.headers.getSetCookie?.() || []) if (!out.has('set-cookie')) out.append('set-cookie', c)
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: out })
}
