'use client'

import type { ChangeEvent } from 'react'

import { WorkspacePicker } from '@/features/settings'

interface ComposerToolsProps {
  cwd: string
  onChangeCwd: (path: string) => void
  skills: string[]
  agents: string[]
  onInsert: (text: string) => void
}

const HINT = [
  'Pour une demande efficace :',
  '• Indique le périmètre : dossier, fichier ou fonctionnalité concernés.',
  "• Décris l'action précise (créer, corriger, refactorer, tester…).",
  '• Donne les contraintes : stack, conventions, ce qu’il ne faut pas toucher.',
  '• Définis le critère de réussite (« les tests passent », « build vert »…).',
].join('\n')

export const ComposerTools = ({ cwd, onChangeCwd, skills, agents, onInsert }: ComposerToolsProps) => {
  const pick = (build: (v: string) => string) => (e: ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    if (v) onInsert(build(v))
    e.target.value = '' // reste un déclencheur, pas une valeur retenue
  }

  return (
    <div className="composer-tools">
      <WorkspacePicker value={cwd} onChange={onChangeCwd} className="wpick--composer" />

      <select className="composer-tools__select" defaultValue="" onChange={pick((v) => `/${v} `)} aria-label="Insérer un skill">
        <option value="">+ Skill</option>
        {skills.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        className="composer-tools__select"
        defaultValue=""
        onChange={pick((v) => `Utilise l’agent « ${v} » pour `)}
        aria-label="Insérer un agent"
      >
        <option value="">+ Agent</option>
        {agents.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      <span className="composer-tools__help" tabIndex={0} role="note" aria-label={HINT} title={HINT}>
        ?
      </span>
    </div>
  )
}
