import { fetchUsageLimits } from '@/features/sessions/infrastructure/server/usageLimits'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(): Promise<Response> {
  try {
    const limits = await fetchUsageLimits()
    return Response.json(limits)
  } catch {
    return Response.json({ session: null, week: null })
  }
}
