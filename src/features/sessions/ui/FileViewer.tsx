'use client'

import { useEffect, useState } from 'react'

import { Markdown } from '@/common/ui/Markdown'

export interface ViewableFile {
  name: string
  path: string
}

interface FileViewerProps {
  file: ViewableFile | null
  onClose: () => void
}

export const FileViewer = ({ file, onClose }: FileViewerProps) => {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!file) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [file, onClose])

  useEffect(() => {
    if (!file) {
      setContent(null)
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(`/api/file?path=${encodeURIComponent(file.path)}`)
      .then((res) => (res.ok ? (res.json() as Promise<{ content: string }>) : Promise.reject()))
      .then((d) => {
        if (!cancelled) setContent(d.content)
      })
      .catch(() => {
        if (!cancelled) setContent('Fichier inaccessible.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [file])

  if (!file) return null
  const isMd = /\.mdx?$/.test(file.path)

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="fileviewer" role="dialog" aria-label={file.name} onClick={(e) => e.stopPropagation()}>
        <header className="drawer__head">
          <h2 className="fileviewer__title" title={file.path}>
            {file.name}
          </h2>
          <button type="button" className="drawer__close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </header>
        <div className="fileviewer__body">
          {loading ? (
            <p className="caps__state">Chargement…</p>
          ) : isMd && content ? (
            <Markdown>{content}</Markdown>
          ) : (
            <pre className="fileviewer__pre">{content}</pre>
          )}
        </div>
      </div>
    </div>
  )
}
