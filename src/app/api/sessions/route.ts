import { listSessions } from '@/features/sessions/infrastructure/server/transcripts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  const sessions = await listSessions()
  return Response.json({ sessions })
}
