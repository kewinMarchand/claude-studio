'use client'

import { useCallback, useRef, useState } from 'react'

import { blockToText } from '@/common/lib/content'
import { commandName, isInteractiveOnlyCommand } from '@/features/chat/domain/commands'
import type { ClaudeEvent } from '@/features/chat/domain/events'
import { Chat } from '@/features/chat/domain/events'
import {
  sendPrompt,
  type SendPayload,
  type StreamEvent,
  type StudioError,
} from '@/features/chat/infrastructure/client/streamClient'

let messageSeq = 0
const nextId = (): string => `m${++messageSeq}`

export interface SendParams {
  model: string
  permissionMode: string
  effort?: string
  cwd: string
  appendSystemPrompt?: string
}

const EMPTY_SESSION_USAGE: Chat.SessionUsage = { inputTokens: 0, outputTokens: 0, costUsd: 0, turns: 0 }

export interface UseChat {
  messages: Chat.Message[]
  status: Chat.Status
  error: string | null
  usage: Chat.Usage | null
  sessionUsage: Chat.SessionUsage
  /** Tokens du contexte au dernier tour (entrée + cache), pour la jauge de contexte. */
  contextTokens: number
  sessionId: string | null
  cwd: string | null
  send: (prompt: string, params: SendParams) => Promise<void>
  loadSession: (id: string) => Promise<void>
  stop: () => void
  reset: () => void
}

const PENDING = '__pending__'

/** Réducteur pur : reconstruit la liste de messages sans muter l'existant. */
const applyEvent = (event: ClaudeEvent.Any, prev: Chat.Message[]): Chat.Message[] => {
  if (event.type === 'assistant') {
    const blocks = (event as ClaudeEvent.Assistant).message?.content ?? []
    const current = prev.find((m) => m.id === PENDING) ?? {
      id: PENDING,
      role: 'assistant' as const,
      text: '',
      thinking: '',
      toolCalls: [],
    }

    let text = current.text
    let thinking = current.thinking
    const toolCalls = [...current.toolCalls]
    for (const block of blocks) {
      if (block.type === 'text') text += block.text
      else if (block.type === 'thinking') thinking += block.thinking
      else if (block.type === 'tool_use') {
        toolCalls.push({ id: block.id, name: block.name, input: block.input })
      }
    }

    const updated: Chat.Message = { ...current, text, thinking, toolCalls }
    return prev.some((m) => m.id === PENDING)
      ? prev.map((m) => (m.id === PENDING ? updated : m))
      : [...prev, updated]
  }

  if (event.type === 'user') {
    const blocks = (event as ClaudeEvent.UserToolResult).message?.content ?? []
    const results = new Map<string, { content: string; isError: boolean }>()
    for (const block of blocks) {
      if (block.type === 'tool_result') {
        results.set(block.tool_use_id, {
          content: blockToText(block.content),
          isError: Boolean(block.is_error),
        })
      }
    }
    if (results.size === 0) return prev

    return prev.map((m) => ({
      ...m,
      toolCalls: m.toolCalls.map((c) => (results.has(c.id) ? { ...c, result: results.get(c.id) } : c)),
    }))
  }

  return prev
}

export const useChat = (): UseChat => {
  const [messages, setMessages] = useState<Chat.Message[]>([])
  const [status, setStatus] = useState<Chat.Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState<Chat.Usage | null>(null)
  const [sessionUsage, setSessionUsage] = useState<Chat.SessionUsage>(EMPTY_SESSION_USAGE)
  const [contextTokens, setContextTokens] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [cwd, setCwd] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  // cwd forcé quand on reprend une session de l'historique (prime sur les réglages).
  const resumeCwdRef = useRef<string | null>(null)

  const finalize = useCallback(() => {
    setMessages((prev) => prev.map((m) => (m.id === '__pending__' ? { ...m, id: nextId() } : m)))
  }, [])

  const send = useCallback(
    async (prompt: string, params: SendParams) => {
      const text = prompt.trim()
      if (!text || status === 'streaming') return

      setMessages((prev) => [...prev, { id: nextId(), role: 'user', text, thinking: '', toolCalls: [] }])

      if (isInteractiveOnlyCommand(text)) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'assistant',
            text: `La commande \`/${commandName(text)}\` est interactive : elle est gérée par l'interface du CLI et n'a pas d'équivalent en mode headless. Elle n'est donc pas disponible dans Claude Studio.`,
            thinking: '',
            toolCalls: [],
          },
        ])
        return
      }

      setStatus('streaming')
      setError(null)

      const controller = new AbortController()
      abortRef.current = controller

      const payload: SendPayload = {
        prompt: text,
        model: params.model,
        permissionMode: params.permissionMode,
        effort: params.effort,
        cwd: resumeCwdRef.current ?? params.cwd,
        appendSystemPrompt: params.appendSystemPrompt,
        resume: sessionId ?? undefined,
      }

      try {
        for await (const event of sendPrompt(payload, controller.signal)) {
          const e = event as StreamEvent

          if (e.type === 'system' && 'subtype' in e && e.subtype === 'init') {
            const init = e as ClaudeEvent.Init
            setSessionId(init.session_id)
            setCwd(init.cwd)
            continue
          }
          if (e.type === 'studio_error') {
            setError(String((e as StudioError).message))
            setStatus('error')
            continue
          }
          if (e.type === 'result') {
            const r = e as ClaudeEvent.Result
            const turn: Chat.Usage = {
              inputTokens: r.usage?.input_tokens ?? 0,
              outputTokens: r.usage?.output_tokens ?? 0,
              costUsd: r.total_cost_usd ?? 0,
              durationMs: r.duration_ms ?? 0,
            }
            setUsage(turn)
            setContextTokens(
              (r.usage?.input_tokens ?? 0) +
                (r.usage?.cache_read_input_tokens ?? 0) +
                (r.usage?.cache_creation_input_tokens ?? 0),
            )
            setSessionUsage((prev) => ({
              inputTokens: prev.inputTokens + turn.inputTokens,
              outputTokens: prev.outputTokens + turn.outputTokens,
              costUsd: prev.costUsd + turn.costUsd,
              turns: prev.turns + 1,
            }))
            if (r.is_error && r.result) {
              setError(r.result)
              setStatus('error')
            }
            continue
          }
          if (e.type === 'studio_done') continue

          setMessages((prev) => applyEvent(e as ClaudeEvent.Any, prev))
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Erreur de connexion au serveur.')
          setStatus('error')
        }
      } finally {
        finalize()
        abortRef.current = null
        setStatus((s) => (s === 'error' ? 'error' : 'idle'))
      }
    },
    [status, sessionId, finalize],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    finalize()
    setStatus('idle')
  }, [finalize])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    resumeCwdRef.current = null
    setMessages([])
    setStatus('idle')
    setError(null)
    setUsage(null)
    setSessionUsage(EMPTY_SESSION_USAGE)
    setContextTokens(0)
    setSessionId(null)
    setCwd(null)
  }, [])

  const loadSession = useCallback(async (id: string) => {
    abortRef.current?.abort()
    abortRef.current = null
    setStatus('idle')
    setError(null)
    setUsage(null)
    setSessionUsage(EMPTY_SESSION_USAGE)
    setContextTokens(0)

    try {
      const res = await fetch(`/api/sessions/${id}`)
      if (!res.ok) throw new Error('Session introuvable.')
      const data = (await res.json()) as { messages: Chat.Message[]; cwd: string; contextTokens?: number }
      setMessages(data.messages)
      setSessionId(id)
      setCwd(data.cwd)
      setContextTokens(data.contextTokens ?? 0)
      resumeCwdRef.current = data.cwd || null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec du chargement de la session.')
      setStatus('error')
    }
  }, [])

  return {
    messages,
    status,
    error,
    usage,
    sessionUsage,
    contextTokens,
    sessionId,
    cwd,
    send,
    loadSession,
    stop,
    reset,
  }
}
