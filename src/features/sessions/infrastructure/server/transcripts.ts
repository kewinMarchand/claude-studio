import { readFile, readdir, stat, unlink } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, join } from 'node:path'

import { blockToText } from '@/common/lib/content'
import type { Chat } from '@/features/chat/domain/events'
import type { Session } from '@/features/sessions/domain/session'

const PROJECTS_DIR = join(homedir(), '.claude', 'projects')
const DAY_MS = 24 * 60 * 60 * 1000

// Racine des projets : un cwd sous cette racine est rattaché à son dossier de 1er niveau.
const PROJECTS_ROOT = process.env.CLAUDE_STUDIO_PROJECTS_ROOT || join(homedir(), 'Travail')

/** Rattache un cwd à son projet (dossier direct sous la racine), pour regrouper les sous-dossiers. */
const projectOf = (cwd: string): { label: string; root: string } => {
  if (cwd && cwd.startsWith(PROJECTS_ROOT + '/')) {
    const segment = cwd.slice(PROJECTS_ROOT.length + 1).split('/')[0]
    return { label: segment, root: join(PROJECTS_ROOT, segment) }
  }
  return { label: cwd ? basename(cwd) : '—', root: cwd }
}

interface RawUsage {
  input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
}

interface RawLine {
  type?: string
  cwd?: string
  aiTitle?: string
  timestamp?: string
  message?: { role?: string; content?: unknown; usage?: RawUsage; model?: string }
}

/** Tarifs API en $/million de tokens (entrée, sortie). */
const PRICING: { match: string; input: number; output: number }[] = [
  { match: 'fable', input: 10, output: 50 },
  { match: 'opus', input: 5, output: 25 },
  { match: 'sonnet', input: 3, output: 15 },
  { match: 'haiku', input: 1, output: 5 },
]
const DEFAULT_PRICE = { input: 3, output: 15 } // repli : tarif Sonnet

/** Coût d'une ligne : cache read = 0,1× entrée, cache write = 1,25× entrée. */
const lineCost = (u: RawUsage, model?: string): number => {
  const p = PRICING.find((r) => (model ?? '').includes(r.match)) ?? DEFAULT_PRICE
  const dollars =
    (u.input_tokens ?? 0) * p.input +
    (u.output_tokens ?? 0) * p.output +
    (u.cache_read_input_tokens ?? 0) * p.input * 0.1 +
    (u.cache_creation_input_tokens ?? 0) * p.input * 1.25
  return dollars / 1_000_000
}

const emptyTokens = (): Session.Tokens => ({ input: 0, output: 0, cacheRead: 0, cacheCreation: 0 })

const addUsage = (acc: Session.Tokens, u: RawUsage): void => {
  acc.input += u.input_tokens ?? 0
  acc.output += u.output_tokens ?? 0
  acc.cacheRead += u.cache_read_input_tokens ?? 0
  acc.cacheCreation += u.cache_creation_input_tokens ?? 0
}

const parseLines = (content: string): RawLine[] => {
  const lines: RawLine[] = []
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      lines.push(JSON.parse(trimmed) as RawLine)
    } catch {
      /* ligne ignorée */
    }
  }
  return lines
}

/** Nettoie un titre dérivé du 1er message : retire les wrappers de commande/caveat. */
const cleanTitle = (raw: string): string =>
  raw
    .replace(/<[^>]*>/g, ' ') // balises <local-command-caveat>, <command-name>…
    .replace(/Caveat:.*?asks you to\.\s*/is, ' ') // boilerplate des commandes locales
    .replace(/\s+/g, ' ')
    .trim()

const WRAPPER_RE = /^\s*<(local-command-caveat|command-name|command-message|command-args)/i

/** Un message texte qui est un wrapper de commande CLI (illisible). */
const isCommandWrapper = (text: string): boolean => WRAPPER_RE.test(text)

/** Nettoie un texte qui contient un wrapper de commande, pour l'affichage. */
const cleanWrapper = (text: string): string => (isCommandWrapper(text) ? cleanTitle(text) || text : text)

const firstUserText = (lines: RawLine[]): string => {
  for (const l of lines) {
    if (l.type !== 'user') continue
    const c = l.message?.content
    if (typeof c === 'string') return c
    if (Array.isArray(c)) {
      const text = c.find((b) => (b as { type?: string }).type === 'text') as { text?: string } | undefined
      if (text?.text) return text.text
    }
  }
  return ''
}

const COMMAND_NAME_RE = /<command-name>\s*\/?([\w:-]+)\s*<\/command-name>/i

/** Titre `/xxx` quand la session a été lancée par une commande (1er message = wrapper). */
const commandTitle = (lines: RawLine[]): string => {
  const m = firstUserText(lines).match(COMMAND_NAME_RE)
  return m ? `/${m[1]}` : ''
}

/** Une session sans aucune réponse de l'assistant est une sonde / commande avortée (illisible). */
const hasAssistantReply = (lines: RawLine[]): boolean => lines.some((l) => l.type === 'assistant')

const summarize = (lines: RawLine[], id: string, mtimeMs: number): Session.Summary => {
  const tokens = emptyTokens()
  let cwd = ''
  let title = ''
  let messageCount = 0
  let costUsd = 0

  for (const l of lines) {
    if (l.cwd && !cwd) cwd = l.cwd
    if (l.type === 'ai-title' && l.aiTitle) title = l.aiTitle
    if (l.type === 'user' || l.type === 'assistant') messageCount += 1
    const u = l.message?.usage
    if (u) {
      addUsage(tokens, u)
      costUsd += lineCost(u, l.message?.model)
    }
  }

  if (!title) {
    const cmd = commandTitle(lines)
    if (cmd) {
      title = cmd
    } else {
      const raw = cleanTitle(firstUserText(lines))
      title = raw ? raw.slice(0, 80) : 'Sans titre'
    }
  }

  const proj = projectOf(cwd)
  return {
    id,
    title,
    cwd,
    project: proj.label,
    projectRoot: proj.root,
    updatedAt: mtimeMs,
    messageCount,
    tokens,
    costUsd,
  }
}

interface TranscriptFile {
  id: string
  path: string
  mtimeMs: number
}

const collectFiles = async (): Promise<TranscriptFile[]> => {
  let projectDirs: string[]
  try {
    projectDirs = (await readdir(PROJECTS_DIR, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => join(PROJECTS_DIR, e.name))
  } catch {
    return []
  }

  const files: TranscriptFile[] = []
  for (const dir of projectDirs) {
    let entries: string[]
    try {
      entries = await readdir(dir)
    } catch {
      continue
    }
    for (const name of entries) {
      if (!name.endsWith('.jsonl')) continue
      try {
        const s = await stat(join(dir, name))
        files.push({ id: name.replace(/\.jsonl$/, ''), path: join(dir, name), mtimeMs: s.mtimeMs })
      } catch {
        /* ignoré */
      }
    }
  }
  return files
}

export const listSessions = async (limit = 250): Promise<Session.Summary[]> => {
  const files = (await collectFiles()).sort((a, b) => b.mtimeMs - a.mtimeMs).slice(0, limit)
  const summaries = await Promise.all(
    files.map(async (f) => {
      try {
        const lines = parseLines(await readFile(f.path, 'utf8'))
        // Exclut les sondes / commandes sans réponse (ex. /clear, /usage), illisibles.
        if (!hasAssistantReply(lines)) return null
        const summary = summarize(lines, f.id, f.mtimeMs)
        if (summary.messageCount === 0) return null
        if (summary.title === '.' || summary.title.startsWith('/usage')) return null
        return summary
      } catch {
        return null
      }
    }),
  )
  return summaries.filter((s): s is Session.Summary => s !== null)
}

export const weeklyUsage = async (now: number): Promise<Session.Weekly> => {
  const since = now - 7 * DAY_MS
  const files = (await collectFiles()).filter((f) => f.mtimeMs >= since)

  const tokens = emptyTokens()
  const byDayMap = new Map<string, number>()
  const sessions = new Set<string>()
  let messageCount = 0
  let costUsd = 0

  for (const f of files) {
    let lines: RawLine[]
    try {
      lines = parseLines(await readFile(f.path, 'utf8'))
    } catch {
      continue
    }
    for (const l of lines) {
      const ts = l.timestamp ? Date.parse(l.timestamp) : NaN
      if (Number.isNaN(ts) || ts < since) continue
      const u = l.message?.usage
      if (!u) continue
      addUsage(tokens, u)
      costUsd += lineCost(u, l.message?.model)
      messageCount += 1
      sessions.add(f.id)
      const day = new Date(ts).toISOString().slice(0, 10)
      const turn = (u.input_tokens ?? 0) + (u.output_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0)
      byDayMap.set(day, (byDayMap.get(day) ?? 0) + turn)
    }
  }

  const byDay: Session.DayUsage[] = []
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now - i * DAY_MS).toISOString().slice(0, 10)
    byDay.push({ date: day, tokens: byDayMap.get(day) ?? 0 })
  }

  return {
    tokens,
    totalTokens: tokens.input + tokens.output + tokens.cacheRead + tokens.cacheCreation,
    costUsd,
    messageCount,
    sessionCount: sessions.size,
    byDay,
  }
}

/** Reconstruit les messages affichables d'une session à partir de son transcript. */
export const loadSessionMessages = async (
  id: string,
): Promise<{ messages: Chat.Message[]; cwd: string; contextTokens: number } | null> => {
  const files = await collectFiles()
  const file = files.find((f) => f.id === id)
  if (!file) return null

  const lines = parseLines(await readFile(file.path, 'utf8'))
  const messages: Chat.Message[] = []
  const callIndex = new Map<string, Chat.ToolCall>()
  let cwd = ''
  let seq = 0
  let contextTokens = 0

  for (const l of lines) {
    if (l.cwd && !cwd) cwd = l.cwd
    const content = l.message?.content

    // Contexte du dernier tour = entrée + cache du dernier message assistant.
    const u = l.message?.usage
    if (l.type === 'assistant' && u) {
      contextTokens =
        (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0)
    }

    if (l.type === 'assistant' && Array.isArray(content)) {
      const msg: Chat.Message = { id: `h${seq++}`, role: 'assistant', text: '', thinking: '', toolCalls: [] }
      for (const block of content as Array<Record<string, unknown>>) {
        if (block.type === 'text') msg.text += String(block.text ?? '')
        else if (block.type === 'thinking') msg.thinking += String(block.thinking ?? '')
        else if (block.type === 'tool_use') {
          const call: Chat.ToolCall = { id: String(block.id), name: String(block.name), input: block.input }
          msg.toolCalls.push(call)
          callIndex.set(call.id, call)
        }
      }
      if (msg.text || msg.thinking || msg.toolCalls.length) messages.push(msg)
    } else if (l.type === 'user') {
      if (Array.isArray(content)) {
        let userText = ''
        for (const block of content as Array<Record<string, unknown>>) {
          if (block.type === 'text') userText += String(block.text ?? '')
          else if (block.type === 'tool_result') {
            const call = callIndex.get(String(block.tool_use_id))
            if (call) call.result = { content: blockToText(block.content), isError: Boolean(block.is_error) }
          }
        }
        if (userText.trim()) {
          messages.push({ id: `h${seq++}`, role: 'user', text: cleanWrapper(userText), thinking: '', toolCalls: [] })
        }
      } else if (typeof content === 'string' && content.trim()) {
        messages.push({ id: `h${seq++}`, role: 'user', text: cleanWrapper(content), thinking: '', toolCalls: [] })
      }
    }
  }

  return { messages, cwd, contextTokens }
}

/** Supprime le transcript d'une session (le fichier `.jsonl`). */
export const deleteSession = async (id: string): Promise<boolean> => {
  const file = (await collectFiles()).find((f) => f.id === id)
  if (!file) return false
  try {
    await unlink(file.path)
    return true
  } catch {
    return false
  }
}
