// Edge Function notify-rdv v1 — DÉPLOYÉE EN PROD le 2026-07-22.
// Déclenchée par le trigger Postgres `appointment_requests_notify` (pg_net)
// à chaque nouvelle demande de RDV conseiller. Voir supabase/notify_rdv.sql.
//
// Sécurité (verify_jwt=false car appelée par pg_net, qui ne porte pas de JWT) :
// - le payload ne contient qu'un id (UUID non devinable) ;
// - la fonction relit la ligne en base via service_role : id inconnu → rien ;
// - déduplication atomique via notified_at (une seule notification par demande).
//
// Actions : e-mail vers MAIL_TO (défaut rdv@pro-vap.fr) via SMTP o2switch
// + push web vers les appareils des admins (clés VAPID depuis le Vault).
// Si les secrets SMTP ne sont pas configurés, l'e-mail est ignoré proprement.
//
// Secrets attendus (Dashboard Supabase → Edge Functions → Secrets) :
//   SMTP_HOST, SMTP_PORT (défaut 465), SMTP_USER, SMTP_PASS
//   MAIL_TO (défaut rdv@pro-vap.fr), MAIL_FROM (défaut = SMTP_USER)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import webpush from 'https://esm.sh/web-push@3.6.7?bundle&target=denonext'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const ADMIN_URL = 'https://application-pro-vap.vercel.app/admin'

// Anti-injection d'en-têtes SMTP : jamais de retour à la ligne dans un header.
const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim()

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

    const { id } = await req.json().catch(() => ({}))
    if (!id || typeof id !== 'string') return json({ error: 'id required' }, 400)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Réclamation atomique : ne notifie qu'une seule fois par demande.
    const { data: rdv, error: claimErr } = await admin
      .from('appointment_requests')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', id)
      .is('notified_at', null)
      .select('*')
      .maybeSingle()

    if (claimErr) return json({ error: claimErr.message }, 500)
    if (!rdv) return json({ ok: true, skipped: 'demande inconnue ou déjà notifiée' }, 200)

    const results: Record<string, unknown> = {}

    // ─── 1. E-mail vers l'adresse centrale ───────────────────────────────────
    const SMTP_HOST = Deno.env.get('SMTP_HOST')
    const SMTP_PORT = Number(Deno.env.get('SMTP_PORT') ?? '465')
    const SMTP_USER = Deno.env.get('SMTP_USER')
    const SMTP_PASS = Deno.env.get('SMTP_PASS')
    const MAIL_TO   = Deno.env.get('MAIL_TO') ?? 'rdv@pro-vap.fr'
    const MAIL_FROM = Deno.env.get('MAIL_FROM') ?? SMTP_USER ?? ''

    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      try {
        const client = new SMTPClient({
          connection: {
            hostname: SMTP_HOST,
            port: SMTP_PORT,
            tls: SMTP_PORT === 465,
            auth: { username: SMTP_USER, password: SMTP_PASS },
          },
        })

        const createdAt = new Date(rdv.created_at).toLocaleString('fr-FR', {
          timeZone: 'Europe/Paris', dateStyle: 'full', timeStyle: 'short',
        })

        const lines = [
          'Nouvelle demande de rendez-vous conseiller Pro\'Vap',
          '',
          `Boutique         : ${rdv.shop}`,
          `Nom              : ${rdv.name}`,
          `Email            : ${rdv.email}`,
          `Téléphone        : ${rdv.phone || '—'}`,
          `Créneau souhaité : ${rdv.preferred_slot || '—'}`,
          `Message          : ${rdv.message || '—'}`,
          `Reçue le         : ${createdAt}`,
          '',
          `Traiter la demande : ${ADMIN_URL}`,
        ]

        await client.send({
          from: MAIL_FROM,
          to: MAIL_TO,
          replyTo: oneLine(rdv.email || MAIL_FROM),
          subject: oneLine(`Nouveau RDV — ${rdv.shop} — ${rdv.name}`),
          content: lines.join('\n'),
        })
        await client.close()
        results.email = `envoyé à ${MAIL_TO}`
      } catch (e) {
        results.email = `échec : ${e instanceof Error ? e.message : String(e)}`
      }
    } else {
      results.email = 'ignoré — secrets SMTP non configurés'
    }

    // ─── 2. Push web vers les admins ─────────────────────────────────────────
    try {
      const { data: secrets, error: secretsErr } = await admin.rpc('get_vapid_secrets')
      if (secretsErr) throw new Error(`Vault RPC: ${secretsErr.message}`)

      const secretMap = new Map(
        ((secrets as Array<{ name: string; value: string }>) ?? []).map(s => [s.name, s.value])
      )
      const VAPID_PUBLIC  = secretMap.get('VAPID_PUBLIC_KEY')
      const VAPID_PRIVATE = secretMap.get('VAPID_PRIVATE_KEY')
      const VAPID_SUBJECT = secretMap.get('VAPID_SUBJECT') ?? 'mailto:contact@provap.fr'
      if (!VAPID_PUBLIC || !VAPID_PRIVATE) throw new Error('VAPID keys missing in Vault')

      webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

      const { data: admins } = await admin.from('profiles').select('id').eq('role', 'admin')
      const adminIds = (admins ?? []).map(a => a.id)

      let sent = 0
      if (adminIds.length > 0) {
        const { data: subs } = await admin
          .from('push_subscriptions')
          .select('id, endpoint, p256dh, auth')
          .eq('enabled', true)
          .in('user_id', adminIds)

        const payload = JSON.stringify({
          title: `Nouveau RDV — ${rdv.shop}`,
          body: `${rdv.name}${rdv.preferred_slot ? ' · ' + rdv.preferred_slot : ''}`,
          url: '/admin',
          tag: `rdv-${rdv.id}`,
        })

        await Promise.all((subs ?? []).map(async (s) => {
          try {
            await webpush.sendNotification(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              payload,
              { TTL: 60 * 60 * 24 }
            )
            sent += 1
          } catch (err) {
            const e = err as { statusCode?: number }
            if (e.statusCode === 404 || e.statusCode === 410) {
              await admin.from('push_subscriptions').delete().eq('id', s.id)
            }
          }
        }))
      }
      results.push = `${sent} appareil(s) admin notifié(s)`
    } catch (e) {
      results.push = `échec : ${e instanceof Error ? e.message : String(e)}`
    }

    console.log('notify-rdv', rdv.id, JSON.stringify(results))
    return json({ ok: true, ...results }, 200)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
