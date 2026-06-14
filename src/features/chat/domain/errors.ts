export class ClaudeRunnerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ClaudeRunnerError'
  }
}

export class ClaudeNotFoundError extends ClaudeRunnerError {
  constructor() {
    super(
      "Le binaire `claude` est introuvable. Installe Claude Code, ou renseigne CLAUDE_BIN dans le fichier .env.local.",
    )
    this.name = 'ClaudeNotFoundError'
  }
}
