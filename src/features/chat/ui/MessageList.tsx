'use client'

import { useEffect, useRef, type ReactNode } from 'react'

import type { Chat } from '@/features/chat/domain/events'
import { EmptyState } from '@/features/chat/ui/EmptyState'
import { MessageBubble } from '@/features/chat/ui/MessageBubble'

interface MessageListProps {
  messages: Chat.Message[]
  status: Chat.Status
  error: string | null
  cwd: string
  onRetry: () => void
  /** Affiché sous l'écran d'accueil (stats d'usage). */
  homeExtra?: ReactNode
}

export const MessageList = ({ messages, status, error, cwd, onRetry, homeExtra }: MessageListProps) => {
  const endRef = useRef<HTMLDivElement>(null)
  const streaming = status === 'streaming'

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, status])

  if (messages.length === 0 && status !== 'error') {
    return (
      <div className="messages messages--empty">
        <EmptyState cwd={cwd} />
        {homeExtra && <div className="home-usage">{homeExtra}</div>}
      </div>
    )
  }

  const lastIsAssistant = messages.at(-1)?.role === 'assistant'

  return (
    <div className="messages" role="log" aria-live="polite" aria-busy={streaming}>
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} streaming={streaming} />
      ))}

      {streaming && !lastIsAssistant && (
        <div className="typing" aria-label="Claude réfléchit">
          <span />
          <span />
          <span />
        </div>
      )}

      {error && (
        <div className="alert" role="alert">
          <p className="alert__text">{error}</p>
          <button type="button" className="alert__retry" onClick={onRetry}>
            Réessayer
          </button>
        </div>
      )}

      <div ref={endRef} />
    </div>
  )
}
