// Lokasi root proyek (folder yang berisi char/, data/, public/).
// Di Vercel/lokal, root = satu tingkat di atas lib/. Di Netlify, kode di-bundle sehingga import.meta.url
// menunjuk ke lokasi bundle, bukan lib/, jadi beberapa kandidat dicoba sampai ketemu yang punya folder char/.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const cands = [
  path.join(here, '..'),
  process.cwd(),
  process.env.LAMBDA_TASK_ROOT,
  '/var/task',
  path.join(here, '..', '..'),
  path.join(here, '..', '..', '..')
].filter(Boolean)

export const ROOT = cands.find(d => { try { return fs.statSync(path.join(d, 'char')).isDirectory() } catch { return false } }) || cands[0]
