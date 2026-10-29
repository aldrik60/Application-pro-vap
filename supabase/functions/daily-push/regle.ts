// Quelle notification envoyer ce matin à un compte (choix d'Antony du 29/10/2026) :
//   - une étape (badge) qui tombe ce jour-là est toujours fêtée, quel que soit le jour ;
//   - les 120 premiers jours : le message du jour, chaque matin ;
//   - ensuite : le message du jour une fois par semaine, le lundi.
// Le message est celui de l'accueil ce jour-là (message propre au jour, ou rotation
// de la série J91 à J120 au-delà de J120 sans message propre).
// Aucune dépendance : testé par regle_test.ts (deno test).

export const LONG_RUN_FIRST_DAY = 91
export const LONG_RUN_LAST_DAY = 120
// Messages liés à leur jour précis (« 100 jours »…) : jamais rejoués (comme HomePage).
export const LONG_RUN_EXCLUDED = [91, 99, 100, 117]
// Au-delà de ce jour, le message du jour ne part plus que le lundi.
export const DAILY_UNTIL_DAY = 120
export const WEEKLY_WEEKDAY = 1 // lundi (0 = dimanche)

export type Badge = { title: string; description: string }
export type Notification = { title: string; body: string; url: string; tag: string }

/** Jour de la semaine (0 = dimanche … 6 = samedi) d'une date AAAA-MM-JJ. */
export function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay()
}

/** Messages de la série J91 à J120 qui tournent au-delà de J120. */
export function longRunPool(messages: Array<{ day_number: number; message: string }>): string[] {
  return messages
    .filter(m => m.day_number >= LONG_RUN_FIRST_DAY && m.day_number <= LONG_RUN_LAST_DAY && !LONG_RUN_EXCLUDED.includes(m.day_number))
    .sort((a, b) => a.day_number - b.day_number)
    .map(m => m.message)
}

/**
 * Notification du matin pour un compte arrivé à `days` jours, à la date `date`
 * (AAAA-MM-JJ, heure de Paris). null : rien à envoyer ce matin.
 */
export function pickNotification(
  days: number,
  date: string,
  badgeByDay: Map<number, Badge>,
  messageByDay: Map<number, string>,
  pool: string[],
): Notification | null {
  if (days <= 0) return null

  const badge = badgeByDay.get(days)
  if (badge) {
    return {
      title: `Nouveau palier : ${badge.title}`,
      body: badge.description,
      url: '/badges',
      tag: `palier-${days}`,
    }
  }

  if (days > DAILY_UNTIL_DAY && weekdayOf(date) !== WEEKLY_WEEKDAY) return null

  let message = messageByDay.get(days)
  if (!message && days > LONG_RUN_FIRST_DAY && pool.length > 0) {
    message = pool[(days - LONG_RUN_FIRST_DAY) % pool.length]
  }
  if (!message) return null
  return {
    title: `Jour ${days} · Votre message du jour`,
    body: message,
    url: '/',
    tag: `jour-${date}`,
  }
}
