import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { unlink } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

import type { Capabilities } from '@/features/capabilities/domain/capabilities'
import { readDescriptions } from '@/features/capabilities/infrastructure/server/descriptions'

const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude'
const PROJECTS_DIR = join(homedir(), '.claude', 'projects')

interface InitEvent {
  type?: string
  subtype?: string
  session_id?: string
  slash_commands?: string[]
  skills?: string[]
  agents?: string[]
  mcp_servers?: Capabilities.McpServer[]
}

const deleteProbe = (cwd: string, sessionId: string): void => {
  void unlink(join(PROJECTS_DIR, cwd.replace(/\//g, '-'), `${sessionId}.jsonl`)).catch(() => {})
}

/**
 * Capture l'événement `system/init` (qui liste commandes, skills, agents, MCP)
 * puis tue le process : aucun tour de modèle n'est exécuté.
 */
export const fetchCapabilities = async (cwd: string): Promise<Capabilities.Data> => {
  const child = spawn(
    CLAUDE_BIN,
    ['-p', '.', '--output-format', 'stream-json', '--verbose', '--model', 'sonnet'],
    { cwd: cwd || process.cwd(), env: process.env },
  )

  const effectiveCwd = cwd || process.cwd()
  const lines = createInterface({ input: child.stdout })
  const timeout = setTimeout(() => child.kill('SIGTERM'), 30_000)
  let data: Capabilities.Data = { commands: [], skills: [], agents: [], mcpServers: [] }
  let sessionId = ''

  try {
    for await (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      let event: InitEvent
      try {
        event = JSON.parse(trimmed) as InitEvent
      } catch {
        continue
      }
      if (event.type === 'system' && event.subtype === 'init') {
        sessionId = event.session_id ?? ''
        const desc = await readDescriptions(cwd)
        const skillSet = new Set(event.skills ?? [])
        const toItems = (
          names: string[],
          map: Map<string, { path: string; description?: string }>,
        ): Capabilities.Item[] =>
          names.map((name) => {
            const e = map.get(name)
            return { name, description: e?.description, path: e?.path }
          })

        data = {
          // Commandes built-in = slash hors skills, on retire les variantes ":setup" de plugins.
          commands: toItems(
            (event.slash_commands ?? []).filter((c) => !skillSet.has(c) && !c.includes(':')),
            desc.commands,
          ),
          skills: toItems(event.skills ?? [], desc.skills),
          agents: toItems(event.agents ?? [], desc.agents),
          mcpServers: event.mcp_servers ?? [],
        }
        // On a tout ce qu'il faut : on coupe avant tout tour de modèle (≈ 0 token).
        child.kill('SIGTERM')
        break
      }
    }
  } finally {
    clearTimeout(timeout)
    if (!child.killed) child.kill('SIGTERM')
  }

  // Le transcript jetable de la sonde est supprimé (laisse le temps de l'écriture).
  if (sessionId) setTimeout(() => deleteProbe(effectiveCwd, sessionId), 1500)
  return data
}
