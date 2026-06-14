import { runClaude } from '@/features/chat/infrastructure/server/claudeRunner'
import { ClaudeRunnerError } from '@/features/chat/domain/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 600

interface ChatRequest {
  prompt: string
  model: string
  permissionMode: string
  effort?: string
  cwd: string
  appendSystemPrompt?: string
  resume?: string
}

const sse = (event: unknown): Uint8Array =>
  new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as ChatRequest

  if (!body.prompt?.trim()) {
    return Response.json({ error: 'Prompt vide.' }, { status: 400 })
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of runClaude({
          prompt: body.prompt,
          model: body.model,
          permissionMode: body.permissionMode,
          effort: body.effort,
          cwd: body.cwd,
          appendSystemPrompt: body.appendSystemPrompt,
          resume: body.resume,
          signal: req.signal,
        })) {
          controller.enqueue(sse(event))
        }
      } catch (err) {
        const message =
          err instanceof ClaudeRunnerError ? err.message : 'Erreur inattendue du runner Claude.'
        controller.enqueue(sse({ type: 'studio_error', message }))
      } finally {
        controller.enqueue(sse({ type: 'studio_done' }))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
