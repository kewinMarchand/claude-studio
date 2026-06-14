'use client'

import { useState } from 'react'

import type { Chat } from '@/features/chat/domain/events'

interface ToolCallCardProps {
  call: Chat.ToolCall
  streaming: boolean
}

const summarize = (input: unknown): string => {
  if (!input || typeof input !== 'object') return ''
  const o = input as Record<string, unknown>
  const key = o.command ?? o.file_path ?? o.path ?? o.pattern ?? o.url ?? o.prompt ?? o.query
  return typeof key === 'string' ? key : ''
}

export const ToolCallCard = ({ call, streaming }: ToolCallCardProps) => {
  const [open, setOpen] = useState(false)
  const summary = summarize(call.input)
  const pending = !call.result && streaming
  const state = call.result?.isError ? 'error' : call.result ? 'done' : pending ? 'pending' : 'done'

  return (
    <div className="tool-card" data-state={state}>
      <button
        type="button"
        className="tool-card__head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="tool-card__icon" aria-hidden="true">
          {state === 'error' ? '✕' : state === 'pending' ? '◌' : '⚙'}
        </span>
        <span className="tool-card__name">{call.name}</span>
        {summary && <code className="tool-card__summary">{summary}</code>}
        <span className="tool-card__chevron" aria-hidden="true">
          {open ? '▾' : '▸'}
        </span>
      </button>

      {open && (
        <div className="tool-card__body">
          <span className="tool-card__label">Entrée</span>
          <pre className="tool-card__pre">{JSON.stringify(call.input, null, 2)}</pre>
          {call.result ? (
            <>
              <span className="tool-card__label">Résultat</span>
              <pre className="tool-card__pre">{call.result.content || '(vide)'}</pre>
            </>
          ) : pending ? (
            <span className="tool-card__pending">Exécution en cours…</span>
          ) : null}
        </div>
      )}
    </div>
  )
}
