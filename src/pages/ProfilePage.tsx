import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Phone, Calendar, FlaskConical, ChevronRight, LogOut, MapPin, Clock } from 'lucide-react'
import { Modal } from '../components/Modal'
import { useShop } from '../hooks/useShop'

const SHOPS = [
  'Client Internet', 'Noyon', 'Compiègne', 'Clermont', 'Nogent-sur-Oise', 'Breteuil', 'Beauvais', 'Ferrières-en-Bray',
]

const TOBACCO_TYPES = [
  { value: 'industrielle', label: 'Cigarette industrielle' },
  { value: 'roulée', label: 'Tabac à rouler' },
  { value: 'cigare', label: 'Cigare' },
  { value: 'cigarillo', label: 'Cigarillo' },
  { value: 'cannabis', label: 'Cannabis' },
  { value: 'mixte', label: 'Mixte' },
]

const AGE_RANGES = [
  'Moins de 25 ans',
  '25-40 ans',
  '40-55 ans',
  'Plus de 55 ans',
]

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function parseDateParts(dateStr: string | null) {
  if (!dateStr) return { day: '', month: '', year: '' }
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return { day: '', month: '', year: '' }
  return {
    day: String(d.getDate()),
    month: String(d.getMonth() + 1),
    year: String(d.getFullYear()),
  }
}

function buildDateStr(day: string, month: string, year: string): string {
  if (!day || !month || !year) return ''
  const d = parseInt(day)
  const m = parseInt(month) - 1
  const y = parseInt(year)
  const date = new Date(y, m, d)
  if (isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

export function ProfilePage() {
  const { profile, user, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)

  const initial = parseDateParts(profile?.quit_date || null)
  const [quitDay, setQuitDay] = useState(initial.day)
  const [quitMonth, setQuitMonth] = useState(initial.month)
  const [quitYear, setQuitYear] = useState(initial.year)

  const [cigsPerDay, setCigsPerDay] = useState(profile?.cigarettes_per_day || 0)
  const [packPrice, setPackPrice] = useState(profile?.pack_price || 0)
  const [preferredShop, setPreferredShop] = useState(profile?.preferred_shop || '')
  const [tobaccoType, setTobaccoType] = useState(profile?.tobacco_type || '')
  const [ageRange, setAgeRange] = useState(profile?.age_range || '')
  const [rewardName, setRewardName] = useState(profile?.reward_name || '')
  const [rewardAmount, setRewardAmount] = useState<string>(profile?.reward_amount?.toString() || '')

  // Appointment form
  const [apptName, setApptName] = useState(profile?.name || '')
  const [apptEmail, setApptEmail] = useState(profile?.email || '')
  const [apptMessage, setApptMessage] = useState('')
  const [apptSlot, setApptSlot] = useState('')

  useEffect(() => {
    if (profile) {
      const p = parseDateParts(profile.quit_date)
      setQuitDay(p.day)
      setQuitMonth(p.month)
      setQuitYear(p.year)
      setCigsPerDay(profile.cigarettes_per_day)
      setPackPrice(profile.pack_price)
      setPreferredShop(profile.preferred_shop || '')
      setTobaccoType(profile.tobacco_type || '')
      setAgeRange(profile.age_range || '')
      setRewardName(profile.reward_name || '')
      setRewardAmount(profile.reward_amount?.toString() || '')
    }
  }, [profile])

  // Savings calc for reward progress
  const quitDateStr = buildDateStr(quitDay, quitMonth, quitYear)
  const daysSmokeFree = quitDateStr
    ? Math.max(0, Math.floor((Date.now() - new Date(quitDateStr).getTime()) / 86400000))
    : 0
  const moneySaved = daysSmokeFree * (packPrice / 20) * cigsPerDay
  const kitPrice = profile?.kit_price || 0
  const netSavings = moneySaved - kitPrice
  const rewardAmountNum = parseFloat(rewardAmount) || 0
  const rewardProgress = rewardAmountNum > 0 ? Math.min(100, (Math.max(0, netSavings) / rewardAmountNum) * 100) : 0

  const handleSave = async () => {
    if (!user) return
    try {
      setLoading(true)
      const qd = buildDateStr(quitDay, quitMonth, quitYear)
      const { error } = await supabase.from('profiles').update({
        quit_date: qd || null,
        cigarettes_per_day: parseInt(cigsPerDay.toString()) || 0,
        pack_price: parseFloat(packPrice.toString()) || 0,
        preferred_shop: preferredShop || null,
        tobacco_type: (tobaccoType as any) || null,
        age_range: ageRange || null,
        reward_name: rewardName || null,
        reward_amount: parseFloat(rewardAmount) || null,
      }).eq('id', user.id)

      if (error) throw error
      await refreshProfile()
      toast.success('Profil mis à jour !')
    } catch {
      toast.error('Erreur lors de la mise à jour.')
    } finally {
      setLoading(false)
    }
  }

  const handleAppointmentSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Demande de rendez-vous - Pro'Vap ${preferredShop}`)
    const body = encodeURIComponent(
      `Nom : ${apptName}\nEmail : ${apptEmail}\nCréneau souhaité : ${apptSlot}\n\nMessage :\n${apptMessage}`
    )
    window.location.href = `mailto:contact@provap.fr?subject=${subject}&body=${body}`
    setAppointmentModalOpen(false)
    toast.success('Votre demande de rendez-vous a été préparée !')
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 50 }, (_, i) => String(currentYear - i))
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1))

  const { shop: shopData } = useShop(preferredShop || null)

  return (
    <div className="page p-4 pb-24 space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center mt-2">
        <h1 className="text-3xl font-display text-[#B8482A] tracking-wider">MON PROFIL</h1>
        <div className="w-12 h-12 bg-[#CB8002] rounded-full flex items-center justify-center text-[#1E1E22] font-display text-2xl shadow-lg">
          {profile?.name?.charAt(0).toUpperCase() || '?'}
        </div>
      </header>

      {/* ── Info Section ──────────────────────────────────────────────────────── */}
      <section className="card p-5 space-y-5">
        <h2 className="text-base font-semibold text-[#F1F1F1]">Mes informations</h2>

        {/* Date d'arrêt — 3 dropdowns */}
        <div>
          <label className="block text-xs text-[#686868] mb-2 ml-1 uppercase tracking-wider font-semibold">
            Date d'arrêt du tabac
          </label>
          <div className="grid grid-cols-3 gap-2">
            <select className="input text-sm" value={quitDay} onChange={e => setQuitDay(e.target.value)}>
              <option value="">Jour</option>
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="input text-sm" value={quitMonth} onChange={e => setQuitMonth(e.target.value)}>
              <option value="">Mois</option>
              {MONTHS.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
            </select>
            <select className="input text-sm" value={quitYear} onChange={e => setQuitYear(e.target.value)}>
              <option value="">Année</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Tobacco type */}
        <div>
          <label className="block text-xs text-[#686868] mb-1.5 ml-1 uppercase tracking-wider font-semibold">
            Type de tabac
          </label>
          <select className="input" value={tobaccoType} onChange={e => setTobaccoType(e.target.value)}>
            <option value="">Sélectionner...</option>
            {TOBACCO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Cigs + pack price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#686868] mb-1.5 ml-1 uppercase tracking-wider font-semibold">
              Cig. par jour
            </label>
            <div className="flex items-center border border-[#2E2E32] bg-[#1E1E22] rounded-[10px] overflow-hidden">
              <button
                type="button"
                onClick={() => setCigsPerDay(v => Math.max(0, v - 1))}
                className="w-10 h-11 flex items-center justify-center text-[#686868] text-xl font-bold hover:text-[#F1F1F1] hover:bg-[#2E2E32] transition-colors"
              >−</button>
              <span className="flex-1 text-center text-[#F1F1F1] font-semibold">{cigsPerDay}</span>
              <button
                type="button"
                onClick={() => setCigsPerDay(v => v + 1)}
                className="w-10 h-11 flex items-center justify-center text-[#686868] text-xl font-bold hover:text-[#F1F1F1] hover:bg-[#2E2E32] transition-colors"
              >+</button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#686868] mb-1.5 ml-1 uppercase tracking-wider font-semibold">
              Prix paquet (€)
            </label>
            <input
              type="number"
              step="0.1"
              className="input"
              value={packPrice}
              onChange={e => setPackPrice(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Shop */}
        <div>
          <label className="block text-xs text-[#686868] mb-1.5 ml-1 uppercase tracking-wider font-semibold">
            Boutique Pro'Vap
          </label>
          <select className="input" value={preferredShop} onChange={e => setPreferredShop(e.target.value)}>
            <option value="">Choisir une boutique</option>
            {SHOPS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Age range */}
        <div>
          <label className="block text-xs text-[#686868] mb-1.5 ml-1 uppercase tracking-wider font-semibold">
            Tranche d'âge
          </label>
          <select className="input" value={ageRange} onChange={e => setAgeRange(e.target.value)}>
            <option value="">Sélectionner...</option>
            {AGE_RANGES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </section>

      {/* Save Button */}
      <button onClick={handleSave} className="btn-primary" disabled={loading}>
        {loading ? 'Sauvegarde...' : 'Enregistrer mon profil'}
      </button>

      {/* ── Reward Section ────────────────────────────────────────────────────── */}
      <section className="card p-5 space-y-4">
        <h2 className="text-base font-semibold text-[#CB8002]">Mon Objectif Plaisir</h2>
        <div>
          <label className="block text-xs text-[#686868] mb-1.5 ml-1 uppercase tracking-wider font-semibold">
            Quel cadeau vous offrirez-vous ?
          </label>
          <input
            type="text"
            placeholder="Ex : Voyage, Console de jeu..."
            className="input"
            value={rewardName}
            onChange={e => setRewardName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-[#686868] mb-1.5 ml-1 uppercase tracking-wider font-semibold">
            Montant cible (€)
          </label>
          <input
            type="number"
            className="input"
            placeholder="Ex : 500"
            value={rewardAmount}
            onChange={e => setRewardAmount(e.target.value)}
          />
        </div>
        {rewardAmountNum > 0 && (
          <div>
            <div className="flex justify-between text-xs text-[#686868] mb-1.5">
              <span>Progression</span>
              <span className="text-[#CB8002] font-semibold">{Math.max(0, Math.floor(netSavings))}€ / {rewardAmountNum}€</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill-gold" style={{ width: `${rewardProgress}%` }} />
            </div>
            {rewardProgress < 100 && daysSmokeFree > 0 && cigsPerDay > 0 && (
              <p className="text-xs text-[#686868] mt-2">
                Dans {Math.max(0, Math.ceil((rewardAmountNum - Math.max(0, netSavings)) / ((packPrice / 20) * cigsPerDay)))} jours vous pourrez vous l'offrir
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── Kit Pro'Vap Section ───────────────────────────────────────────────── */}
      <section className="card p-5">
        <h2 className="text-base font-semibold text-[#F1F1F1] mb-3">Mon Kit Pro'Vap</h2>
        {profile?.smoker_profile ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[#CB8002] font-semibold">{profile.smoker_profile}</p>
                {profile.recommended_nicotine_mg && (
                  <p className="text-xs text-[#686868] mt-0.5">
                    Nicotine recommandée : <span className="text-[#B8482A] font-bold">{profile.recommended_nicotine_mg} mg/ml</span>
                  </p>
                )}
              </div>
              {profile.kit_price && (
                <span className="text-lg font-bold text-[#F1F1F1]">{profile.kit_price.toFixed(2)}€</span>
              )}
            </div>
            <button
              onClick={() => navigate('/diagnostic-kit')}
              className="flex items-center gap-2 text-xs text-[#686868] hover:text-[#B8482A] transition-colors mt-2"
            >
              <FlaskConical size={14} /> Revoir ma recommandation
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/diagnostic-kit')}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <FlaskConical size={18} /> Trouver mon kit idéal
          </button>
        )}
      </section>

      {/* ── Counselor Section ─────────────────────────────────────────────────── */}
      {preferredShop && (
        <section className="card p-5 accent-left bg-[rgba(184,72,42,0.05)]">
          <h2 className="text-base font-semibold text-[#F1F1F1] mb-0.5">Mon Conseiller Pro'Vap</h2>
          <p className="text-sm text-[#CB8002] mb-4">Boutique de {preferredShop}</p>

          <div className="space-y-2 mb-4">
            {shopData?.address && (
              <p className="text-sm text-[#686868] flex items-start gap-2">
                <MapPin size={14} className="text-[#B8482A] shrink-0 mt-0.5" />
                {shopData.address}
              </p>
            )}
            {shopData?.phone && (
              <p className="text-sm text-[#686868] flex items-center gap-2">
                <Phone size={14} className="text-[#B8482A] shrink-0" />
                {shopData.phone}
              </p>
            )}
            {shopData?.hours && (
              <p className="text-sm text-[#686868] flex items-center gap-2">
                <Clock size={14} className="text-[#B8482A] shrink-0" />
                {shopData.hours}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            {shopData?.phone && (
              <a
                href={`tel:${shopData.phone}`}
                className="flex-1 btn-secondary text-center flex items-center justify-center gap-2 text-sm py-3"
              >
                <Phone size={15} /> Appeler
              </a>
            )}
            <button
              onClick={() => setAppointmentModalOpen(true)}
              className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm py-3"
            >
              <Calendar size={15} /> Rendez-vous
            </button>
          </div>
        </section>
      )}

      {/* ── Fagerström + Logout ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-4 border-t border-[#2E2E32]">
        <button
          onClick={() => navigate('/fagerstrom')}
          className="w-full flex items-center justify-between text-[#F1F1F1] text-sm py-3 px-4 border border-[#2E2E32] rounded-[14px] hover:bg-[#1E1E22] transition-colors"
        >
          <span>Test de Fagerström {profile?.fagerstrom_score != null ? `(score : ${profile.fagerstrom_score}/10)` : ''}</span>
          <ChevronRight size={16} className="text-[#686868]" />
        </button>
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 text-[#C0392B] text-sm py-3 font-medium"
        >
          <LogOut size={16} /> Me déconnecter
        </button>
      </div>

      {/* Appointment Modal */}
      <Modal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        title="Demande de rendez-vous"
      >
        <form onSubmit={handleAppointmentSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-[#686868]">
            Boutique : <span className="text-[#CB8002] font-semibold">{preferredShop}</span>
          </p>

          <div>
            <label className="block text-xs text-[#686868] mb-1.5 uppercase font-semibold">Votre nom</label>
            <input className="input" value={apptName} onChange={e => setApptName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs text-[#686868] mb-1.5 uppercase font-semibold">Votre email</label>
            <input type="email" className="input" value={apptEmail} onChange={e => setApptEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs text-[#686868] mb-1.5 uppercase font-semibold">Créneau souhaité</label>
            <input
              className="input"
              placeholder="Ex : Mardi matin, vendredi après-midi..."
              value={apptSlot}
              onChange={e => setApptSlot(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-[#686868] mb-1.5 uppercase font-semibold">Message (optionnel)</label>
            <textarea
              className="input h-24 text-sm"
              placeholder="Décrivez brièvement votre situation..."
              value={apptMessage}
              onChange={e => setApptMessage(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary mt-2">Envoyer la demande</button>
        </form>
      </Modal>
    </div>
  )
}
