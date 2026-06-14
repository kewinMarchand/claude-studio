'use client'

import { useEffect } from 'react'

import type { Session } from '@/features/sessions/domain/session'
import { ProjectPicker } from '@/features/sessions/ui/ProjectPicker'
import { SessionBrowser } from '@/features/sessions/ui/SessionBrowser'
import type { Project } from '@/features/settings'

interface SidebarProps {
  open: boolean
  onClose: () => void
  projects: Project[]
  rootLabel: string
  cwd: string
  onChangeCwd: (path: string) => void
  onNewConversation: () => void
  sessions: Session.Summary[]
  sessionsLoading: boolean
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onOpenFile: (file: Session.FileRef) => void
}

export const Sidebar = ({
  open,
  onClose,
  projects,
  rootLabel,
  cwd,
  onChangeCwd,
  onNewConversation,
  sessions,
  sessionsLoading,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onOpenFile,
}: SidebarProps) => {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-label="Sessions"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer__head">
          <h2 className="drawer__title">Sessions</h2>
          <button type="button" className="drawer__close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </header>

        <div className="drawer__body">
          <ProjectPicker projects={projects} rootLabel={rootLabel} value={cwd} onChange={onChangeCwd} />

          <button type="button" className="sidebar__new" onClick={onNewConversation}>
            + Nouvelle conversation
          </button>

          <section className="sidebar__section sidebar__section--grow" aria-label="Conversations">
            <h3 className="sidebar__legend">Historique</h3>
            <SessionBrowser
              sessions={sessions}
              loading={sessionsLoading}
              currentCwd={cwd}
              activeId={activeSessionId}
              onSelect={onSelectSession}
              onDelete={onDeleteSession}
              onOpenFile={onOpenFile}
            />
          </section>
        </div>
      </aside>
    </div>
  )
}
