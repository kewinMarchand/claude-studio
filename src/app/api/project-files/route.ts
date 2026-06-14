import { readProjectFiles } from '@/features/sessions/infrastructure/server/projectFiles'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request): Promise<Response> {
  const cwd = new URL(req.url).searchParams.get('cwd') ?? ''
  const files = await readProjectFiles(cwd)
  return Response.json(files)
}
