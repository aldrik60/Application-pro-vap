// Edge Function send-push (envois manuels depuis l'Admin).
// v8 (2026-10-25) : un message ciblé (boutique ou clients précis) est archivé
// avec target_user_ids ; la RLS push_messages_read_own ne le montre qu'à ses
// destinataires. Un message à tous garde target_user_ids = null.
// v5 : normalise url '/' → null en base (pas de lien « Ouvrir » inutile).

import webpush from 'https://esm.sh/web-push@3.6.7?bundle&target=denonext'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type SubscriptionRow = {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const ANON_KEY      = Deno.env.get('SUPABASE_ANON_KEY')!

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE)

    const { data: secrets, error: secretsErr } = await adminClient.rpc('get_vapid_secrets')
    if (secretsErr) {
      return json({ error: `Vault RPC: ${secretsErr.message}` }, 500)
    }

    const secretMap = new Map(
      ((secrets as Array<{ name: string; value: string }>) ?? []).map(s => [s.name, s.value])
    )
    const VAPID_PUBLIC  = secretMap.get('VAPID_PUBLIC_KEY')
    const VAPID_PRIVATE = secretMap.get('VAPID_PRIVATE_KEY')
    const VAPID_SUBJECT = secretMap.get('VAPID_SUBJECT') ?? 'mailto:contact@provap.fr'

    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      return json({ error: 'VAPID keys missing in Vault' }, 500)
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) return json({ error: 'Missing auth token' }, 401)

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: authErr } = await userClient.auth.getUser(token)
    if (authErr || !user) return json({ error: 'Invalid auth' }, 401)

    const { data: isAdmin, error: roleErr } = await userClient.rpc('is_admin')
    if (roleErr || isAdmin !== true) {
      return json({ error: 'Forbidden — admin required' }, 403)
    }

    const { title, body, url, target } = await req.json()
    if (!title || !body) {
      return json({ error: 'title and body are required' }, 400)
    }

    // Normalise l'URL: '/' ou vide → null en base (pas de lien Ouvrir
    // à afficher dans /messages). Pour le payload push, '/' = accueil par défaut.
    const trimmedUrl = (typeof url === 'string' ? url.trim() : '')
    const storedUrl = (trimmedUrl && trimmedUrl !== '/') ? trimmedUrl : null

    let query = adminClient
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .eq('enabled', true)

    if (Array.isArray(target) && target.length > 0) {
      query = query.in('user_id', target)
    }

    const { data: subs, error: subsErr } = await query
    if (subsErr) return json({ error: subsErr.message }, 500)

    const recipientsCount = subs?.length ?? 0
    let messageId: string | null = null
    {
      const { data: archived, error: archiveErr } = await adminClient
        .from('push_messages')
        .insert({
          title: title.trim(),
          body: body.trim(),
          url: storedUrl,
          sent_by: user.id,
          recipients_count: recipientsCount,
          target_user_ids: Array.isArray(target) && target.length > 0 ? target : null,
        })
        .select('id')
        .single()
      if (archiveErr) {
        console.error('Archive failed:', archiveErr.message)
      } else {
        messageId = archived?.id ?? null
      }
    }

    if (!subs || subs.length === 0) {
      return json({ sent: 0, total: 0, message_id: messageId, message: 'No active subscriptions' }, 200)
    }

    const payload = JSON.stringify({
      title,
      body,
      url: storedUrl || '/messages',
      tag: `provap-${messageId ?? Date.now()}`,
    })

    let sent = 0
    let removed = 0
    const errors: string[] = []

    await Promise.all((subs as SubscriptionRow[]).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { TTL: 60 * 60 * 24 }
        )
        sent += 1
      } catch (err) {
        const e = err as { statusCode?: number; body?: string; message?: string }
        if (e.statusCode === 404 || e.statusCode === 410) {
          await adminClient.from('push_subscriptions').delete().eq('id', s.id)
          removed += 1
        } else {
          errors.push(`${s.endpoint.slice(0, 40)}…: ${e.message ?? e.statusCode}`)
        }
      }
    }))

    return json({
      sent,
      removed,
      total: subs.length,
      message_id: messageId,
      errors: errors.length > 0 ? errors : undefined,
    }, 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return json({ error: message }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
