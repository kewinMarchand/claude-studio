import { readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const runtime = 'nodejs'

const ROOT = process.env.CLAUDE_STUDIO_PROJECTS_ROOT || homedir()

export async function GET(): Promise<Response> {
  try {
    const entries = await readdir(ROOT, { withFileTypes: true })
    const projects = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => ({ name: e.name, path: join(ROOT, e.name) }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return Response.json({ root: ROOT, projects })
  } catch {
    return Response.json({ root: ROOT, projects: [] })
  }
}
