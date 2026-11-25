// Entry Netlify: semua /api/* diarahkan ke sini (lihat netlify.toml), lalu ditangani Express (lib/app.js).
// App dimuat lewat import dinamis supaya kalau gagal dimuat, penyebabnya tampil di /api/_diag (bukan 502 kosong).
const PREFIX = '/.netlify/functions/api'
let inner = null, loadError = null

async function boot() {
  if (inner || loadError) return
  try {
    const [{ default: serverless }, { default: app }] = await Promise.all([import('serverless-http'), import('../../lib/app.js')])
    inner = serverless(app, { binary: ['audio/*', 'image/*', 'application/octet-stream'] })
  } catch (e) {
    loadError = e
    console.error('[api] gagal memuat app:', e)
  }
}

export const handler = async (event, context) => {
  let p = event.path || '/'
  if (p.startsWith(PREFIX)) p = p.slice(PREFIX.length) || '/'
  if (!p.startsWith('/api')) p = '/api' + (p.startsWith('/') ? p : '/' + p)

  await boot()
  if (p === '/api/_diag' || loadError) {
    return {
      statusCode: loadError ? 500 : 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ok: !loadError,
        node: process.version,
        cwd: process.cwd(),
        task: process.env.LAMBDA_TASK_ROOT || null,
        netlify: !!process.env.NETLIFY,
        mongo: !!(process.env.MONGODB_URI || process.env.MONGO_URL),
        error: loadError ? { name: loadError.name, message: String(loadError.message).slice(0, 600), code: loadError.code || null, stack: String(loadError.stack || '').split('\n').slice(0, 6) } : null
      })
    }
  }
  return inner({ ...event, path: p }, context)
}
