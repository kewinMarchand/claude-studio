'use client'

import { useCallback, useEffect, useState } from 'react'

import { DEFAULT_SETTINGS, type Settings } from '@/features/settings/domain/settings'

const STORAGE_KEY = 'claude-studio:settings'

const load = (): Settings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

const applyTheme = (s: Settings): void => {
  const root = document.documentElement
  root.dataset.theme = s.theme
  root.dataset.density = s.compact ? 'compact' : 'comfortable'
  root.style.setProperty('--accent', s.accent)
  root.style.setProperty('--font-scale', String(s.fontScale))
}

export interface UseSettings {
  settings: Settings
  ready: boolean
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  reset: () => void
}

export const useSettings = (): UseSettings => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const loaded = load()
    setSettings(loaded)
    applyTheme(loaded)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    applyTheme(settings)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings, ready])

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), [])

  return { settings, ready, update, reset }
}
