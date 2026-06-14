import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { createInterface } from 'node:readline'

import { ClaudeNotFoundError, ClaudeRunnerError } from '@/features/chat/domain/errors'
import type { ClaudeEvent } from '@/features/chat/domain/events'

export interface RunOptions {
  prompt: string
  model: string
  permissionMode: string
  effort?: string
  cwd: string
  appendSystemPrompt?: string
  /** Session à reprendre pour conserver le contexte multi-tours. */
  resume?: string
  /** Permet d'interrompre le process (bouton Stop). */
  signal?: AbortSignal
}

const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude'

const buildArgs = (opts: RunOptions): string[] => {
  const args = [
    '-p',
    opts.prompt,
    '--output-format',
    'stream-json',
    '--verbose',
    '--model',
    opts.model,
    '--permission-mode',
    opts.permissionMode,
  ]
  if (opts.effort) args.push('--effort', opts.effort)
  if (opts.resume) args.push('--resume', opts.resume)
  if (opts.appendSystemPrompt?.trim()) {
    args.push('--append-system-prompt', opts.appendSystemPrompt.trim())
  }
  return args
}

/**
 * Lance `claude` en mode streaming et émet chaque événement JSON parsé.
 * Le process hérite du cwd fourni : Claude opère dans le dossier de travail choisi.
 */
export async function* runClaude(opts: RunOptions): AsyncGenerator<ClaudeEvent.Any> {
  let child: ChildProcessWithoutNullStreams
  try {
    child = spawn(CLAUDE_BIN, buildArgs(opts), {
      cwd: opts.cwd || process.cwd(),
      env: process.env,
    })
  } catch {
    throw new ClaudeNotFoundError()
  }

  const onAbort = () => child.kill('SIGTERM')
  opts.signal?.addEventListener('abort', onAbort, { once: true })

  const stderrChunks: string[] = []
  child.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk.toString()))

  const spawnError = new Promise<never>((_, reject) => {
    child.on('error', (err: NodeJS.ErrnoException) => {
      reject(err.code === 'ENOENT' ? new ClaudeNotFoundError() : new ClaudeRunnerError(err.message))
    })
  })
  // Évite un rejet non géré si le process se termine sans erreur de spawn.
  spawnError.catch(() => {})

  const lines = createInterface({ input: child.stdout, crlfDelay: Infinity })

  try {
    for await (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        yield JSON.parse(trimmed) as ClaudeEvent.Any
      } catch {
        // Ligne non-JSON (ex. message de progression) : ignorée.
      }
    }

    const exitCode: number = await new Promise((resolve) => child.on('close', resolve))
    if (exitCode !== 0 && !opts.signal?.aborted) {
      const stderr = stderrChunks.join('').trim()
      throw new ClaudeRunnerError(stderr || `claude s'est terminé avec le code ${exitCode}`)
    }
  } finally {
    opts.signal?.removeEventListener('abort', onAbort)
    if (!child.killed) child.kill('SIGTERM')
  }
}
