/** 1234 → "1,2 k" · 1_200_000 → "1,2 M" */
export const formatCompact = (n: number): string => {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(1).replace('.', ',')} k`
  return `${(n / 1_000_000).toFixed(1).replace('.', ',')} M`
}

/** Coût en dollars, précision adaptée au montant. */
export const formatCost = (usd: number): string => {
  if (usd >= 1) return `$${usd.toFixed(2)}`
  if (usd >= 0.01) return `$${usd.toFixed(3)}`
  return `$${usd.toFixed(4)}`
}

const MONTHS_FR: Record<string, string> = {
  jan: 'janvier', feb: 'février', mar: 'mars', apr: 'avril', may: 'mai', jun: 'juin',
  jul: 'juillet', aug: 'août', sep: 'septembre', oct: 'octobre', nov: 'novembre', dec: 'décembre',
}
const MONTH_IDX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}
const DAY_MS = 86_400_000

/** « Jun 14, 3:49am … » → « samedi 14 juin à 3h49 » (nom du jour + heure 24h). */
export const formatResetFr = (raw: string): string => {
  const m = raw.match(/(\w{3})\w*\s+(\d{1,2}),\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
  if (!m) return raw
  const [, mon, day, h, min, ap] = m
  const key = mon.toLowerCase()
  const month = MONTHS_FR[key] ?? mon
  const monthIdx = MONTH_IDX[key] ?? 0
  let hour = Number(h) % 12
  if (ap.toLowerCase() === 'pm') hour += 12

  const now = new Date()
  let date = new Date(now.getFullYear(), monthIdx, Number(day), hour, Number(min ?? 0))
  // Une réinitialisation est à venir : si la date tombe dans le passé, c'est l'an prochain.
  if (date.getTime() < now.getTime() - DAY_MS) {
    date = new Date(now.getFullYear() + 1, monthIdx, Number(day), hour, Number(min ?? 0))
  }
  const weekday = date.toLocaleDateString('fr-FR', { weekday: 'long' })
  return `${weekday} ${Number(day)} ${month} à ${hour}h${(min ?? '00').padStart(2, '0')}`
}

/** Horodatage relatif court en français. */
export const formatRelative = (ms: number, now: number): string => {
  const diff = Math.max(0, now - ms)
  const min = Math.floor(diff / 60_000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `il y a ${d} j`
  return new Date(ms).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}
