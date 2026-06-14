import { readTextFile } from '@/features/sessions/infrastructure/server/projectFiles'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request): Promise<Response> {
  const path = new URL(req.url).searchParams.get('path') ?? ''
  const content = await readTextFile(path)
  if (content === null) return Response.json({ error: 'Fichier inaccessible.' }, { status: 404 })
  return Response.json({ content })
}
