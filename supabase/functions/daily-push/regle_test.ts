// Tests de la règle du message du matin : deno test supabase/functions/daily-push/
import { longRunPool, pickNotification, weekdayOf, type Badge } from './regle.ts'

function assertEquals(actual: unknown, expected: unknown, label = '') {
  const a = JSON.stringify(actual), e = JSON.stringify(expected)
  if (a !== e) throw new Error(`${label} : obtenu ${a}, attendu ${e}`)
}

// Données proches de la base : étapes réelles, un message pour J1 à J120 et J180/J365/J730.
const BADGE_DAYS = [1, 2, 3, 7, 14, 30, 60, 90, 100, 120, 150, 180, 200, 250, 270, 300, 365, 500, 545, 730, 1095, 1825]
const badgeByDay = new Map<number, Badge>(BADGE_DAYS.map(d => [d, { title: `Étape ${d}`, description: `Bravo ${d}` }]))
const rows = [...Array.from({ length: 120 }, (_, i) => i + 1), 180, 365, 730].map(d => ({ day_number: d, message: `Message J${d}` }))
const messageByDay = new Map(rows.map(r => [r.day_number, r.message]))
const pool = longRunPool(rows)

const pick = (days: number, date: string) => pickNotification(days, date, badgeByDay, messageByDay, pool)

/** Date AAAA-MM-JJ décalée de n jours. */
function addDays(date: string, n: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
}

Deno.test('jour de la semaine, y compris le jour du changement d\'heure', () => {
  assertEquals(weekdayOf('2026-11-02'), 1, 'lundi 2/11')
  assertEquals(weekdayOf('2026-10-29'), 4, 'jeudi 29/10')
  assertEquals(weekdayOf('2026-10-25'), 0, 'dimanche 25/10 (heure d\'hiver)')
  assertEquals(weekdayOf('2027-03-28'), 0, 'dimanche 28/03/2027 (heure d\'été)')
})

Deno.test('série J91 à J120 : 26 messages, sans 91, 99, 100, 117', () => {
  assertEquals(pool.length, 26, 'taille')
  assertEquals(pool.includes('Message J100'), false, 'J100 exclu')
  assertEquals(pool[0], 'Message J92', 'premier')
})

Deno.test('les 120 premiers jours : un message chaque matin', () => {
  assertEquals(pick(101, '2026-10-30')?.title, 'Jour 101 · Votre message du jour', 'J101 un vendredi (test téléphone)')
  assertEquals(pick(119, '2026-10-31')?.body, 'Message J119', 'J119 un samedi')
  assertEquals(pick(0, '2026-11-02'), null, 'jour 0 : rien')
})

Deno.test('après J120 : seulement le lundi', () => {
  assertEquals(pick(121, '2026-10-29'), null, 'J121 un jeudi')
  assertEquals(pick(4474, '2026-10-29'), null, 'compte de 2014, jeudi')
  assertEquals(pick(4475, '2026-10-30'), null, 'compte de 2014, vendredi')
  const lundi = pick(4478, '2026-11-02')
  assertEquals(lundi?.title, 'Jour 4478 · Votre message du jour', 'compte de 2014, lundi')
  assertEquals(lundi?.body, pool[(4478 - 91) % 26], 'même message que l\'accueil')
})

Deno.test('une étape est fêtée le jour même, quel que soit le jour', () => {
  assertEquals(pick(120, '2026-10-29')?.title, 'Nouveau palier : Étape 120', 'J120 un jeudi')
  assertEquals(pick(150, '2026-10-27')?.title, 'Nouveau palier : Étape 150', 'J150 un mardi')
  assertEquals(pick(365, '2026-10-29')?.title, 'Nouveau palier : Étape 365', 'J365 : l\'étape passe avant le message propre')
  assertEquals(pick(1825, '2026-10-31')?.url, '/badges', 'J1825 un samedi')
})

Deno.test('sur une année, client qui commence le 29/10/2026', () => {
  const start = '2026-10-29'
  let daily = 0, weekly = 0, badges = 0, badgesFirst120 = 0
  for (let d = 1; d <= 365; d++) {
    const date = addDays(start, d)
    const n = pick(d, date)
    if (!n) continue
    if (n.url === '/badges') { badges++; if (d <= 120) badgesFirst120++ }
    else if (d <= 120) daily++
    else {
      weekly++
      assertEquals(weekdayOf(date), 1, `J${d} envoyé un ${date} qui n'est pas un lundi`)
    }
  }
  assertEquals(daily + badgesFirst120, 120, 'un envoi par jour jusqu\'à J120')
  assertEquals(badges, BADGE_DAYS.filter(d => d <= 365).length, 'toutes les étapes de l\'année')
  // De J121 à J365 : 35 lundis, moins ceux qui tombent un jour d'étape (déjà comptés en étape)
  const mondaysAfter120 = Array.from({ length: 245 }, (_, i) => i + 121).filter(d => weekdayOf(addDays(start, d)) === 1)
  const expectedWeekly = mondaysAfter120.filter(d => !badgeByDay.has(d)).length
  assertEquals(weekly, expectedWeekly, 'messages du lundi après J120')
})

Deno.test('ancien fumeur (2014) : 4 semaines = 4 messages', () => {
  let sent = 0
  for (let i = 0; i < 28; i++) {
    const date = addDays('2026-10-29', i)
    const days = Math.floor((Date.parse(`${date}T00:00:00Z`) - Date.parse('2014-07-30T00:00:00Z')) / 86_400_000)
    if (pick(days, date)) sent++
  }
  assertEquals(sent, 4, 'un par lundi')
})
