'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { formatCost, formatRelative } from '@/common/lib/format'
import type { Session } from '@/features/sessions/domain/session'
import { ProjectFiles } from '@/features/sessions/ui/ProjectFiles'

interface SessionBrowserProps {
  sessions: Session.Summary[]
  loading: boolean
  currentCwd: string
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onOpenFile: (file: Session.FileRef) => void
}

interface Group {
  root: string
  project: string
  sessions: Session.Summary[]
}

export const SessionBrowser = ({
  sessions,
  loading,
  currentCwd,
  activeId,
  onSelect,
  onDelete,
  onOpenFile,
}: SessionBrowserProps) => {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Set<string>>(new Set())
  const initRef = useRef(false)
  const now = Date.now()
  const q = query.trim().toLowerCase()

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>()
    for (const s of sessions) {
      if (q && !(s.title.toLowerCase().includes(q) || s.project.toLowerCase().includes(q))) continue
      const g = map.get(s.projectRoot) ?? { root: s.projectRoot, project: s.project, sessions: [] }
      g.sessions.push(s)
      map.set(s.projectRoot, g)
    }
    return [...map.values()].sort(
      (a, b) =>
        Math.max(...b.sessions.map((s) => s.updatedAt)) - Math.max(...a.sessions.map((s) => s.updatedAt)),
    )
  }, [sessions, q])

  // Déplie par défaut le projet courant (ou le plus récent) une fois les données chargées.
  useEffect(() => {
    if (initRef.current || groups.length === 0) return
    initRef.current = true
    const first = groups.find((g) => currentCwd.startsWith(g.root))?.root ?? groups[0].root
    setOpen(new Set([first]))
  }, [groups, currentCwd])

  const toggleOpen = (key: string) => {
    const next = new Set(open)
    next.has(key) ? next.delete(key) : next.add(key)
    setOpen(next)
  }

  return (
    <div className="browser">
      <input
        type="search"
        className="browser__search"
        placeholder="Rechercher une conversation…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Rechercher une conversation"
      />

      {loading && sessions.length === 0 ? (
        <p className="history__state">Chargement…</p>
      ) : groups.length === 0 ? (
        <p className="history__state">{q ? 'Aucun résultat.' : 'Aucune conversation.'}</p>
      ) : (
        <div className="accordions">
          {groups.map((g) => {
            const expanded = q ? true : open.has(g.root)
            return (
              <div key={g.root} className="accordion" data-open={expanded}>
                <button
                  type="button"
                  className="accordion__head"
                  aria-expanded={expanded}
                  onClick={() => toggleOpen(g.root)}
                >
                  <span className="accordion__chevron" aria-hidden="true">
                    {expanded ? '▾' : '▸'}
                  </span>
                  <span className="accordion__name">{g.project}</span>
                  <span className="accordion__count">{g.sessions.length}</span>
                </button>

                {expanded && (
                  <div className="accordion__body">
                    <ProjectFiles cwd={g.root} onOpenFile={onOpenFile} />

                    <span className="accordion__sub">Conversations</span>
                    <ul className="history">
                      {g.sessions.map((s) => (
                        <li key={s.id} className="history__li">
                          <button
                            type="button"
                            className="history__item"
                            aria-current={s.id === activeId}
                            onClick={() => onSelect(s.id)}
                          >
                            <span className="history__title">{s.title}</span>
                            <span className="history__meta">
                              <span>{formatRelative(s.updatedAt, now)}</span>
                              <span className="history__cost">{formatCost(s.costUsd)}</span>
                            </span>
                          </button>
                          <button
                            type="button"
                            className="history__del"
                            aria-label={`Supprimer « ${s.title} »`}
                            onClick={() => onDelete(s.id)}
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
