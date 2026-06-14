'use client'

import { useProjectFiles } from '@/features/sessions/application/useProjectFiles'
import type { Session } from '@/features/sessions/domain/session'

interface ProjectFilesProps {
  cwd: string
  onOpenFile: (file: Session.FileRef) => void
}

const FileButton = ({ file, onOpenFile }: { file: Session.FileRef; onOpenFile: (f: Session.FileRef) => void }) => (
  <li>
    <button type="button" className="pf__file" onClick={() => onOpenFile(file)}>
      <span className="pf__icon" aria-hidden="true">
        ◎
      </span>
      <span className="pf__name">{file.name}</span>
    </button>
  </li>
)

export const ProjectFiles = ({ cwd, onOpenFile }: ProjectFilesProps) => {
  const { files, loading } = useProjectFiles(cwd, true)
  const empty = files.memory.length === 0 && files.project.length === 0

  if (loading) return <p className="pf__state">Chargement des fichiers…</p>
  if (empty) return <p className="pf__state">Aucun fichier .claude ni mémoire.</p>

  return (
    <div className="pf">
      {files.project.length > 0 && (
        <div className="pf__group">
          <span className="pf__legend">Instructions</span>
          <ul className="pf__list">
            {files.project.map((f) => (
              <FileButton key={f.path} file={f} onOpenFile={onOpenFile} />
            ))}
          </ul>
        </div>
      )}
      {files.memory.length > 0 && (
        <div className="pf__group">
          <span className="pf__legend">Mémoire</span>
          <ul className="pf__list">
            {files.memory.map((f) => (
              <FileButton key={f.path} file={f} onOpenFile={onOpenFile} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
