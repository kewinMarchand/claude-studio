'use client'

import { useEffect, useState } from 'react'

export interface Folder {
  name: string
  path: string
}

interface BrowseData {
  root: string
  path: string
  parent: string | null
  folders: Folder[]
}

const EMPTY: BrowseData = { root: '', path: '', parent: null, folders: [] }

/**
 * Navigation dans l'arborescence des dossiers à partir de la racine autorisée.
 * Ne fetch que lorsque `enabled` est vrai (popover ouvert), et resynchronise
 * sur `startPath` à chaque ouverture.
 */
export const useFolderBrowser = (
  enabled: boolean,
  startPath: string,
): BrowseData & { loading: boolean; browse: (path: string) => void } => {
  const [path, setPath] = useState(startPath)
  const [data, setData] = useState<BrowseData>(EMPTY)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (enabled) setPath(startPath)
  }, [enabled, startPath])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setLoading(true)
    const query = path ? `?path=${encodeURIComponent(path)}` : ''
    fetch(`/api/projects${query}`)
      .then((res) => res.json() as Promise<BrowseData>)
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled, path])

  return { ...data, loading, browse: setPath }
}
