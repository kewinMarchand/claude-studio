'use client'

import { useState, type ReactNode } from 'react'

interface DisclosureProps {
  title: string
  count?: number
  defaultOpen?: boolean
  children: ReactNode
}

/** Sous-bloc repliable (en-tête cliquable + contenu), fermé par défaut. */
export const Disclosure = ({ title, count, defaultOpen = false, children }: DisclosureProps) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="disc" data-open={open}>
      <button type="button" className="disc__head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="disc__chevron" aria-hidden="true">
          {open ? '▾' : '▸'}
        </span>
        <span className="disc__title">{title}</span>
        {count !== undefined && <span className="disc__count">{count}</span>}
      </button>
      {open && <div className="disc__body">{children}</div>}
    </div>
  )
}
