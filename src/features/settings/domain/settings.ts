/** Modèles proposés (alias CLI `claude --model`). */
export const MODELS = [
  { value: 'fable', label: 'Fable 5' },
  { value: 'opus', label: 'Opus 4.8' },
  { value: 'sonnet', label: 'Sonnet 4.6' },
  { value: 'haiku', label: 'Haiku 4.5' },
] as const

export type ModelValue = (typeof MODELS)[number]['value']

/**
 * Modes de permission du CLI. En mode headless (`-p`), Claude ne peut pas
 * demander d'autorisation interactive : `bypassPermissions` rend l'outil
 * pleinement opérationnel (lecture/écriture/commandes) sur tes propres projets,
 * les autres modes restreignent ce que Claude peut faire seul.
 */
export const PERMISSION_MODES = [
  { value: 'bypassPermissions', label: 'Autonome', hint: 'Tous les outils sans confirmation' },
  { value: 'acceptEdits', label: 'Édition auto', hint: 'Édite les fichiers, refuse le reste' },
  { value: 'plan', label: 'Plan', hint: 'Analyse et planifie, sans modifier' },
  { value: 'default', label: 'Strict', hint: 'Refuse tout ce qui demande une permission' },
] as const

export type PermissionModeValue = (typeof PERMISSION_MODES)[number]['value']

/** Niveau d'effort (`claude --effort`) : profondeur de réflexion vs coût/latence. */
export const EFFORT_LEVELS = [
  { value: '', label: 'Défaut' },
  { value: 'low', label: 'Bas — rapide, économe' },
  { value: 'medium', label: 'Moyen — équilibré' },
  { value: 'high', label: 'Élevé — plus rigoureux' },
  { value: 'xhigh', label: 'Très élevé — agentique/code' },
  { value: 'max', label: 'Max — qualité avant coût' },
] as const

export type EffortValue = (typeof EFFORT_LEVELS)[number]['value']

export type ThemeMode = 'light' | 'dark'

export interface Settings {
  model: ModelValue
  permissionMode: PermissionModeValue
  effort: EffortValue
  cwd: string
  appendSystemPrompt: string
  // Apparence
  theme: ThemeMode
  accent: string
  fontScale: number
  compact: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  model: 'sonnet',
  permissionMode: 'acceptEdits',
  effort: '',
  cwd: '',
  appendSystemPrompt: '',
  theme: 'dark',
  accent: '#f59e0b',
  fontScale: 1,
  compact: false,
}
