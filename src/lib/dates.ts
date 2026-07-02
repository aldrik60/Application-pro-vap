/**
 * Dates locales au format YYYY-MM-DD, sans passer par toISOString()
 * (qui convertit en UTC et décale d'un jour en France pour une date à minuit local).
 */

const pad = (n: number) => String(n).padStart(2, '0')

export const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

/** Formate une Date en YYYY-MM-DD selon le fuseau local. */
export function toLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Date du jour au format YYYY-MM-DD (fuseau local). */
export function todayLocalDateStr(): string {
  return toLocalDateStr(new Date())
}

/**
 * Construit YYYY-MM-DD depuis des sélecteurs jour/mois/année.
 * Retourne '' si incomplet ou invalide (ex : 31 février).
 */
export function buildLocalDateStr(day: string, month: string, year: string): string {
  if (!day || !month || !year) return ''
  const d = parseInt(day)
  const m = parseInt(month)
  const y = parseInt(year)
  const date = new Date(y, m - 1, d)
  // new Date corrige silencieusement les dates invalides (31/02 → 03/03) : on rejette dans ce cas.
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return ''
  return toLocalDateStr(date)
}
