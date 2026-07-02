// Ping quotidien déclenché par le cron Vercel (voir vercel.json).
// Le plan Supabase FREE met le projet en pause après 7 jours sans activité
// API — ce qui a coupé la prod le 2026-07-02. Une requête par jour suffit
// à le garder éveillé.
export default async function handler(req, res) {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    res.status(500).json({ ok: false, error: 'Variables Supabase absentes' })
    return
  }
  try {
    const r = await fetch(`${url}/rest/v1/shops?select=id&limit=1`, {
      headers: { apikey: key },
    })
    res.status(r.ok ? 200 : 502).json({
      ok: r.ok,
      status: r.status,
      at: new Date().toISOString(),
    })
  } catch (e) {
    res.status(502).json({ ok: false, error: String(e) })
  }
}
