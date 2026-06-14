'use client'

import { useEffect, useState } from 'react'

import type { Session } from '@/features/sessions/domain/session'

const EMPTY: Session.ProjectFiles = { memory: [], project: [] }

/** Charge (paresseusement) les fichiers .claude/mémoire d'un projet. `enabled` déclenche le fetch. */
export const useProjectFiles = (cwd: string, enabled: boolean): { files: Session.ProjectFiles; loading: boolean } => {
  const [files, setFiles] = useState<Session.ProjectFiles>(EMPTY)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled || !cwd) return
    let cancelled = false
    setLoading(true)
    fetch(`/api/project-files?cwd=${encodeURIComponent(cwd)}`)
      .then((res) => res.json() as Promise<Session.ProjectFiles>)
      .then((d) => {
        if (!cancelled) setFiles(d)
      })
      .catch(() => {
        if (!cancelled) setFiles(EMPTY)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [cwd, enabled])

  return { files, loading }
}
