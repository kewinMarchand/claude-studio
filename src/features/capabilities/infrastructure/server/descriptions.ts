import { readFile, readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

export interface Entry {
  path: string
  description?: string
}
export interface DescriptionMaps {
  skills: Map<string, Entry>
  commands: Map<string, Entry>
  agents: Map<string, Entry>
}

interface FrontMatter {
  name?: string
  description?: string
}

/** Extrait `name`/`description` du frontmatter YAML simple (valeurs sur une ligne). */
const parseFrontMatter = (content: string): FrontMatter => {
  if (!content.startsWith('---')) return {}
  const end = content.indexOf('\n---', 3)
  if (end === -1) return {}
  const block = content.slice(3, end)
  const fm: FrontMatter = {}
  for (const line of block.split('\n')) {
    const m = line.match(/^(name|description):\s*(.+)$/)
    if (m) fm[m[1] as 'name' | 'description'] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  return fm
}

/** À défaut de frontmatter, première ligne de contenu utile. */
const firstLine = (content: string): string => {
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (t && t !== '---' && !t.startsWith('#')) return t
  }
  return ''
}

const safeReaddir = async (dir: string): Promise<string[]> => {
  try {
    return await readdir(dir)
  } catch {
    return []
  }
}

const readSkills = async (dirs: string[]): Promise<Map<string, Entry>> => {
  const map = new Map<string, Entry>()
  for (const dir of dirs) {
    for (const name of await safeReaddir(dir)) {
      const path = join(dir, name, 'SKILL.md')
      try {
        const content = await readFile(path, 'utf8')
        const fm = parseFrontMatter(content)
        map.set(name, { path, description: fm.description })
      } catch {
        /* pas de SKILL.md */
      }
    }
  }
  return map
}

const readMdDir = async (dirs: string[], keyBy: 'filename' | 'name'): Promise<Map<string, Entry>> => {
  const map = new Map<string, Entry>()
  for (const dir of dirs) {
    for (const file of await safeReaddir(dir)) {
      if (!file.endsWith('.md')) continue
      const path = join(dir, file)
      try {
        const content = await readFile(path, 'utf8')
        const fm = parseFrontMatter(content)
        const description = fm.description ?? firstLine(content) ?? undefined
        const key = keyBy === 'name' ? fm.name ?? file.replace(/\.md$/, '') : file.replace(/\.md$/, '')
        map.set(key, { path, description: description || undefined })
      } catch {
        /* ignoré */
      }
    }
  }
  return map
}

export const readDescriptions = async (cwd: string): Promise<DescriptionMaps> => {
  const home = homedir()
  const userClaude = join(home, '.claude')
  const projectClaude = cwd ? join(cwd, '.claude') : ''
  const dirs = (sub: string) => [join(userClaude, sub), ...(projectClaude ? [join(projectClaude, sub)] : [])]

  const [skills, commands, agents] = await Promise.all([
    readSkills(dirs('skills')),
    readMdDir(dirs('commands'), 'filename'),
    readMdDir(dirs('agents'), 'name'),
  ])
  return { skills, commands, agents }
}
