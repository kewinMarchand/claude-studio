'use client'

import { useEffect, useMemo, useState } from 'react'

import type { Capabilities } from '@/features/capabilities/domain/capabilities'

interface CapabilitiesDrawerProps {
  open: boolean
  onClose: () => void
  data: Capabilities.Data
  loading: boolean
  /** Insère du texte dans le composer (commande, skill ou amorce d'agent). */
  onUse: (text: string) => void
  /** Affiche le contenu d'un fichier source (SKILL.md, agent, commande). */
  onView: (file: { name: string; path: string }) => void
}

const TABS: { key: Capabilities.Category; label: string }[] = [
  { key: 'commands', label: 'Commandes' },
  { key: 'skills', label: 'Skills' },
  { key: 'agents', label: 'Agents' },
  { key: 'mcp', label: 'MCP' },
]

export const CapabilitiesDrawer = ({ open, onClose, data, loading, onUse, onView }: CapabilitiesDrawerProps) => {
  const [tab, setTab] = useState<Capabilities.Category>('commands')
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const counts = {
    commands: data.commands.length,
    skills: data.skills.length,
    agents: data.agents.length,
    mcp: data.mcpServers.length,
  }

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = (i: { name: string; description?: string }) =>
      i.name.toLowerCase().includes(q) || (i.description ?? '').toLowerCase().includes(q)
    if (tab === 'commands') return data.commands.filter(match)
    if (tab === 'skills') return data.skills.filter(match)
    if (tab === 'agents') return data.agents.filter(match)
    return data.mcpServers
      .filter((m) => m.name.toLowerCase().includes(q))
      .map((m): Capabilities.Item => ({ name: m.name }))
  }, [tab, query, data])

  if (!open) return null

  const use = (name: string) => {
    if (tab === 'commands' || tab === 'skills') onUse(`/${name} `)
    else if (tab === 'agents') onUse(`Utilise l’agent « ${name} » pour `)
    onClose()
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-label="Outils Claude"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer__head">
          <h2 className="drawer__title">Outils Claude</h2>
          <button type="button" className="drawer__close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </header>

        <div className="caps">
          <div className="caps__tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                className="caps__tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
              >
                {t.label} <span className="caps__count">{counts[t.key]}</span>
              </button>
            ))}
          </div>

          <input
            type="search"
            className="caps__search"
            placeholder="Rechercher…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Rechercher"
          />

          {loading ? (
            <p className="caps__state">Chargement…</p>
          ) : items.length === 0 ? (
            <p className="caps__state">Aucun élément.</p>
          ) : (
            <ul className="caps__list">
              {items.map((item) => {
                if (tab === 'mcp') {
                  const server = data.mcpServers.find((m) => m.name === item.name)
                  return (
                    <li key={item.name} className="caps__item caps__item--static">
                      <span className="caps__name">{item.name}</span>
                      <span className="caps__status" data-status={server?.status}>
                        {server?.status}
                      </span>
                    </li>
                  )
                }
                const label = tab === 'agents' ? item.name : `/${item.name}`
                return (
                  <li key={item.name} className="caps__li">
                    <button type="button" className="caps__item" onClick={() => use(item.name)}>
                      <span className="caps__row">
                        <span className="caps__name">{label}</span>
                        <span className="caps__use" aria-hidden="true">
                          insérer →
                        </span>
                      </span>
                      {item.description && <span className="caps__desc">{item.description}</span>}
                    </button>
                    {item.path && (
                      <button
                        type="button"
                        className="caps__view"
                        title="Voir le contenu"
                        aria-label={`Voir le contenu de ${label}`}
                        onClick={() => onView({ name: label, path: item.path! })}
                      >
                        ◎
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {tab === 'mcp' && (
            <p className="caps__hint">
              Les serveurs MCP sont utilisés automatiquement par Claude pendant la conversation.
            </p>
          )}
        </div>
      </aside>
    </div>
  )
}
