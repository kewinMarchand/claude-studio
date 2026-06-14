'use client'

import { useEffect } from 'react'

import { formatCompact, formatCost } from '@/common/lib/format'
import type { Session } from '@/features/sessions/domain/session'

interface SessionInfoProps {
  open: boolean
  onClose: () => void
  sessionId: string | null
  modelLabel: string
  contextTokens: number
  contextWindow: number
  summary?: Session.Summary
}

const Row = ({ label, value }: { label: string; value: string | number }) => (
  <div className="sinfo__row">
    <span className="sinfo__label">{label}</span>
    <span className="sinfo__value">{value}</span>
  </div>
)

export const SessionInfo = ({
  open,
  onClose,
  sessionId,
  modelLabel,
  contextTokens,
  contextWindow,
  summary,
}: SessionInfoProps) => {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const ctxPct = Math.min(100, Math.round((contextTokens / contextWindow) * 100))
  const tokens = summary ? summary.tokens.input + summary.tokens.output : 0

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside
        className="drawer drawer--narrow"
        role="dialog"
        aria-label="Informations de la session"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer__head">
          <h2 className="drawer__title">Session</h2>
          <button type="button" className="drawer__close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </header>

        <div className="drawer__body sinfo">
          {summary && <p className="sinfo__heading">{summary.title}</p>}
          {summary && <Row label="Projet" value={summary.project} />}
          <Row label="Modèle" value={modelLabel} />
          <Row label="Contexte" value={`${ctxPct}% · ${formatCompact(contextTokens)} / ${formatCompact(contextWindow)}`} />
          {summary && <Row label="Messages" value={summary.messageCount} />}
          {summary && <Row label="Coût estimé" value={formatCost(summary.costUsd)} />}
          {summary && <Row label="Tokens (E/S)" value={formatCompact(tokens)} />}
          {summary && <Row label="Cache lu" value={formatCompact(summary.tokens.cacheRead)} />}
          {summary?.cwd && <Row label="Dossier" value={summary.cwd} />}

          {sessionId && (
            <div className="sinfo__resume">
              <span className="sinfo__label">Reprendre dans le terminal</span>
              <code className="sinfo__code">claude --resume {sessionId}</code>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
