'use client'

import { useCallback, useEffect, useState } from 'react'

export interface LimitWindow {
  percent: number
  resets: string
}
export interface UsageLimits {
  session: LimitWindow | null
  week: LimitWindow | null
}

export interface UseUsageLimits {
  limits: UsageLimits | null
  loading: boolean
  refresh: () => void
}

export const useUsageLimits = (): UseUsageLimits => {
  const [limits, setLimits] = useState<UsageLimits | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setLoading(true)
    fetch('/api/usage-limits')
      .then((res) => res.json() as Promise<UsageLimits>)
      .then(setLimits)
      .catch(() => setLimits(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => refresh(), [refresh])

  return { limits, loading, refresh }
}
