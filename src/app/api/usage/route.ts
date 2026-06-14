import { weeklyUsage } from '@/features/sessions/infrastructure/server/transcripts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  const weekly = await weeklyUsage(Date.now())
  return Response.json({ weekly })
}
