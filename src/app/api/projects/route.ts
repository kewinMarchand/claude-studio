import { readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

export const runtime = 'nodejs'

const ROOT = process.env.CLAUDE_STUDIO_PROJECTS_ROOT || homedir()

// Empêche de remonter au-dessus de la racine autorisée.
const within = (target: string): boolean => target === ROOT || target.startsWith(ROOT + '/')

export async function GET(req: Request): Promise<Response> {
  const requested = new URL(req.url).searchParams.get('path')
  const dir = requested && within(resolve(requested)) ? resolve(requested) : ROOT
  const parent = dir === ROOT ? null : resolve(dir, '..')

  try {
    const entries = await readdir(dir, { withFileTypes: true })
    const folders = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => ({ name: e.name, path: join(dir, e.name) }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return Response.json({ root: ROOT, path: dir, parent, folders })
  } catch {
    return Response.json({ root: ROOT, path: dir, parent, folders: [] })
  }
}
