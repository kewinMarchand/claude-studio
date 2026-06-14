import { deleteSession, loadSessionMessages } from '@/features/sessions/infrastructure/server/transcripts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params
  const data = await loadSessionMessages(id)
  if (!data) return Response.json({ error: 'Session introuvable.' }, { status: 404 })
  return Response.json(data)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params
  const ok = await deleteSession(id)
  return Response.json({ ok }, { status: ok ? 200 : 404 })
}
