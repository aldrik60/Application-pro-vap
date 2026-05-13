import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Vap } from '../components/Vap'
import { ProVapLogo } from '../components/ProVapLogo'
import { Shop, ShopData } from '../types'
import { getPushSupport, subscribeUserToPush } from '../lib/pushNotifications'

interface BoutiqueItem {
  id: Shop
  name: string
  addr: string
  hours: string
}

const SHOP_ORDER: Shop[] = [
  'Noyon', 'Compiègne', 'Clermont', 'Nogent-sur-Oise',
  'Breteuil', 'Beauvais', 'Ferrières-en-Bray', 'Client Internet',
]

const INTERNET_BOUTIQUE: BoutiqueItem = {
  id: 'Client Internet',
  name: 'Client Internet',
  addr: 'Site provap.fr',
  hours: 'En ligne',
}

/**
 * Onboarding 3 écrans après création de compte.
 *
 *   01 · Bienvenue + présentation de Vap
 *   02 · Profil fumeur (cigs/jour, années, prix paquet)
 *   03 · Boutique de référence (8 boutiques Picardie)
 *
 * Direction : Apple × Hermès, serif italique, ample, sans pression.
 */

export function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [boutiques, setBoutiques] = useState<BoutiqueItem[]>([])

  useEffect(() => {
    let cancelled = false
    supabase.from('shops').select('*').then(({ data }) => {
      if (cancelled || !data) return
      const fromDb: BoutiqueItem[] = (data as ShopData[]).map(s => ({
        id: s.name as Shop,
        name: s.name,
        addr: s.address ?? '',
        hours: s.hours ?? '',
      }))
      const byId = new Map(fromDb.map(b => [b.id, b]))
      byId.set(INTERNET_BOUTIQUE.id, INTERNET_BOUTIQUE)
      setBoutiques(SHOP_ORDER.map(id => byId.get(id)).filter((b): b is BoutiqueItem => !!b))
    })
    return () => { cancelled = true }
  }, [])

  // Étape 2 — profil fumeur
  const [cigsPerDay, setCigsPerDay] = useState<number>(profile?.cigarettes_per_day || 18)
  const [packPrice, setPackPrice] = useState<number>(profile?.pack_price || 11.20)

  // Étape 3 — boutique
  const [selectedShop, setSelectedShop] = useState<Shop | ''>(profile?.preferred_shop || '')

  const handleFinish = async () => {
    if (!user) {
      navigate('/profil')
      return
    }
    try {
      setSaving(true)
      const { error } = await supabase.from('profiles').update({
        cigarettes_per_day: cigsPerDay,
        pack_price: packPrice,
        preferred_shop: selectedShop || null,
        onboarding_completed: true,
      }).eq('id', user.id)
      if (error) throw error
      await refreshProfile()

      // Opt-in notifications par défaut : on tente la souscription pendant
      // que le geste utilisateur (clic sur Sceller) est encore actif.
      // Échec silencieux si refus / non supporté / iOS pas encore installé.
      const support = getPushSupport()
      if (support === 'permission-default') {
        try { await subscribeUserToPush(user.id) } catch { /* silencieux */ }
      }

      navigate('/', { replace: true })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur lors de l'enregistrement."
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = handleFinish

  return (
    <div className="min-h-screen flex flex-col bg-bg" style={{ padding: '24px 28px 32px' }}>
      <OnbHeader step={step} onSkip={handleSkip} />

      <div className="flex-1 flex flex-col">
        {step === 1 && (
          <StepWelcome
            onContinue={() => setStep(2)}
            hasAccount={!!profile?.email}
          />
        )}
        {step === 2 && (
          <StepSmoker
            cigsPerDay={cigsPerDay}
            packPrice={packPrice}
            onCigsPerDay={setCigsPerDay}
            onPackPrice={setPackPrice}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepBoutique
            boutiques={boutiques}
            selected={selectedShop}
            onSelect={setSelectedShop}
            onBack={() => setStep(2)}
            onFinish={handleFinish}
            saving={saving}
          />
        )}
      </div>
    </div>
  )
}

/* ─── Header + progress bar ───────────────────────────────────────────── */

function OnbHeader({ step, onSkip }: { step: number; onSkip: () => void }) {
  return (
    <>
      <div className="flex justify-between items-center">
        <ProVapLogo height={18} />
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-ink-3" style={{ letterSpacing: '0.2em' }}>
            0{step} / 03
          </span>
          <button
            onClick={onSkip}
            className="text-[10px] text-ink-3 hover:text-ink transition-colors"
            style={{ letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}
          >
            Passer
          </button>
        </div>
      </div>
      <div className="mt-3 rounded-full overflow-hidden" style={{ height: 2, background: 'var(--color-line)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${(step / 3) * 100}%`, background: 'var(--color-pv-ochre)' }}
        />
      </div>
    </>
  )
}

/* ─── Étape 1 — Bienvenue ─────────────────────────────────────────────── */

function StepWelcome({ onContinue, hasAccount }: { onContinue: () => void; hasAccount: boolean }) {
  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <Vap stage={1} size={180} withScene />
        <div className="mt-4">
          <p className="display-italic text-pv-ochre" style={{ fontSize: 16 }}>Bienvenue.</p>
          <h1
            className="display mt-3 text-ink"
            style={{ fontSize: 38, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.05 }}
          >
            Voici <span className="display-italic">Vap.</span><br />Il vous accompagne.
          </h1>
          <p className="mt-5 text-sm text-ink-2 leading-relaxed max-w-[300px] mx-auto">
            Plus vous tenez, plus il se redresse. Au bout d'un an, il sera au sommet — avec vous.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <button className="btn-primary" onClick={onContinue}>Commencer mon parcours</button>
        {!hasAccount && <button className="btn-ghost">J'ai déjà un compte</button>}
      </div>
    </>
  )
}

/* ─── Étape 2 — Profil fumeur ─────────────────────────────────────────── */

function StepSmoker({
  cigsPerDay, packPrice,
  onCigsPerDay, onPackPrice,
  onBack, onContinue,
}: {
  cigsPerDay: number; packPrice: number
  onCigsPerDay: (v: number) => void; onPackPrice: (v: number) => void
  onBack: () => void; onContinue: () => void
}) {
  return (
    <>
      <div className="flex-1 pt-8">
        <span className="eyebrow text-pv-terracotta">Étape 02</span>
        <h1
          className="display mt-3 text-ink"
          style={{ fontSize: 34, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.05 }}
        >
          Votre rapport<br />au <span className="display-italic">tabac.</span>
        </h1>
        <p className="mt-3 text-[13px] text-ink-2 leading-relaxed">
          Ces informations calibrent votre parcours et vos économies.
        </p>

        <div className="mt-8 flex flex-col gap-6">
          <NumberStepper
            label="Cigarettes par jour"
            value={cigsPerDay}
            onChange={onCigsPerDay}
            unit="cig."
            min={1}
            max={60}
            step={1}
          />
          <NumberStepper
            label="Prix d'un paquet"
            value={packPrice}
            onChange={onPackPrice}
            unit="€"
            min={5}
            max={20}
            step={0.1}
            decimals={2}
          />
        </div>
      </div>
      <div className="flex gap-2.5">
        <button onClick={onBack} className="btn-ghost" style={{ flex: '0 0 auto', padding: '16px 24px', width: 'auto' }}>
          Retour
        </button>
        <button onClick={onContinue} className="btn-primary" style={{ flex: 1 }}>
          Continuer
        </button>
      </div>
    </>
  )
}

function NumberStepper({
  label, value, onChange, unit, min, max, step, decimals = 0,
}: {
  label: string; value: number; onChange: (v: number) => void
  unit: string; min: number; max: number; step: number; decimals?: number
}) {
  const dec = (v: number) => Math.max(min, +(v - step).toFixed(decimals))
  const inc = (v: number) => Math.min(max, +(v + step).toFixed(decimals))
  return (
    <div>
      <span className="eyebrow">{label}</span>
      <div className="mt-3 flex items-baseline gap-3">
        <button
          onClick={() => onChange(dec(value))}
          aria-label="Diminuer"
          className="w-9 h-9 rounded-full border border-line-strong flex items-center justify-center text-ink hover:bg-bg-elev transition-colors"
          style={{ fontSize: 18, lineHeight: 1 }}
        >−</button>
        <span
          className="font-display tabular text-ink flex-1 text-center"
          style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em' }}
        >
          {decimals > 0 ? value.toFixed(decimals).replace('.', ',') : value}
          <span className="display-italic text-ink-3 ml-1" style={{ fontSize: 15 }}>{unit}</span>
        </span>
        <button
          onClick={() => onChange(inc(value))}
          aria-label="Augmenter"
          className="w-9 h-9 rounded-full border border-line-strong flex items-center justify-center text-ink hover:bg-bg-elev transition-colors"
          style={{ fontSize: 18, lineHeight: 1 }}
        >+</button>
      </div>
      <div className="mt-2 hairline" />
    </div>
  )
}

/* ─── Étape 3 — Boutique de référence ─────────────────────────────────── */

function StepBoutique({
  boutiques, selected, onSelect, onBack, onFinish, saving,
}: {
  boutiques: BoutiqueItem[]
  selected: Shop | ''
  onSelect: (s: Shop) => void
  onBack: () => void
  onFinish: () => void
  saving: boolean
}) {
  return (
    <>
      <div className="flex-1 pt-8 pb-4 overflow-y-auto">
        <span className="eyebrow text-pv-terracotta">Étape 03</span>
        <h1
          className="display mt-3 text-ink"
          style={{ fontSize: 34, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.05 }}
        >
          Votre <span className="display-italic">point d'ancrage.</span>
        </h1>
        <p className="mt-3 text-[13px] text-ink-2 leading-relaxed">
          Choisissez la boutique Pro'Vap qui vous suivra. Vous pourrez en changer.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          {boutiques.map(b => {
            const isSelected = selected === b.id
            return (
              <button
                key={b.id}
                onClick={() => onSelect(b.id)}
                className="flex items-center gap-3 text-left transition-colors"
                style={{
                  padding: '14px 16px',
                  background: isSelected ? 'var(--color-bg-elev)' : 'transparent',
                  border: '1px solid ' + (isSelected ? 'var(--color-pv-ochre)' : 'var(--color-line)'),
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-ink)',
                }}
              >
                <PinIcon color={isSelected ? 'var(--color-pv-ochre)' : 'var(--color-ink-3)'} />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-ink" style={{ fontSize: 16, fontWeight: 500 }}>{b.name}</p>
                  <p className="text-[10px] text-ink-3 mt-0.5">{b.addr} · {b.hours}</p>
                </div>
                {isSelected && <CheckIcon />}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex gap-2.5 pt-3">
        <button onClick={onBack} className="btn-ghost" style={{ flex: '0 0 auto', padding: '16px 24px', width: 'auto' }}>
          Retour
        </button>
        <button
          onClick={onFinish}
          className="btn-primary"
          style={{ flex: 1 }}
          disabled={saving}
        >
          {saving ? 'Enregistrement…' : 'Sceller mon engagement'}
        </button>
      </div>
    </>
  )
}

function PinIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c-4 0-7 3-7 7 0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="var(--color-pv-ochre)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5L20 7"/>
    </svg>
  )
}
