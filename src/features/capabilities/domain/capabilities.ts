export namespace Capabilities {
  export interface Item {
    name: string
    description?: string
    /** Chemin du fichier source (SKILL.md / agent / commande) pour l'affichage du contenu. */
    path?: string
  }

  export interface McpServer {
    name: string
    status: string
  }

  export interface Data {
    /** Commandes slash hors skills (built-in : clear, compact, review…). */
    commands: Item[]
    skills: Item[]
    agents: Item[]
    mcpServers: McpServer[]
  }

  export type Category = 'commands' | 'skills' | 'agents' | 'mcp'
}
