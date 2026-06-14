'use client'

import { forwardRef, useImperativeHandle, useMemo, useRef, useState, type KeyboardEvent } from 'react'

export interface ComposerHandle {
  insert: (text: string) => void
}

interface ComposerProps {
  streaming: boolean
  /** Noms de commandes/skills proposés via la palette `/`. */
  commands: string[]
  onSend: (prompt: string) => void
  onStop: () => void
}

const MAX_PALETTE = 8

export const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer(
  { streaming, commands, onSend, onStop },
  handleRef,
) {
  const [value, setValue] = useState('')
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLTextAreaElement>(null)

  useImperativeHandle(handleRef, () => ({
    insert: (text: string) => {
      setValue((prev) => (prev ? `${prev}${text}` : text))
      setActive(0)
      requestAnimationFrame(() => {
        const el = ref.current
        if (!el) return
        el.focus()
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 320)}px`
      })
    },
  }))

  // Palette ouverte quand l'entrée est une commande en cours de frappe (« /xxx » sans espace).
  const matches = useMemo(() => {
    const m = value.match(/^\/([\w:-]*)$/)
    if (!m) return []
    const q = m[1].toLowerCase()
    return commands.filter((c) => c.toLowerCase().includes(q)).slice(0, MAX_PALETTE)
  }, [value, commands])

  const paletteOpen = matches.length > 0

  const resize = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`
  }

  const pick = (name: string) => {
    setValue(`/${name} `)
    setActive(0)
    ref.current?.focus()
  }

  const submit = () => {
    const text = value.trim()
    if (!text || streaming) return
    onSend(text)
    setValue('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (paletteOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((a) => (a + 1) % matches.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((a) => (a - 1 + matches.length) % matches.length)
        return
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault()
        pick(matches[active])
        return
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      {paletteOpen && (
        <ul className="palette" role="listbox" aria-label="Commandes">
          {matches.map((name, i) => (
            <li key={name}>
              <button
                type="button"
                className="palette__item"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(name)}
              >
                /{name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <textarea
        ref={ref}
        className="composer__input"
        value={value}
        rows={4}
        placeholder="Demande quelque chose à Claude…  (« / » pour les commandes)"
        aria-label="Message pour Claude"
        onChange={(e) => {
          setValue(e.target.value)
          setActive(0)
          resize()
        }}
        onKeyDown={handleKeyDown}
      />
      {streaming ? (
        <button type="button" className="composer__btn composer__btn--stop" onClick={onStop}>
          Stop
        </button>
      ) : (
        <button type="submit" className="composer__btn" disabled={!value.trim()} aria-label="Envoyer">
          Envoyer
        </button>
      )}
    </form>
  )
})
