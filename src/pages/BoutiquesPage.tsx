import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Phone, ChevronLeft, ChevronRight } from 'lucide-react'
import { Shop, ShopData } from '../types'

/**
 * Page Boutiques — Le réseau Pro'Vap.
 * Données dynamiques depuis Supabase (table `shops`).
 */

interface Boutique {
  id: Shop
  name: string
  addr: string
  hours: string
  phone?: string
}

const INTERNET_BOUTIQUE: Boutique = {
  id: 'Client Internet',
  name: 'provap.fr',
  addr: 'Boutique en ligne',
  hours: '24h / 24',
  phone: undefined,
}

const SHOP_ORDER: Shop[] = [
  'Noyon', 'Compiègne', 'Clermont', 'Nogent-sur-Oise',
  'Breteuil', 'Beauvais', 'Ferrières-en-Bray', 'Client Internet',
]

// Positions abstraites sur la carte Picardie pour les 8 boutiques
const PINS: [number, number][] = [
  [80, 110],  // Noyon
  [120, 70],  // Compiègne
  [160, 95],  // Clermont
  [200, 65],  // Nogent
  [200, 130], // Breteuil
  [250, 105], // Beauvais
  [280, 75],  // Ferrières
  [140, 140], // Client Internet
]

export function BoutiquesPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const fav = profile?.preferred_shop
  const [boutiques, setBoutiques] = useState<Boutique[]>([])

  useEffect(() => {
    let cancelled = false
    supabase.from('shops').select('*').then(({ data }) => {
      if (cancelled || !data) return
      const fromDb: Boutique[] = (data as ShopData[]).map(s => ({
        id: s.name as Shop,
        name: s.name,
        addr: s.address ?? '',
        hours: s.hours ?? '',
        phone: s.phone ?? undefined,
      }))
      // Garantit la présence de Client Internet et ordre cohérent
      const byId = new Map(fromDb.map(b => [b.id, b]))
      byId.set(INTERNET_BOUTIQUE.id, INTERNET_BOUTIQUE)
      setBoutiques(SHOP_ORDER.map(id => byId.get(id)).filter((b): b is Boutique => !!b))
    })
    return () => { cancelled = true }
  }, [])

  const favBoutique = boutiques.find(b => b.id === fav)
  const others = boutiques.filter(b => b.id !== fav)
  const favIndex = boutiques.findIndex(b => b.id === fav)

  return (
    <div className="page pb-32">
      {/* Header */}
      <header className="px-6 pt-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Retour"
          className="p-2 -ml-2 text-ink-3 hover:text-ink"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <span className="eyebrow">Le réseau</span>
          <h1 className="display text-ink mt-1" style={{ fontSize: 32 }}>
            Les <span className="display-italic">8 boutiques</span>
          </h1>
        </div>
      </header>

      {/* Carte abstraite Picardie */}
      <section className="px-5 mt-5">
        <div
          className="relative overflow-hidden"
          style={{
            height: 180,
            background: 'var(--color-bg-elev)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-line)',
          }}
        >
          <svg viewBox="0 0 350 180" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="mapDots" width="14" height="14" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.8" fill="rgba(246,241,232,0.08)" />
              </pattern>
            </defs>
            <rect width="350" height="180" fill="url(#mapDots)" />
            <path
              d="M 40 130 Q 30 80, 90 50 Q 160 30, 240 60 Q 310 80, 300 140 Q 220 165, 140 155 Q 70 150, 40 130 Z"
              fill="rgba(162, 55, 26, 0.05)"
              stroke="rgba(203, 128, 2, 0.4)"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
            {PINS.map(([x, y], i) => {
              const isFav = i === favIndex
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="6" fill={isFav ? '#a2371a' : '#cb8002'} opacity={isFav ? 1 : 0.85} />
                  <circle cx={x} cy={y} r="2" fill="#f6f1e8" />
                  {isFav && <circle cx={x} cy={y} r="12" fill="none" stroke="#a2371a" strokeWidth="1" opacity="0.5" />}
                </g>
              )
            })}
          </svg>
          <p
            className="absolute eyebrow text-ink-3"
            style={{ bottom: 10, left: 14 }}
          >
            Picardie · 8 points de vente
          </p>
        </div>
      </section>

      {/* Boutique de référence */}
      {favBoutique ? (
        <section className="px-5 mt-5">
          <span className="eyebrow text-flame-text">Votre boutique de référence</span>
          <div
            className="mt-3 p-5 flex items-center gap-3.5"
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-gold-text)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <PinSvg color="var(--color-gold-text)" size={20} />
            <div className="flex-1 min-w-0">
              <p className="font-display text-ink" style={{ fontSize: 20, fontWeight: 500 }}>
                {favBoutique.name}
              </p>
              <p className="text-[12px] text-ink-3 mt-1">
                {favBoutique.addr} · {favBoutique.hours}
              </p>
            </div>
            {favBoutique.phone && (
              <a
                href={`tel:${favBoutique.phone.replace(/\s/g, '')}`}
                aria-label={`Appeler ${favBoutique.name}`}
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95"
                style={{
                  background: 'var(--color-pv-terracotta)',
                  color: 'var(--color-pv-ivory)',
                }}
              >
                <Phone size={15} strokeWidth={1.6} />
              </a>
            )}
          </div>
        </section>
      ) : (
        <section className="px-5 mt-5">
          <div className="card p-5">
            <p className="text-sm text-ink-2 leading-relaxed">
              Aucune boutique de référence sélectionnée.{' '}
              <button
                onClick={() => navigate('/profil')}
                className="text-gold-text underline-offset-2 hover:underline"
              >
                Choisir depuis le profil.
              </button>
            </p>
          </div>
        </section>
      )}

      {/* Autres boutiques */}
      <section className="px-6 mt-7">
        <span className="eyebrow">Les autres boutiques</span>
      </section>
      <section className="px-5 mt-2">
        {others.map((b, i, arr) => (
          <div
            key={b.id}
            className="flex items-center gap-3.5 py-3.5"
            style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--color-line)' : 'none' }}
          >
            <PinSvg color="var(--color-ink-3)" size={16} strokeWidth={1.3} />
            <div className="flex-1 min-w-0">
              <p className="font-display text-ink" style={{ fontSize: 17 }}>{b.name}</p>
              <p className="text-[12px] text-ink-3 mt-0.5 truncate">{b.addr}</p>
            </div>
            {b.phone ? (
              <a
                href={`tel:${b.phone.replace(/\s/g, '')}`}
                aria-label={`Appeler ${b.name}`}
                className="text-ink-3 hover:text-ink-2 transition-colors shrink-0 p-1"
              >
                <Phone size={14} strokeWidth={1.3} />
              </a>
            ) : (
              <ChevronRight size={14} className="text-ink-3 shrink-0" strokeWidth={1.3} />
            )}
          </div>
        ))}
      </section>
    </div>
  )
}

function PinSvg({ color, size = 16, strokeWidth = 1.4 }: { color: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c-4 0-7 3-7 7 0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}
