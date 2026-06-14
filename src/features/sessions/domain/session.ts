export namespace Session {
  export interface Tokens {
    input: number
    output: number
    cacheRead: number
    cacheCreation: number
  }

  /** Résumé d'une session passée, pour la liste d'historique. */
  export interface Summary {
    id: string
    title: string
    cwd: string
    project: string
    /** Dossier projet de 1er niveau (sous la racine) — pour regrouper les sous-dossiers. */
    projectRoot: string
    updatedAt: number
    messageCount: number
    tokens: Tokens
    /** Coût estimé (tokens × tarif du modèle). */
    costUsd: number
  }

  export interface DayUsage {
    /** Date ISO `YYYY-MM-DD`. */
    date: string
    tokens: number
  }

  /** Agrégat d'usage sur les 7 derniers jours. */
  export interface Weekly {
    tokens: Tokens
    totalTokens: number
    costUsd: number
    messageCount: number
    sessionCount: number
    byDay: DayUsage[]
  }

  export interface FileRef {
    name: string
    path: string
    category: 'memory' | 'project'
  }
  export interface ProjectFiles {
    memory: FileRef[]
    project: FileRef[]
  }
}
