import { readFile, readdir, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, basename } from 'node:path'

export interface FileRef {
  name: string
  path: string
  category: 'memory' | 'project'
}

export interface ProjectFiles {
  memory: FileRef[]
  project: FileRef[]
}

/** Encodage Claude Code du cwd en nom de dossier : chaque « / » devient « - ». */
const encodeCwd = (cwd: string): string => cwd.replace(/\//g, '-')

const exists = async (p: string): Promise<boolean> => {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

/** Liste les .md d'un dossier (plat), triés. */
const listMd = async (dir: string, category: FileRef['category'], label = ''): Promise<FileRef[]> => {
  try {
    const names = await readdir(dir)
    return names
      .filter((n) => n.endsWith('.md'))
      .sort()
      .map((n) => ({ name: label ? `${label}/${n}` : n, path: join(dir, n), category }))
  } catch {
    return []
  }
}

export const readProjectFiles = async (cwd: string): Promise<ProjectFiles> => {
  if (!cwd) return { memory: [], project: [] }

  const memoryDir = join(homedir(), '.claude', 'projects', encodeCwd(cwd), 'memory')
  const memory = await listMd(memoryDir, 'memory')

  const project: FileRef[] = []
  // Fichiers de contexte à la racine du projet.
  for (const f of ['CLAUDE.md', 'AGENTS.md']) {
    const p = join(cwd, f)
    if (await exists(p)) project.push({ name: f, path: p, category: 'project' })
  }
  // Fichiers d'instruction de .claude/ (les agents/commandes sont dans le panneau Outils).
  const claudeDir = join(cwd, '.claude')
  for (const f of ['CLAUDE.md', 'settings.json', 'settings.local.json']) {
    const p = join(claudeDir, f)
    if (await exists(p)) project.push({ name: `.claude/${f}`, path: p, category: 'project' })
  }

  return { memory, project }
}

const ALLOWED_EXT = ['.md', '.mdx', '.txt', '.json', '.yaml', '.yml', '.toml']
const MAX_BYTES = 256 * 1024

/** Lit un fichier texte, restreint à l'arborescence du home et aux extensions sûres. */
export const readTextFile = async (path: string): Promise<string | null> => {
  const home = homedir()
  if (!path.startsWith(home + '/')) return null
  if (path.includes('..')) return null
  if (!ALLOWED_EXT.some((e) => path.toLowerCase().endsWith(e))) return null
  try {
    const s = await stat(path)
    if (s.size > MAX_BYTES) return `(Fichier trop volumineux : ${Math.round(s.size / 1024)} Ko)`
    return await readFile(path, 'utf8')
  } catch {
    return null
  }
}

export const fileLabel = (path: string): string => basename(path)
