/**
 * Types du protocole `stream-json` émis par le CLI `claude -p --output-format stream-json`.
 * On ne modélise que les champs réellement consommés par l'interface.
 */
export namespace ClaudeEvent {
  export interface TextBlock {
    type: 'text'
    text: string
  }

  export interface ThinkingBlock {
    type: 'thinking'
    thinking: string
  }

  export interface ToolUseBlock {
    type: 'tool_use'
    id: string
    name: string
    input: unknown
  }

  export interface ToolResultBlock {
    type: 'tool_result'
    tool_use_id: string
    content: unknown
    is_error?: boolean
  }

  export type ContentBlock = TextBlock | ThinkingBlock | ToolUseBlock | ToolResultBlock

  export interface Init {
    type: 'system'
    subtype: 'init'
    session_id: string
    model: string
    cwd: string
    tools: string[]
    slash_commands?: string[]
  }

  export interface Assistant {
    type: 'assistant'
    message: { content: ContentBlock[] }
    session_id: string
  }

  /** Les résultats d'outils reviennent encapsulés dans un message `user`. */
  export interface UserToolResult {
    type: 'user'
    message: { content: ContentBlock[] }
    session_id: string
  }

  export interface Result {
    type: 'result'
    subtype: string
    is_error: boolean
    result?: string
    session_id: string
    duration_ms?: number
    num_turns?: number
    total_cost_usd?: number
    usage?: {
      input_tokens?: number
      output_tokens?: number
      cache_read_input_tokens?: number
      cache_creation_input_tokens?: number
    }
  }

  export type Any = Init | Assistant | UserToolResult | Result | { type: string; [k: string]: unknown }
}

/**
 * Modèle de message tel qu'affiché dans l'interface (vue agrégée des événements bruts).
 */
export namespace Chat {
  export type Role = 'user' | 'assistant'

  export interface ToolCall {
    id: string
    name: string
    input: unknown
    /** Rempli quand le `tool_result` correspondant arrive. */
    result?: { content: string; isError: boolean }
  }

  export interface Message {
    id: string
    role: Role
    text: string
    /** Raisonnement (blocs `thinking`) cumulé, affiché dans un volet repliable. */
    thinking: string
    toolCalls: ToolCall[]
  }

  export interface Usage {
    inputTokens: number
    outputTokens: number
    costUsd: number
    durationMs: number
  }

  /** Usage cumulé de la conversation en cours (somme des tours). */
  export interface SessionUsage {
    inputTokens: number
    outputTokens: number
    costUsd: number
    turns: number
  }

  export type Status = 'idle' | 'streaming' | 'error'
}
