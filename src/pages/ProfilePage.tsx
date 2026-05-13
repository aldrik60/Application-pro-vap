import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import {
  Phone, Calendar, ChevronRight, LogOut, MapPin, Clock,
  Trash2, Download, BookHeart, FlaskConical,
} from 'lucide-react'
import { Modal } from '../components/Modal'
import { useShop } from '../hooks/useShop'
import { IS_FULL } from '../lib/appMode'
import { Vap, vapStageFromDays } from '../components/Vap'
import type { TobaccoType } from '../types'

const SHOPS = [
  'Client Internet', 'Noyon', 'Compiègne', 'Clermont', 'Nogent-sur-Oise',
  'Breteuil', 'Beauvais', 'Ferrières-en-Bray',
]

const TOBACCO_TYPES = [
  { value: 'industrielle', label: 'Cigarette industrielle' },
  { value: 'roulée',       label: 'Tabac à rouler' },
  { value: 'cigare',       label: 'Cigare' },
  { value: 'cigarillo',    label: 'Cigarillo' },
  { value: 'cannabis',     label: 'Cannabis' },
  { value: 'mixte',        label: 'Mixte' },
]

const AGE_RANGES = ['Moins de 25 ans', '25-40 ans', '40-55 ans', 'Plus de 55 ans']

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function parseDateParts(dateStr: string | null) {
  if (!dateStr) return { day: '', month: '', year: '' }
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return { day: '', month: '', year: '' }
  return { day: String(d.getDate()), month: String(d.getMonth() + 1), year: String(d.getFullYear()) }
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)

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

  const [apptName, setApptName] = useState(profile?.name || '')
  const [apptEmail, setApptEmail] = useState(profile?.email || '')
  const [apptMessage, setApptMessage] = useState('')
  const [apptSlot, setApptSlot] = useState('')

  useEffect(() => {
    if (profile) {
      const p = parseDateParts(profile.quit_date)
      setQuitDay(p.day); setQuitMonth(p.month); setQuitYear(p.year)
      setCigsPerDay(profile.cigarettes_per_day)
      setPackPrice(profile.pack_price)
      setPreferredShop(profile.preferred_shop || '')
      setTobaccoType(profile.tobacco_type || '')
      setAgeRange(profile.age_range || '')
      setRewardName(profile.reward_name || '')
      setRewardAmount(profile.reward_amount?.toString() || '')
    }
  }, [profile])

  const quitDateStr = buildDateStr(quitDay, quitMonth, quitYear)
  const daysSmokeFree = quitDateStr
    ? Math.max(0, Math.floor((Date.now() - new Date(quitDateStr).getTime()) / 86400000))
    : 0
  const moneySaved = daysSmokeFree * (packPrice / 20) * cigsPerDay
  const cigsAvoided = daysSmokeFree * cigsPerDay
  const stage = vapStageFromDays(daysSmokeFree)

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
        tobacco_type: (tobaccoType as TobaccoType) || null,
        age_range: ageRange || null,
        reward_name: rewardName || null,
        reward_amount: parseFloat(rewardAmount) || null,
      }).eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      toast.success('Profil mis à jour')
    } catch {
      toast.error('Erreur lors de la mise à jour.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    if (!user) return
    try {
      setExporting(true)
      const [{ data: profileRow }, { data: checkins }, { data: stories }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('nicotine_checkins').select('*').eq('user_id', user.id),
        supabase.from('vaper_stories').select('*').eq('user_id', user.id),
      ])
      const payload = {
        export_date: new Date().toISOString(),
        export_format_version: 1,
        application: "Pro'Vap Sevrage",
        profile: profileRow ?? null,
        nicotine_checkins: checkins ?? [],
        vaper_stories: stories ?? [],
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `provap-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Vos données ont été exportées.')
    } catch {
      toast.error("Erreur lors de l'export.")
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'SUPPRIMER') {
      toast.error('Veuillez taper SUPPRIMER pour confirmer.')
      return
    }
    try {
      setDeleting(true)
      const { error } = await supabase.rpc('delete_my_account')
      if (error) throw error
      await supabase.auth.signOut()
      toast.success('Compte supprimé.')
      navigate('/login', { replace: true })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur lors de la suppression.'
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  const handleAppointmentSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Demande de rendez-vous · Pro'Vap ${preferredShop}`)
    const body = encodeURIComponent(
      `Nom : ${apptName}\nEmail : ${apptEmail}\nCréneau souhaité : ${apptSlot}\n\nMessage :\n${apptMessage}`
    )
    window.location.href = `mailto:contact@provap.fr?subject=${subject}&body=${body}`
    setAppointmentModalOpen(false)
    toast.success('Votre demande a été préparée')
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 50 }, (_, i) => String(currentYear - i))
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1))
  const { shop: shopData } = useShop(preferredShop || null)

  const initialLetter = profile?.name?.charAt(0).toUpperCase() || '?'
  const todayLabel = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="page pb-32">
      {/* Header */}
      <header className="px-6 pt-6">
        <span className="eyebrow">Profil</span>
      </header>

      {/* Identité — carte d'identité Pro'Vap */}
      <section className="px-5 mt-3">
        <div
          className="relative overflow-hidden p-6"
          style={{
            background: 'linear-gradient(155deg, var(--color-bg-elev), var(--color-bg-card))',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-line)',
          }}
        >
          {/* Vap en filigrane */}
          <div className="absolute top-3 right-3 opacity-70 pointer-events-none" aria-hidden>
            <Vap stage={stage} size={84} />
          </div>

          <div className="flex items-center gap-4">
            <div
              className="rounded-full flex items-center justify-center font-display"
              style={{
                width: 64, height: 64,
                background: 'linear-gradient(150deg, var(--color-pv-ochre), #8a5a02)',
                color: 'var(--color-pv-ivory)',
                fontSize: 28, fontWeight: 500,
                boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.15), inset 0 0 12px rgba(0,0,0,0.25)',
              }}
            >
              {initialLetter}
            </div>
            <div>
              <p className="font-display text-ink" style={{ fontSize: 26, fontWeight: 500 }}>
                {profile?.name || 'Votre nom'}
              </p>
              <p className="text-[10px] text-ink-3 mt-1" style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Membre · {daysSmokeFree} jour{daysSmokeFree > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="hairline my-5" />

          <div className="grid grid-cols-3 gap-4">
            <ProfStat label="Cig. évitées" value={String(cigsAvoided)} />
            <ProfStat label="Économies"    value={`${moneySaved.toFixed(0)} €`} accent />
            <ProfStat label="Étapes"       value={`${stage} / 6`} />
          </div>
        </div>
      </section>

      {/* Pacte personnel — carte ivoire avec grain */}
      <section className="px-5 mt-4">
        <div className="card-paper grain relative p-5">
          <span className="eyebrow" style={{ color: 'rgba(40,40,45,0.6)' }}>Pacte personnel</span>
          <p
            className="display-italic mt-3"
            style={{ fontSize: 17, lineHeight: 1.45, color: 'rgba(40,40,45,0.85)' }}
          >
            Je m'engage à essayer, un jour à la fois, sans me punir si je tombe — et à reprendre le lendemain.
          </p>
          <div className="mt-4" style={{ height: 1, background: 'rgba(40,40,45,0.12)' }} />
          <div className="mt-3 flex justify-between items-end">
            <div>
              <span className="font-semibold" style={{ fontSize: 9, letterSpacing: '0.16em', color: 'rgba(40,40,45,0.55)', textTransform: 'uppercase' }}>
                Signé
              </span>
              <p
                className="display-italic mt-1"
                style={{ fontSize: 22, color: 'rgba(40,40,45,0.9)' }}
              >
                {profile?.name?.split(' ')[0] || '—'}
              </p>
            </div>
            <span
              style={{ fontSize: 10, letterSpacing: '0.14em', color: 'rgba(40,40,45,0.5)', textTransform: 'uppercase' }}
            >
              {todayLabel}
            </span>
          </div>
        </div>
      </section>

      {/* ── Mes informations ──────────────────────────────────────────────── */}
      <section className="px-6 mt-7">
        <span className="eyebrow">Mes informations</span>
      </section>

      <section className="px-5 mt-3 space-y-5">
        <div className="card p-5 space-y-5">
          {/* Date d'arrêt */}
          <div>
            <label className="eyebrow block mb-2">Date d'arrêt du tabac</label>
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

          {/* Type tabac */}
          <div>
            <label className="eyebrow block mb-2">Type de tabac</label>
            <select className="input" value={tobaccoType} onChange={e => setTobaccoType(e.target.value)}>
              <option value="">Sélectionner…</option>
              {TOBACCO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Cigs + prix */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-2">Cig. par jour</label>
              <div className="flex items-center border border-line bg-bg-elev rounded-md overflow-hidden">
                <button type="button" onClick={() => setCigsPerDay(v => Math.max(0, v - 1))}
                  className="w-10 h-11 flex items-center justify-center text-ink-3 hover:text-ink hover:bg-bg-card transition-colors text-xl font-light">−</button>
                <span className="flex-1 text-center text-ink font-display" style={{ fontSize: 20, fontWeight: 500 }}>{cigsPerDay}</span>
                <button type="button" onClick={() => setCigsPerDay(v => v + 1)}
                  className="w-10 h-11 flex items-center justify-center text-ink-3 hover:text-ink hover:bg-bg-card transition-colors text-xl font-light">+</button>
              </div>
            </div>
            <div>
              <label className="eyebrow block mb-2">Prix paquet (€)</label>
              <input type="number" step="0.1" className="input"
                value={packPrice} onChange={e => setPackPrice(parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          {/* Boutique — full only */}
          {IS_FULL && (
            <div>
              <label className="eyebrow block mb-2">Boutique Pro'Vap</label>
              <select className="input" value={preferredShop} onChange={e => setPreferredShop(e.target.value)}>
                <option value="">Choisir une boutique</option>
                {SHOPS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {/* Âge */}
          <div>
            <label className="eyebrow block mb-2">Tranche d'âge</label>
            <select className="input" value={ageRange} onChange={e => setAgeRange(e.target.value)}>
              <option value="">Sélectionner…</option>
              {AGE_RANGES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <button onClick={handleSave} className="btn-primary" disabled={loading}>
          {loading ? 'Enregistrement…' : 'Enregistrer mon profil'}
        </button>
      </section>

      {/* ── Objectif plaisir ──────────────────────────────────────────────── */}
      <section className="px-6 mt-7">
        <span className="eyebrow text-pv-ochre">Objectif plaisir</span>
      </section>
      <section className="px-5 mt-3">
        <div className="card p-5 space-y-4">
          <div>
            <label className="eyebrow block mb-2">Quel cadeau vous offrirez-vous ?</label>
            <input type="text" placeholder="Voyage, console, soin…"
              className="input"
              value={rewardName} onChange={e => setRewardName(e.target.value)} />
          </div>
          <div>
            <label className="eyebrow block mb-2">Montant cible (€)</label>
            <input type="number" className="input" placeholder="500"
              value={rewardAmount} onChange={e => setRewardAmount(e.target.value)} />
          </div>
        </div>
      </section>

      {/* ── Conseiller Pro'Vap — full only ────────────────────────────────── */}
      {IS_FULL && preferredShop && (
        <>
          <section className="px-6 mt-7">
            <span className="eyebrow text-pv-terracotta">Mon conseiller Pro'Vap</span>
          </section>
          <section className="px-5 mt-3">
            <div className="card p-5">
              <p className="font-display text-ink" style={{ fontSize: 20, fontWeight: 500 }}>
                Boutique de {preferredShop}
              </p>
              <div className="mt-3 space-y-2">
                {shopData?.address && (
                  <p className="text-sm text-ink-3 flex items-start gap-2">
                    <MapPin size={13} className="text-pv-terracotta shrink-0 mt-0.5" strokeWidth={1.5} />
                    {shopData.address}
                  </p>
                )}
                {shopData?.phone && (
                  <p className="text-sm text-ink-3 flex items-center gap-2">
                    <Phone size={13} className="text-pv-terracotta shrink-0" strokeWidth={1.5} />
                    {shopData.phone}
                  </p>
                )}
                {shopData?.hours && (
                  <p className="text-sm text-ink-3 flex items-center gap-2">
                    <Clock size={13} className="text-pv-terracotta shrink-0" strokeWidth={1.5} />
                    {shopData.hours}
                  </p>
                )}
              </div>
              <div className="mt-4 flex gap-2.5">
                {shopData?.phone && (
                  <a href={`tel:${shopData.phone}`}
                    className="flex-1 btn-ghost flex items-center justify-center gap-2"
                    style={{ padding: '12px 16px' }}>
                    <Phone size={14} strokeWidth={1.5} /> Appeler
                  </a>
                )}
                <button onClick={() => setAppointmentModalOpen(true)}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                  style={{ padding: '12px 16px' }}>
                  <Calendar size={14} strokeWidth={1.5} /> Rendez-vous
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── Réglages ──────────────────────────────────────────────────────── */}
      <section className="px-6 mt-7">
        <span className="eyebrow">Réglages</span>
      </section>
      <section className="px-5 mt-3">
        <div className="card overflow-hidden">
          <SettingsRow
            label="Journal d'humeur"
            icon={<BookHeart size={16} strokeWidth={1.3} />}
            onClick={() => navigate('/journal')}
          />
          <SettingsRow
            label={`Test de Fagerström${profile?.fagerstrom_score != null ? ` · ${profile.fagerstrom_score}/10` : ''}`}
            icon={<FlaskConical size={16} strokeWidth={1.3} />}
            onClick={() => navigate('/fagerstrom')}
          />
          {IS_FULL && (
            <SettingsRow
              label="Les 8 boutiques"
              icon={<MapPin size={16} strokeWidth={1.3} />}
              onClick={() => navigate('/boutiques')}
            />
          )}
          <SettingsRow
            label={exporting ? 'Export en cours…' : 'Exporter mes données (RGPD)'}
            icon={<Download size={16} strokeWidth={1.3} />}
            onClick={handleExportData}
            disabled={exporting}
          />
        </div>
      </section>

      {/* ── Compte ────────────────────────────────────────────────────────── */}
      <section className="px-5 mt-5 space-y-3">
        <button onClick={signOut}
          className="w-full flex items-center justify-center gap-2 text-pv-terracotta text-sm py-3 font-medium">
          <LogOut size={15} strokeWidth={1.5} /> Me déconnecter
        </button>

        <button onClick={() => setDeleteModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 text-ink-3 text-xs py-2 hover:text-danger transition-colors">
          <Trash2 size={13} strokeWidth={1.3} /> Supprimer mon compte
        </button>

        <button onClick={() => navigate('/mentions-legales')}
          className="w-full text-center text-ink-3 text-xs py-2 hover:text-pv-ochre transition-colors">
          Mentions légales · Politique de confidentialité
        </button>
      </section>

      <p className="text-center display-italic text-ink-3 mt-8 px-5" style={{ fontSize: 13 }}>
        Pro'Vap Sevrage · v1.0 · Picardie
      </p>

      {/* Appointment Modal */}
      <Modal isOpen={appointmentModalOpen} onClose={() => setAppointmentModalOpen(false)} title="Demande de rendez-vous">
        <form onSubmit={handleAppointmentSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-ink-3">
            Boutique : <span className="text-pv-ochre font-semibold">{preferredShop}</span>
          </p>
          <div>
            <label className="eyebrow block mb-2">Votre nom</label>
            <input className="input" value={apptName} onChange={e => setApptName(e.target.value)} required />
          </div>
          <div>
            <label className="eyebrow block mb-2">Votre email</label>
            <input type="email" className="input" value={apptEmail} onChange={e => setApptEmail(e.target.value)} required />
          </div>
          <div>
            <label className="eyebrow block mb-2">Créneau souhaité</label>
            <input className="input" placeholder="Mardi matin, vendredi après-midi…"
              value={apptSlot} onChange={e => setApptSlot(e.target.value)} />
          </div>
          <div>
            <label className="eyebrow block mb-2">Message (optionnel)</label>
            <textarea className="input h-24 text-sm" placeholder="Décrivez brièvement votre situation…"
              value={apptMessage} onChange={e => setApptMessage(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary mt-2">Envoyer la demande</button>
        </form>
      </Modal>

      {/* Delete account modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setDeleteConfirmText('') }}
        title="Supprimer mon compte"
      >
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-md"
            style={{ background: 'rgba(200,74,42,0.10)', border: '1px solid rgba(200,74,42,0.30)' }}>
            <p className="text-sm text-ink font-semibold mb-2">Action irréversible</p>
            <p className="text-xs text-ink-2 leading-relaxed">
              Cette action supprime définitivement votre compte, votre profil, vos check-ins, vos témoignages et toute donnée associée. Aucun retour en arrière possible.
            </p>
          </div>
          <p className="text-xs text-ink-3">
            Avant de supprimer, vous pouvez exporter vos données depuis le profil.
          </p>
          <div>
            <label className="eyebrow block mb-2">
              Pour confirmer, tapez <span className="text-danger font-bold">SUPPRIMER</span>
            </label>
            <input className="input" placeholder="SUPPRIMER"
              value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
              autoCapitalize="characters" />
          </div>
          <button type="button" onClick={handleDeleteAccount}
            disabled={deleting || deleteConfirmText.trim().toUpperCase() !== 'SUPPRIMER'}
            className="btn-danger mt-2 disabled:opacity-50">
            {deleting ? 'Suppression…' : 'Supprimer définitivement'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

function ProfStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p
        className="font-display tabular leading-none"
        style={{
          fontSize: 22,
          fontWeight: 500,
          color: accent ? 'var(--color-pv-ochre)' : 'var(--color-ink)',
        }}
      >
        {value}
      </p>
      <p className="text-[10px] text-ink-3 mt-1.5" style={{ letterSpacing: '0.06em' }}>{label}</p>
    </div>
  )
}

function SettingsRow({
  label, icon, onClick, disabled = false,
}: {
  label: string; icon: React.ReactNode; onClick: () => void; disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 py-3.5 px-5 disabled:opacity-50 transition-colors hover:bg-bg-elev"
      style={{ borderBottom: '1px solid var(--color-line)' }}
    >
      <span className="text-ink-2">{icon}</span>
      <span className="flex-1 text-left text-sm text-ink">{label}</span>
      <ChevronRight size={14} className="text-ink-3" strokeWidth={1.3} />
    </button>
  )
}
