import { fetchCapabilities } from '@/features/capabilities/infrastructure/server/capabilities'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request): Promise<Response> {
  const cwd = new URL(req.url).searchParams.get('cwd') ?? ''
  try {
    const data = await fetchCapabilities(cwd)
    return Response.json(data)
  } catch {
    return Response.json({ commands: [], skills: [], agents: [], mcpServers: [] })
  }
}
