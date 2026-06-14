import type { ClaudeEvent } from '@/features/chat/domain/events'

export interface StudioError {
  type: 'studio_error'
  message: string
}
export interface StudioDone {
  type: 'studio_done'
}

export type StreamEvent = ClaudeEvent.Any | StudioError | StudioDone

export interface SendPayload {
  prompt: string
  model: string
  permissionMode: string
  effort?: string
  cwd: string
  appendSystemPrompt?: string
  resume?: string
}

/**
 * Envoie un prompt et émet chaque événement SSE parsé au fil de l'eau.
 * `signal` permet d'interrompre la requête (bouton Stop).
 */
export async function* sendPrompt(
  payload: SendPayload,
  signal: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })

  if (!res.ok || !res.body) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error || `Réponse HTTP ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const frames = buffer.split('\n\n')
    buffer = frames.pop() ?? ''

    for (const frame of frames) {
      const line = frame.trim()
      if (!line.startsWith('data:')) continue
      const json = line.slice(5).trim()
      if (!json) continue
      try {
        yield JSON.parse(json) as StreamEvent
      } catch {
        // Frame partielle ou malformée : ignorée.
      }
    }
  }
}
