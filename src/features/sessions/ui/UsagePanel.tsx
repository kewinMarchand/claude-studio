'use client'

import { formatCompact, formatCost, formatResetFr } from '@/common/lib/format'
import type { Session } from '@/features/sessions/domain/session'
import type { UsageLimits } from '@/features/sessions/application/useUsageLimits'

interface UsagePanelProps {
  weekly: Session.Weekly | null
  loading: boolean
  limits: UsageLimits | null
  limitsLoading: boolean
}

const LimitSkeleton = ({ label }: { label: string }) => (
  <div className="limit">
    <div className="limit__head">
      <span className="limit__label">{label}</span>
    </div>
    <div className="limit__track">
      <div className="skeleton skeleton--bar" />
    </div>
    <span className="limit__resets skeleton skeleton--text" />
  </div>
)

const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

const LimitBar = ({ label, percent, resets }: { label: string; percent: number; resets: string }) => (
  <div className="limit">
    <div className="limit__head">
      <span className="limit__label">{label}</span>
      <span className="limit__pct" data-high={percent >= 80}>
        {percent}%
      </span>
    </div>
    <div className="limit__track">
      <div className="limit__fill" data-high={percent >= 80} style={{ width: `${Math.min(100, percent)}%` }} />
    </div>
    <span className="limit__resets">réinit. {formatResetFr(resets)}</span>
  </div>
)

export const UsagePanel = ({ weekly, loading, limits, limitsLoading }: UsagePanelProps) => {
  const maxDay = weekly ? Math.max(1, ...weekly.byDay.map((d) => d.tokens)) : 1
  const hasLimits = limits?.session || limits?.week

  return (
    <div className="usage">
      {hasLimits ? (
        <div className="usage__block">
          <span className="usage__heading">Abonnement</span>
          {limits.session && (
            <LimitBar label="Session" percent={limits.session.percent} resets={limits.session.resets} />
          )}
          {limits.week && (
            <LimitBar label="Semaine" percent={limits.week.percent} resets={limits.week.resets} />
          )}
        </div>
      ) : (
        limitsLoading && (
          <div className="usage__block">
            <span className="usage__heading">Abonnement</span>
            <LimitSkeleton label="Session" />
            <LimitSkeleton label="Semaine" />
          </div>
        )
      )}

      <div className="usage__block">
        <span className="usage__heading">7 derniers jours</span>
        {loading && !weekly ? (
          <>
            <div className="usage__stats">
              {['coût', 'sessions', 'tokens'].map((k) => (
                <div key={k} className="usage__stat">
                  <span className="skeleton skeleton--value" />
                  <span className="usage__key">{k}</span>
                </div>
              ))}
            </div>
            <div className="usage__chart" aria-hidden="true">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="usage__bar-wrap">
                  <div className="skeleton skeleton--col" style={{ height: `${30 + ((i * 37) % 60)}%` }} />
                </div>
              ))}
            </div>
          </>
        ) : weekly ? (
          <>
            <div className="usage__stats">
              <div className="usage__stat">
                <span className="usage__value">{formatCost(weekly.costUsd)}</span>
                <span className="usage__key">coût</span>
              </div>
              <div className="usage__stat">
                <span className="usage__value">{weekly.sessionCount}</span>
                <span className="usage__key">sessions</span>
              </div>
              <div className="usage__stat">
                <span className="usage__value">{formatCompact(weekly.totalTokens)}</span>
                <span className="usage__key">tokens</span>
              </div>
            </div>
            <div className="usage__chart" aria-hidden="true">
              {weekly.byDay.map((d) => (
                <div key={d.date} className="usage__bar-wrap" title={`${d.date} · ${formatCompact(d.tokens)} tokens`}>
                  <div className="usage__bar" style={{ height: `${Math.round((d.tokens / maxDay) * 100)}%` }} />
                  <span className="usage__bar-label">{WEEKDAYS[new Date(d.date).getUTCDay()]}</span>
                </div>
              ))}
            </div>
            <span className="usage__note">
              {weekly.messageCount} messages · cache lu {formatCompact(weekly.tokens.cacheRead)}
            </span>
          </>
        ) : (
          <span className="usage__muted">Indisponible</span>
        )}
      </div>
    </div>
  )
}
