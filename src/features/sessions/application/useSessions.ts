'use client'

import { useCallback, useEffect, useState } from 'react'

import type { Session } from '@/features/sessions/domain/session'

export interface UseSessions {
  sessions: Session.Summary[]
  loading: boolean
  refresh: () => void
}

export const useSessions = (): UseSessions => {
  const [sessions, setSessions] = useState<Session.Summary[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setLoading(true)
    fetch('/api/sessions')
      .then((res) => res.json() as Promise<{ sessions: Session.Summary[] }>)
      .then((data) => setSessions(data.sessions))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => refresh(), [refresh])

  return { sessions, loading, refresh }
}
