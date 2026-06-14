import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Sortie autonome uniquement pour l'image Docker (NEXT_OUTPUT=standalone au build).
  // En local, on garde le build classique pour que `next start` fonctionne.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  // Le runner spawn le CLI `claude` : on garde tout côté Node, jamais Edge.
  serverExternalPackages: [],
}

export default nextConfig
