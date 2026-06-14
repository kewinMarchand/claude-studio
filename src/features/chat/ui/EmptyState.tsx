interface EmptyStateProps {
  cwd: string
}

export const EmptyState = ({ cwd }: EmptyStateProps) => (
  <div className="empty">
    <div className="empty__logo" aria-hidden="true">
      ✳
    </div>
    <h2 className="empty__title">Claude Studio</h2>
    <p className="empty__text">
      Pilote Claude Code dans {cwd ? <code>{cwd}</code> : 'ton dossier de travail'}. Pose une question
      ou demande une modification.
    </p>
  </div>
)
