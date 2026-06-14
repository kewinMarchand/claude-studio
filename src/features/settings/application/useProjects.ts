'use client'

import { useEffect, useState } from 'react'

export interface Project {
  name: string
  path: string
}

interface ProjectsResponse {
  root: string
  projects: Project[]
}

export const useProjects = (): { root: string; projects: Project[] } => {
  const [data, setData] = useState<ProjectsResponse>({ root: '', projects: [] })

  useEffect(() => {
    let cancelled = false
    fetch('/api/projects')
      .then((res) => res.json() as Promise<ProjectsResponse>)
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return data
}
