'use client'

import { useEffect, useRef } from 'react'

import type { UseSettings } from '@/features/settings/application/useSettings'
import { EFFORT_LEVELS, MODELS, PERMISSION_MODES } from '@/features/settings/domain/settings'
import { WorkspacePicker } from '@/features/settings/ui/WorkspacePicker'

interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
  settings: UseSettings['settings']
  update: UseSettings['update']
  reset: UseSettings['reset']
}

const ACCENTS = ['#f59e0b', '#14b8a6', '#6366f1', '#10b981', '#ef4444', '#ec4899', '#06b6d4']

export const SettingsDrawer = ({ open, onClose, settings, update, reset }: SettingsDrawerProps) => {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    panelRef.current?.querySelector<HTMLElement>('select, input, button')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside
        ref={panelRef}
        className="drawer"
        role="dialog"
        aria-label="Réglages"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer__head">
          <h2 className="drawer__title">Réglages</h2>
          <button type="button" className="drawer__close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </header>

        <div className="drawer__body">
          <section className="field-group">
            <h3 className="field-group__legend">Session Claude</h3>

            <label className="field">
              <span className="field__label">Modèle</span>
              <select
                className="field__control"
                value={settings.model}
                onChange={(e) => update('model', e.target.value as typeof settings.model)}
              >
                {MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Effort</span>
              <select
                className="field__control"
                value={settings.effort}
                onChange={(e) => update('effort', e.target.value as typeof settings.effort)}
              >
                {EFFORT_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Mode de permission</span>
              <select
                className="field__control"
                value={settings.permissionMode}
                onChange={(e) =>
                  update('permissionMode', e.target.value as typeof settings.permissionMode)
                }
              >
                {PERMISSION_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label} — {m.hint}
                  </option>
                ))}
              </select>
              {settings.permissionMode === 'bypassPermissions' && (
                <span className="field__warn">
                  ⚠ Claude exécute tout sans confirmation. À réserver à tes propres projets.
                </span>
              )}
            </label>

            <div className="field">
              <span className="field__label">Dossier de travail</span>
              <WorkspacePicker
                value={settings.cwd}
                onChange={(path) => update('cwd', path)}
                className="wpick--field"
              />
            </div>

            <label className="field">
              <span className="field__label">Instructions système (optionnel)</span>
              <textarea
                className="field__control field__control--area"
                value={settings.appendSystemPrompt}
                rows={3}
                placeholder="Ajouté au prompt système de Claude pour cette interface."
                onChange={(e) => update('appendSystemPrompt', e.target.value)}
              />
            </label>
          </section>

          <section className="field-group">
            <h3 className="field-group__legend">Apparence</h3>

            <div className="field">
              <span className="field__label">Thème</span>
              <div className="segmented" role="group" aria-label="Thème">
                {(['dark', 'light'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="segmented__btn"
                    aria-pressed={settings.theme === t}
                    onClick={() => update('theme', t)}
                  >
                    {t === 'dark' ? 'Sombre' : 'Clair'}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <span className="field__label">Couleur d’accent</span>
              <div className="swatches">
                {ACCENTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="swatch"
                    style={{ background: c }}
                    aria-label={`Accent ${c}`}
                    aria-pressed={settings.accent === c}
                    onClick={() => update('accent', c)}
                  />
                ))}
                <input
                  type="color"
                  className="swatch swatch--custom"
                  value={settings.accent}
                  aria-label="Couleur personnalisée"
                  onChange={(e) => update('accent', e.target.value)}
                />
              </div>
            </div>

            <label className="field">
              <span className="field__label">
                Taille du texte — {Math.round(settings.fontScale * 100)}%
              </span>
              <input
                type="range"
                className="field__range"
                min={0.85}
                max={1.3}
                step={0.05}
                value={settings.fontScale}
                onChange={(e) => update('fontScale', Number(e.target.value))}
              />
            </label>

            <label className="field field--row">
              <input
                type="checkbox"
                checked={settings.compact}
                onChange={(e) => update('compact', e.target.checked)}
              />
              <span className="field__label">Affichage compact</span>
            </label>
          </section>

          <button type="button" className="drawer__reset" onClick={reset}>
            Réinitialiser les réglages
          </button>
        </div>
      </aside>
    </div>
  )
}
