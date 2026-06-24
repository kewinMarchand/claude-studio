'use client'

import { useEffect, useRef, useState } from 'react'

import { useFolderBrowser } from '@/features/settings/application/useFolderBrowser'

interface WorkspacePickerProps {
  value: string
  onChange: (path: string) => void
  className?: string
}

const relativeToRoot = (path: string, root: string): string => {
  if (!path || path === root) return '~'
  if (root && path.startsWith(root + '/')) return '~/' + path.slice(root.length + 1)
  return path
}

const labelOf = (value: string): string => {
  if (!value) return 'Dossier par défaut'
  const name = value.split('/').filter(Boolean).pop()
  return name ?? value
}

export const WorkspacePicker = ({ value, onChange, className }: WorkspacePickerProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { root, path, parent, folders, loading, browse } = useFolderBrowser(open, value)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const here = relativeToRoot(path, root)

  return (
    <div className={`wpick${className ? ` ${className}` : ''}`} ref={ref}>
      <button
        type="button"
        className="wpick__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        title="Dossier de travail (où Claude opère)"
      >
        {labelOf(value)}
      </button>

      {open && (
        <div className="wpick__panel" role="dialog" aria-label="Choisir le dossier de travail">
          <p className="wpick__path" title={path || root}>
            {here}
          </p>

          <div className="wpick__list">
            {parent !== null && (
              <button type="button" className="wpick__item wpick__item--up" onClick={() => browse(parent)}>
                ⬆ Dossier parent
              </button>
            )}
            {folders.map((f) => (
              <button key={f.path} type="button" className="wpick__item" onClick={() => browse(f.path)}>
                <span className="wpick__icon" aria-hidden="true">📁</span>
                {f.name}
              </button>
            ))}
            {!loading && folders.length === 0 && <p className="wpick__empty">Aucun sous-dossier.</p>}
          </div>

          <button
            type="button"
            className="wpick__choose"
            onClick={() => {
              onChange(path === root ? '' : path)
              setOpen(false)
            }}
          >
            ✓ Travailler dans « {here} »
          </button>
        </div>
      )}
    </div>
  )
}
