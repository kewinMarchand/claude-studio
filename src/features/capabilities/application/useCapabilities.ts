'use client'

import { useEffect, useState } from 'react'

import type { Capabilities } from '@/features/capabilities/domain/capabilities'

const EMPTY: Capabilities.Data = { commands: [], skills: [], agents: [], mcpServers: [] }

export interface UseCapabilities {
  data: Capabilities.Data
  loading: boolean
}

export const useCapabilities = (cwd: string): UseCapabilities => {
  const [data, setData] = useState<Capabilities.Data>(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/capabilities?cwd=${encodeURIComponent(cwd)}`)
      .then((res) => res.json() as Promise<Capabilities.Data>)
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch(() => {
        if (!cancelled) setData(EMPTY)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [cwd])

  return { data, loading }
}
