'use client'

import type { Project } from '@/features/settings'

interface ProjectPickerProps {
  projects: Project[]
  rootLabel: string
  value: string
  onChange: (path: string) => void
}

export const ProjectPicker = ({ projects, rootLabel, value, onChange }: ProjectPickerProps) => (
  <label className="picker">
    <span className="picker__label">Dossier de travail</span>
    <select className="picker__select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{rootLabel || 'Dossier par défaut'}</option>
      {projects.map((p) => (
        <option key={p.path} value={p.path}>
          {p.name}
        </option>
      ))}
    </select>
  </label>
)
