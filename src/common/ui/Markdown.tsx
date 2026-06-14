'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownProps {
  children: string
}

// react-markdown n'injecte pas de HTML brut : pas de risque d'innerHTML.
export const Markdown = ({ children }: MarkdownProps) => (
  <div className="markdown">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
  </div>
)
