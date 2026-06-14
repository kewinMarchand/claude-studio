import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import './globals.css'

export const metadata: Metadata = {
  title: 'Claude Studio',
  description: 'Interface personnalisable pour piloter Claude Code en dehors du terminal.',
}

// Applique le thème enregistré avant le premier rendu (anti-flash).
const themeScript = `
(function () {
  try {
    var s = JSON.parse(localStorage.getItem('claude-studio:settings') || '{}');
    var root = document.documentElement;
    root.dataset.theme = s.theme || 'dark';
    root.dataset.density = s.compact ? 'compact' : 'comfortable';
    if (s.accent) root.style.setProperty('--accent', s.accent);
    root.style.setProperty('--font-scale', String(s.fontScale || 1));
  } catch (e) {}
})();
`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" data-theme="dark" data-density="comfortable" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  )
}
