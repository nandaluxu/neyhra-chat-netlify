// Entry Netlify: semua /api/* diarahkan ke sini (lihat netlify.toml), lalu ditangani Express (lib/app.js).
import serverless from 'serverless-http'
import app from '../../lib/app.js'

const PREFIX = '/.netlify/functions/api'
const inner = serverless(app, { binary: ['audio/*', 'image/*', 'application/octet-stream'] })

export const handler = async (event, context) => {
  // Pastikan Express selalu melihat path asli "/api/..." (baik lewat redirect maupun panggilan langsung ke /.netlify/functions/api)
  let p = event.path || '/'
  if (p.startsWith(PREFIX)) p = p.slice(PREFIX.length) || '/'
  if (!p.startsWith('/api')) p = '/api' + (p.startsWith('/') ? p : '/' + p)
  return inner({ ...event, path: p }, context)
}
