import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { unlink } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude'
const PROJECTS_DIR = join(homedir(), '.claude', 'projects')

export interface LimitWindow {
  percent: number
  resets: string
}
export interface UsageLimits {
  session: LimitWindow | null
  week: LimitWindow | null
}

/** Supprime le transcript jetable créé par la sonde (évite de polluer l'historique). */
const deleteProbe = (cwd: string, sessionId: string): void => {
  void unlink(join(PROJECTS_DIR, cwd.replace(/\//g, '-'), `${sessionId}.jsonl`)).catch(() => {})
}

/** Exécute `claude -p /usage` (stream-json) et récupère texte + session_id pour nettoyage. */
const runUsageCommand = (): Promise<{ text: string; sessionId: string; cwd: string }> =>
  new Promise((resolve, reject) => {
    const cwd = process.cwd()
    const child = spawn(
      CLAUDE_BIN,
      ['-p', '/usage', '--output-format', 'stream-json', '--verbose', '--model', 'sonnet'],
      { cwd, env: process.env },
    )
    let text = ''
    let sessionId = ''
    const lines = createInterface({ input: child.stdout })
    lines.on('line', (line) => {
      const t = line.trim()
      if (!t) return
      try {
        const o = JSON.parse(t)
        if (o.type === 'system' && o.subtype === 'init') sessionId = o.session_id ?? ''
        if (o.type === 'result' && typeof o.result === 'string') text = o.result
      } catch {
        /* ignore */
      }
    })
    child.on('error', reject)
    child.on('close', () => resolve({ text, sessionId, cwd }))
    setTimeout(() => child.kill('SIGTERM'), 30_000)
  })

const parseWindow = (text: string, label: RegExp): LimitWindow | null => {
  const m = text.match(label)
  if (!m) return null
  return { percent: Number(m[1]), resets: m[2].trim() }
}

export const fetchUsageLimits = async (): Promise<UsageLimits> => {
  const { text, sessionId, cwd } = await runUsageCommand()
  if (sessionId) deleteProbe(cwd, sessionId)
  return {
    session: parseWindow(text, /Current session:\s*(\d+)%\s*used\s*·\s*resets\s*([^\n]+)/i),
    week: parseWindow(text, /Current week[^:]*:\s*(\d+)%\s*used\s*·\s*resets\s*([^\n]+)/i),
  }
}
