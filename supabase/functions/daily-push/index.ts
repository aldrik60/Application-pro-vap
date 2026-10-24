// Edge Function daily-push : notification automatique du matin.
// Appelée par pg_cron (voir supabase/daily_push.sql) à 7 h et 8 h UTC ;
// elle n'envoie qu'à 9 h heure de Paris, ce qui suit l'heure d'été toute seule.
//
// Pour chaque appareil abonné (push_subscriptions.enabled) dont le compte a une
// date d'arrêt :
//   - si un palier (badge) tombe ce jour-là : « Nouveau palier : {titre} » ;
//   - sinon le message du jour, comme sur l'accueil (message propre au jour,
//     ou rotation J91 à J120 au-delà de J120 sans message propre).
// Le nombre de jours est calculé comme dans HomePage.
//
// Sécurité (verify_jwt=false car pg_net n'envoie pas de JWT) :
// - en-tête x-daily-secret obligatoire, comparé au secret DAILY_PUSH_SECRET du Vault ;
// - une seule tournée par jour : la date est réservée dans daily_push_runs ;
// - rien n'est écrit dans push_messages (historique visible par tous).
//
// Test : POST {"test_user_id": "<uuid>", "simulate_day"?: 30}
// envoie au seul compte indiqué, sans contrôle d'heure ni réservation du jour.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import webpush from 'https://esm.sh/web-push@3.6.7?bundle&target=denonext'

const SEND_HOUR_PARIS = 9
const LONG_RUN_FIRST_DAY = 91
const LONG_RUN_LAST_DAY = 120
const DAY_MS = 86_400_000

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ─── Contrôle du secret ──────────────────────────────────────────────────
    const { data: secret, error: secretErr } = await admin.rpc('get_daily_push_secret')
    if (secretErr || typeof secret !== 'string' || secret.length < 32) {
      return json({ error: 'secret indisponible' }, 500)
    }
    if (!safeEqual(req.headers.get('x-daily-secret') ?? '', secret)) {
      return json({ error: 'unauthorized' }, 401)
    }

    const body = await req.json().catch(() => ({}))
    const testUserId = typeof body?.test_user_id === 'string' ? body.test_user_id : null
    const simulateDay = Number.isInteger(body?.simulate_day) ? body.simulate_day as number : null

    const { date: parisDate, hour: parisHour } = parisNow()

    // ─── Tournée normale : bonne heure et une seule fois par jour ────────────
    if (!testUserId) {
      if (parisHour !== SEND_HOUR_PARIS) {
        return json({ ok: true, skipped: `il est ${parisHour} h à Paris` })
      }
      const { data: claimed, error: claimErr } = await admin
        .from('daily_push_runs')
        .upsert({ run_date: parisDate }, { onConflict: 'run_date', ignoreDuplicates: true })
        .select('run_date')
      if (claimErr) return json({ error: claimErr.message }, 500)
      if (!claimed || claimed.length === 0) {
        return json({ ok: true, skipped: `tournée du ${parisDate} déjà faite` })
      }
    }

    // ─── Clés VAPID ──────────────────────────────────────────────────────────
    const { data: vapid, error: vapidErr } = await admin.rpc('get_vapid_secrets')
    if (vapidErr) throw new Error(`Vault RPC: ${vapidErr.message}`)
    const vapidMap = new Map(
      ((vapid as Array<{ name: string; value: string }>) ?? []).map(s => [s.name, s.value])
    )
    const VAPID_PUBLIC = vapidMap.get('VAPID_PUBLIC_KEY')
    const VAPID_PRIVATE = vapidMap.get('VAPID_PRIVATE_KEY')
    const VAPID_SUBJECT = vapidMap.get('VAPID_SUBJECT') ?? 'mailto:contact@pro-vap.com'
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) throw new Error('VAPID keys missing in Vault')
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

    // ─── Données : abonnés, profils, paliers, messages ───────────────────────
    let subsQuery = admin
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .eq('enabled', true)
      .not('user_id', 'is', null)
    if (testUserId) subsQuery = subsQuery.eq('user_id', testUserId)
    const { data: subs, error: subsErr } = await subsQuery
    if (subsErr) throw new Error(subsErr.message)

    const userIds = [...new Set((subs ?? []).map(s => s.user_id as string))]
    if (userIds.length === 0) return await finish(admin, testUserId, parisDate, { sent: 0, note: 'aucun abonné' })

    const [{ data: profiles }, { data: badges }, { data: messages }] = await Promise.all([
      admin.from('profiles').select('id, quit_date').in('id', userIds).not('quit_date', 'is', null),
      admin.from('badges').select('day_threshold, title, description'),
      admin.from('daily_messages').select('day_number, message').order('day_number', { ascending: true }),
    ])

    const badgeByDay = new Map((badges ?? []).map(b => [b.day_threshold as number, b]))
    const messageByDay = new Map((messages ?? []).map(m => [m.day_number as number, m.message as string]))
    const pool = (messages ?? [])
      .filter(m => m.day_number >= LONG_RUN_FIRST_DAY && m.day_number <= LONG_RUN_LAST_DAY)
      .map(m => m.message as string)

    // Notification à envoyer pour chaque compte
    const todayUtc = Date.parse(`${parisDate}T00:00:00Z`)
    const payloadByUser = new Map<string, string>()
    for (const p of profiles ?? []) {
      const days = simulateDay ?? Math.floor((todayUtc - Date.parse(`${p.quit_date}T00:00:00Z`)) / DAY_MS)
      if (days <= 0) continue

      const badge = badgeByDay.get(days)
      if (badge) {
        payloadByUser.set(p.id, JSON.stringify({
          title: `Nouveau palier : ${badge.title}`,
          body: badge.description,
          url: '/badges',
          tag: `palier-${days}`,
        }))
        continue
      }

      let message = messageByDay.get(days)
      if (!message && days > LONG_RUN_FIRST_DAY && pool.length > 0) {
        message = pool[(days - LONG_RUN_FIRST_DAY) % pool.length]
      }
      if (!message) continue
      payloadByUser.set(p.id, JSON.stringify({
        title: `Jour ${days} · Votre message du jour`,
        body: message,
        url: '/',
        tag: `jour-${parisDate}`,
      }))
    }

    // ─── Envoi ───────────────────────────────────────────────────────────────
    let sent = 0, failed = 0, removed = 0
    const targets = (subs ?? []).filter(s => payloadByUser.has(s.user_id as string))
    for (let i = 0; i < targets.length; i += 20) {
      await Promise.all(targets.slice(i, i + 20).map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payloadByUser.get(s.user_id as string)!,
            { TTL: 60 * 60 * 12 }
          )
          sent += 1
        } catch (err) {
          const e = err as { statusCode?: number }
          if (e.statusCode === 404 || e.statusCode === 410) {
            await admin.from('push_subscriptions').delete().eq('id', s.id)
            removed += 1
          } else {
            failed += 1
          }
        }
      }))
    }

    return await finish(admin, testUserId, parisDate, {
      accounts: payloadByUser.size, sent, failed, removed_expired: removed,
    })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})

// Garde le bilan de la tournée dans daily_push_runs (pas pour les tests).
async function finish(
  admin: ReturnType<typeof createClient>,
  testUserId: string | null,
  parisDate: string,
  result: Record<string, unknown>,
) {
  console.log('daily-push', testUserId ? 'test' : parisDate, JSON.stringify(result))
  if (!testUserId) {
    await admin.from('daily_push_runs').update({ result, finished_at: new Date().toISOString() }).eq('run_date', parisDate)
  }
  return json({ ok: true, test: Boolean(testUserId), date: parisDate, ...result })
}

// Date (AAAA-MM-JJ) et heure actuelles à Paris
function parisNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false,
  }).formatToParts(new Date())
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) % 24 }
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
