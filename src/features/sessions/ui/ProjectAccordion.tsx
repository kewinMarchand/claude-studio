'use client'

import { formatCost, formatRelative } from '@/common/lib/format'
import { useProjectFiles } from '@/features/sessions/application/useProjectFiles'
import type { Session } from '@/features/sessions/domain/session'
import { Disclosure } from '@/features/sessions/ui/Disclosure'

interface Group {
  root: string
  project: string
  sessions: Session.Summary[]
}

interface ProjectAccordionProps {
  group: Group
  expanded: boolean
  searchActive: boolean
  now: number
  activeId: string | null
  onToggle: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onOpenFile: (file: Session.FileRef) => void
}

const FileList = ({ files, onOpenFile }: { files: Session.FileRef[]; onOpenFile: (f: Session.FileRef) => void }) => (
  <ul className="pf__list">
    {files.map((f) => (
      <li key={f.path}>
        <button type="button" className="pf__file" onClick={() => onOpenFile(f)}>
          <span className="pf__icon" aria-hidden="true">
            ◎
          </span>
          <span className="pf__name">{f.name}</span>
        </button>
      </li>
    ))}
  </ul>
)

export const ProjectAccordion = ({
  group,
  expanded,
  searchActive,
  now,
  activeId,
  onToggle,
  onSelect,
  onDelete,
  onOpenFile,
}: ProjectAccordionProps) => {
  const { files, loading } = useProjectFiles(group.root, expanded)

  return (
    <div className="accordion" data-open={expanded}>
      <button type="button" className="accordion__head" aria-expanded={expanded} onClick={onToggle}>
        <span className="accordion__chevron" aria-hidden="true">
          {expanded ? '▾' : '▸'}
        </span>
        <span className="accordion__name">{group.project}</span>
        <span className="accordion__count">{group.sessions.length}</span>
      </button>

      {expanded && (
        <div className="accordion__body">
          <Disclosure title="Conversations" count={group.sessions.length} defaultOpen={searchActive}>
            <ul className="history">
              {group.sessions.map((s) => (
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
          </Disclosure>

          <Disclosure title="Instructions" count={files.project.length}>
            {loading ? (
              <p className="pf__state">Chargement…</p>
            ) : files.project.length ? (
              <FileList files={files.project} onOpenFile={onOpenFile} />
            ) : (
              <p className="pf__state">Aucun fichier d’instruction.</p>
            )}
          </Disclosure>

          <Disclosure title="Mémoire" count={files.memory.length}>
            {loading ? (
              <p className="pf__state">Chargement…</p>
            ) : files.memory.length ? (
              <FileList files={files.memory} onOpenFile={onOpenFile} />
            ) : (
              <p className="pf__state">Aucune note de mémoire.</p>
            )}
          </Disclosure>
        </div>
      )}
    </div>
  )
}
