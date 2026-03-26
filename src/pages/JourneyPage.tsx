import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Modal } from '../components/Modal'
import { StatCard } from '../components/StatCard'
import { PlusCircle, Activity, Award } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { NicotineCheckIn } from '../types'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'

export function JourneyPage() {
  const { user } = useAuth()
  const [checkins, setCheckins] = useState<NicotineCheckIn[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form state
  const [mg, setMg] = useState('12')
  const [eliquid, setEliquid] = useState('')
  const [feeling, setFeeling] = useState<'difficile'|'neutre'|'bien'|'excellent'>('bien')
  const [notes, setNotes] = useState('')

  const fetchCheckins = async () => {
    if (!user) return
    const { data } = await supabase
      .from('nicotine_checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
    
    if (data) setCheckins(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchCheckins()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const { error } = await supabase.from('nicotine_checkins').insert({
        user_id: user.id,
        nicotine_mg: parseFloat(mg),
        eliquid_name: eliquid || 'Non spécifié',
        feeling,
        notes
      })
      if (error) throw error

      toast.success('Check-in ajouté avec succès !')
      setIsModalOpen(false)
      setNotes('')
      fetchCheckins()
    } catch (err: any) {
      toast.error('Erreur lors de l\'ajout du check-in')
    }
  }

  // Derived stats
  const currentMg = checkins.length > 0 ? checkins[checkins.length - 1].nicotine_mg : 0
  const initialMg = checkins.length > 0 ? checkins[0].nicotine_mg : 0
  const reduction = initialMg > 0 ? Math.round(((initialMg - currentMg) / initialMg) * 100) : 0
  const victories = checkins.filter(c => c.feeling === 'bien' || c.feeling === 'excellent')

  // Chart data
  const chartData = checkins.map(c => ({
    dateStr: format(parseISO(c.date), 'dd/MM', { locale: fr }),
    mg: c.nicotine_mg
  }))

  return (
    <div className="page p-4 pb-24 space-y-8">
      <header className="flex justify-between items-center mt-2">
        <h1 className="text-3xl font-display text-[#CB8002] tracking-wider mb-2">MON PARCOURS</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="p-2.5 rounded-full bg-[#1E1E22] border border-[#2E2E32] text-[#B8482A] transition-transform active:scale-95"
        >
          <PlusCircle size={20} />
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard 
          label="Taux Actuel" 
          value={currentMg} 
          unit="mg/ml"
          textColorClass="text-[#F1F1F1]"
        />
        <StatCard 
          label="Réduction" 
          value={reduction} 
          unit="%"
          textColorClass="text-[#B8482A]"
        />
        <StatCard 
          label="Check-ins" 
          value={checkins.length} 
          textColorClass="text-[#CB8002]"
        />
      </div>

      {/* Chart */}
      <section className="card p-4 h-[280px] w-full flex flex-col">
        <h2 className="text-sm font-semibold text-[#686868] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Activity size={16} /> Évolution (mg/ml)
        </h2>
        {checkins.length < 2 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-[#686868] italic text-center px-4">
            Ajoutez au moins deux check-ins pour visualiser votre courbe de réduction.
          </div>
        ) : (
          <div className="flex-1 w-full min-w-0">
             <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E2E32" vertical={false} />
                <XAxis 
                  dataKey="dateStr" 
                  stroke="#686868" 
                  fontSize={10} 
                  tickMargin={10}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#686868" 
                  fontSize={10} 
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 'dataMax + 3']}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E1E22', border: '1px solid #2E2E32', borderRadius: '8px', color: '#F1F1F1', fontSize: '12px' }}
                  itemStyle={{ color: '#CB8002' }}
                  labelStyle={{ color: '#686868', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="mg" 
                  name="mg/ml"
                  stroke="#B8482A" 
                  strokeWidth={3}
                  dot={{ fill: '#1E1E22', stroke: '#B8482A', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#CB8002', stroke: '#1E1E22' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Mes Victoires */}
      {victories.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[#F1F1F1] mb-4 flex items-center gap-2">
            <Award size={20} className="text-[#2D9B55]" /> Mes Victoires
          </h2>
          <div className="flex flex-col gap-3">
            {victories.map(v => (
              <div key={v.id} className="card p-3 border-l-[3px] border-l-[#CB8002] rounded-l-none bg-gradient-to-r from-[rgba(203,128,2,0.05)] to-transparent">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold text-[#2D9B55]">{format(parseISO(v.date), 'dd MMMM yyyy', { locale: fr })}</span>
                  <span className="text-xs text-[#686868]">{v.nicotine_mg} mg/ml</span>
                </div>
                {v.notes && <p className="text-sm text-[#F1F1F1] italic">"{v.notes}"</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* History */}
      <section>
        <h2 className="text-lg font-semibold text-[#F1F1F1] mb-4">Historique complet</h2>
        <div className="flex flex-col gap-3">
          {checkins.length === 0 ? (
            <p className="text-sm text-[#686868] italic">Aucun historique pour le moment.</p>
          ) : (
            [...checkins].reverse().map(c => (
              <div key={c.id} className="card p-3 flex justify-between items-center">
                <div>
                  <div className="text-sm font-semibold text-[#F1F1F1]">
                    {format(parseISO(c.date), 'dd/MM/yyyy')}
                  </div>
                  <div className="text-xs text-[#686868] capitalize">
                    Sensation : <span className={
                      c.feeling === 'difficile' ? 'text-[#C0392B]' :
                      c.feeling === 'excellent' || c.feeling === 'bien' ? 'text-[#2D9B55]' : 'text-[#CB8002]'
                    }>{c.feeling}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#B8482A]">{c.nicotine_mg} <span className="text-xs font-normal text-[#686868]">mg</span></div>
                  <div className="text-[10px] text-[#686868] max-w-[100px] truncate">{c.eliquid_name}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Modal Check-in */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau point d'étape">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#686868] mb-1.5 ml-1 uppercase font-semibold">Taux Nico (mg)</label>
              <input type="number" step="0.1" className="input" value={mg} onChange={e => setMg(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs text-[#686868] mb-1.5 ml-1 uppercase font-semibold">E-liquide (Nom)</label>
              <input type="text" className="input" value={eliquid} onChange={e => setEliquid(e.target.value)} placeholder="Ex: FR/M" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#686868] mb-1.5 ml-1 uppercase font-semibold">Comment vous sentez-vous ?</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['difficile', 'neutre', 'bien', 'excellent'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFeeling(f)}
                  className={`py-2 px-1 text-xs font-medium rounded-lg border capitalize transition-colors ${
                    feeling === f 
                      ? 'bg-[#B8482A] text-white border-[#B8482A]' 
                      : 'bg-transparent text-[#686868] border-[#2E2E32]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#686868] mb-1.5 ml-1 uppercase font-semibold">Notes / Pensées (Optionnel)</label>
            <textarea 
              className="input text-sm" 
              placeholder="Une victoire à partager ? Une difficulté ?"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary mt-2">Valider mon étape</button>
        </form>
      </Modal>
    </div>
  )
}
