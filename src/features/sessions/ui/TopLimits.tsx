'use client'

import { formatResetFr } from '@/common/lib/format'
import type { UsageLimits } from '@/features/sessions/application/useUsageLimits'

interface TopLimitsProps {
  limits: UsageLimits | null
  loading: boolean
}

const Gauge = ({ short, label, percent, resets }: { short: string; label: string; percent: number; resets: string }) => (
  <span className="toplimit" title={`${label} : ${percent}% — réinit. ${formatResetFr(resets)}`}>
    <span className="toplimit__label">{short}</span>
    <span className="toplimit__track">
      <span className="toplimit__fill" data-high={percent >= 80} style={{ width: `${Math.min(100, percent)}%` }} />
    </span>
    <span className="toplimit__pct" data-high={percent >= 80}>
      {percent}%
    </span>
  </span>
)

export const TopLimits = ({ limits, loading }: TopLimitsProps) => {
  if (!limits?.session && !limits?.week) {
    return loading ? <span className="toplimit__loading skeleton skeleton--text" aria-hidden="true" /> : null
  }
  return (
    <div className="toplimits" aria-label="Niveau d’usage de l’abonnement">
      {limits.session && (
        <Gauge short="Session" label="Session" percent={limits.session.percent} resets={limits.session.resets} />
      )}
      {limits.week && (
        <Gauge short="Sem." label="Semaine" percent={limits.week.percent} resets={limits.week.resets} />
      )}
    </div>
  )
}
