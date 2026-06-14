'use client'

import { useCallback, useEffect, useState } from 'react'

import type { Session } from '@/features/sessions/domain/session'

export interface UseUsage {
  weekly: Session.Weekly | null
  loading: boolean
  refresh: () => void
}

export const useUsage = (): UseUsage => {
  const [weekly, setWeekly] = useState<Session.Weekly | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setLoading(true)
    fetch('/api/usage')
      .then((res) => res.json() as Promise<{ weekly: Session.Weekly }>)
      .then((data) => setWeekly(data.weekly))
      .catch(() => setWeekly(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => refresh(), [refresh])

  return { weekly, loading, refresh }
}
