'use client'

import { Markdown } from '@/common/ui/Markdown'
import type { Chat } from '@/features/chat/domain/events'
import { ToolCallCard } from '@/features/chat/ui/ToolCallCard'

interface MessageBubbleProps {
  message: Chat.Message
  streaming: boolean
}

export const MessageBubble = ({ message, streaming }: MessageBubbleProps) => {
  const isUser = message.role === 'user'

  return (
    <article className="bubble" data-role={message.role}>
      <div className="bubble__avatar" aria-hidden="true">
        {isUser ? 'Moi' : 'C'}
      </div>
      <div className="bubble__content">
        {message.thinking && (
          <details className="bubble__thinking" open={streaming && !message.text}>
            <summary>{streaming && !message.text ? 'Réflexion en cours…' : 'Raisonnement'}</summary>
            <Markdown>{message.thinking}</Markdown>
          </details>
        )}
        {message.toolCalls.length > 0 && (
          <div className="bubble__tools">
            {message.toolCalls.map((call) => (
              <ToolCallCard key={call.id} call={call} streaming={streaming} />
            ))}
          </div>
        )}
        {message.text &&
          (isUser ? <p className="bubble__text">{message.text}</p> : <Markdown>{message.text}</Markdown>)}
      </div>
    </article>
  )
}
