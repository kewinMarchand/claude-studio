'use client'

import { formatCompact, formatCost } from '@/common/lib/format'
import type { Chat } from '@/features/chat/domain/events'

interface ContextMeterProps {
  contextTokens: number
  model: string
  sessionUsage: Chat.SessionUsage
  onInfo?: () => void
}

export const contextWindowFor = (model: string): number => (model.includes('haiku') ? 200_000 : 1_000_000)

export const ContextMeter = ({ contextTokens, model, sessionUsage, onInfo }: ContextMeterProps) => {
  const windowSize = contextWindowFor(model)
  const percent = Math.min(100, Math.round((contextTokens / windowSize) * 100))
  const high = percent >= 80

  return (
    <div className="ctx" role="status" aria-label="Utilisation du contexte">
      <div className="ctx__group">
        <span className="ctx__label">Contexte</span>
        <div className="ctx__track">
          <div className="ctx__fill" data-high={high} style={{ width: `${percent}%` }} />
        </div>
        <span className="ctx__value" data-high={high}>
          {percent}% · {formatCompact(contextTokens)} / {formatCompact(windowSize)}
        </span>
      </div>
      <span className="ctx__consumption">
        Consommation : {formatCompact(sessionUsage.inputTokens + sessionUsage.outputTokens)} tok ·{' '}
        {formatCost(sessionUsage.costUsd)}
      </span>
      {onInfo && (
        <button type="button" className="ctx__info" onClick={onInfo} title="Infos de la session">
          ⓘ infos
        </button>
      )}
    </div>
  )
}
