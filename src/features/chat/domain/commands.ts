/**
 * Commandes natives « interactives » de Claude Code : gérées par l'UI du CLI,
 * elles ne déclenchent aucun tour modèle. En mode `-p` (headless), elles
 * n'émettent ni texte ni événement `result` et le process ne se termine jamais
 * → le loader tournerait indéfiniment. On les court-circuite côté client.
 */
const INTERACTIVE_ONLY_COMMANDS = new Set([
  'context',
  'help',
  'compact',
  'status',
  'cost',
  'doctor',
  'config',
  'settings',
  'model',
  'login',
  'logout',
  'theme',
  'vim',
  'mcp',
  'agents',
  'memory',
  'hooks',
  'ide',
  'permissions',
  'statusline',
  'bug',
  'upgrade',
  'export',
  'terminal-setup',
  'release-notes',
])

/** Nom de la commande si l'entrée est un appel `/xxx` (sans le slash), sinon null. */
export const commandName = (prompt: string): string | null => {
  const m = prompt.trim().match(/^\/([\w:-]+)/)
  return m ? m[1].toLowerCase() : null
}

export const isInteractiveOnlyCommand = (prompt: string): boolean => {
  const name = commandName(prompt)
  return name !== null && INTERACTIVE_ONLY_COMMANDS.has(name)
}
