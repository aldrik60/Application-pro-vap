import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Profile, VaperStory } from '../types'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { Modal } from '../components/Modal'
import { Check, X } from 'lucide-react'

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<'utilisateurs' | 'temoignages' | 'messages' | 'fiches'>('utilisateurs')
  
  // Data
  const [users, setUsers] = useState<Profile[]>([])
  const [stories, setStories] = useState<VaperStory[]>([])
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  
  useEffect(() => {
    if (activeTab === 'utilisateurs') fetchUsers()
    if (activeTab === 'temoignages') fetchStories()
  }, [activeTab])

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (data) setUsers(data as Profile[])
  }

  const fetchStories = async () => {
    const { data } = await supabase.from('vaper_stories').select('*').order('created_at', { ascending: false })
    if (data) setStories(data as VaperStory[])
  }

  const handleToggleStory = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('vaper_stories').update({ is_published: !currentStatus }).eq('id', id)
    if (error) {
      toast.error('Erreur')
    } else {
      toast.success(currentStatus ? 'Témoignage masqué' : 'Témoignage publié')
      fetchStories()
    }
  }

  return (
    <div className="page p-4 pb-24">
      <header className="mb-6 mt-2">
        <h1 className="text-3xl font-display text-[#CB8002] tracking-wider mb-2">PANNEAU ADMIN</h1>
        <p className="text-[#686868] text-sm">Gestion du réseau Pro'Vap</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 snap-x hide-scrollbar">
        <button 
          onClick={() => setActiveTab('utilisateurs')}
          className={`snap-start whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'utilisateurs' ? 'bg-[#CB8002] text-[#1E1E22]' : 'bg-[#1E1E22] text-[#686868] border border-[#2E2E32]'}`}
        >
          Clients
        </button>
        <button 
          onClick={() => setActiveTab('temoignages')}
          className={`snap-start whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'temoignages' ? 'bg-[#CB8002] text-[#1E1E22]' : 'bg-[#1E1E22] text-[#686868] border border-[#2E2E32]'}`}
        >
          Témoignages
        </button>
        <button 
          onClick={() => setActiveTab('messages')}
          className={`snap-start whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'messages' ? 'bg-[#CB8002] text-[#1E1E22]' : 'bg-[#1E1E22] text-[#686868] border border-[#2E2E32]'}`}
        >
          Messages
        </button>
        <button 
          onClick={() => setActiveTab('fiches')}
          className={`snap-start whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'fiches' ? 'bg-[#CB8002] text-[#1E1E22]' : 'bg-[#1E1E22] text-[#686868] border border-[#2E2E32]'}`}
        >
          Articles
        </button>
      </div>

      <div className="space-y-4">
        {/* Tab: Utilisateurs */}
        {activeTab === 'utilisateurs' && (
          <div className="flex flex-col gap-3">
            {users.map(u => (
              <div 
                key={u.id} 
                className="card p-4 flex justify-between items-center cursor-pointer hover:border-[#CB8002]/50 active:scale-95 transition-all"
                onClick={() => setSelectedUser(u)}
              >
                <div>
                  <h3 className="text-[#F1F1F1] font-semibold">{u.name}</h3>
                  <p className="text-[#686868] text-xs mt-1">{u.email}</p>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-bold text-[#CB8002]">{u.preferred_shop || 'Aucune'}</span>
                  <span className="block text-xs text-[#686868]">Score: {u.fagerstrom_score !== null ? u.fagerstrom_score : '-'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Témoignages */}
        {activeTab === 'temoignages' && (
          <div className="flex flex-col gap-4">
            {stories.map(s => (
              <div key={s.id} className="card p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-sm font-semibold text-[#F1F1F1] block">{s.author_name} ({s.shop})</span>
                    <span className="text-xs text-[#686868] block">{format(parseISO(s.created_at), 'dd/MM/yyyy')}</span>
                  </div>
                  <div className="flex gap-2">
                    {s.is_published ? (
                      <span className="text-[10px] bg-[rgba(45,155,85,0.1)] text-[#2D9B55] px-2 py-1 rounded border border-[#2D9B55]/30">Publié</span>
                    ) : (
                      <span className="text-[10px] bg-[rgba(184,72,42,0.1)] text-[#B8482A] px-2 py-1 rounded border border-[#B8482A]/30">En attente</span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-[#F1F1F1] italic leading-relaxed mb-4">"{s.story_text}"</p>
                <button 
                  onClick={() => handleToggleStory(s.id, s.is_published)}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${s.is_published ? 'bg-[#1E1E22] text-[#C0392B] border border-[#C0392B]' : 'bg-[#2D9B55] text-white'}`}
                >
                  {s.is_published ? 'Masquer' : 'Approuver & Publier'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Placeholder logic for others for brevity */}
        {(activeTab === 'messages' || activeTab === 'fiches') && (
          <div className="card p-6 text-center text-[#686868] italic border-dashed">
            Interface de gestion CRUD à implémenter. Voir la base de données Supabase.
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="Dossier Client">
        {selectedUser && (
          <div className="p-4 pt-0 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#CB8002] rounded-full flex items-center justify-center text-[#1E1E22] font-display text-3xl">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#F1F1F1]">{selectedUser.name}</h2>
                <p className="text-sm text-[#CB8002]">{selectedUser.email}</p>
                <p className="text-xs text-[#686868] mt-1">Enregistré le {format(parseISO(selectedUser.created_at), 'dd/MM/yyyy')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1E1E22] border border-[#2E2E32] rounded-xl p-3">
                <span className="block text-[10px] text-[#686868] uppercase font-bold mb-1">Date d'arrêt</span>
                <span className="block text-[#F1F1F1] text-sm">{selectedUser.quit_date ? format(new Date(selectedUser.quit_date), 'dd/MM/yyyy') : 'Non définie'}</span>
              </div>
              <div className="bg-[#1E1E22] border border-[#2E2E32] rounded-xl p-3">
                <span className="block text-[10px] text-[#686868] uppercase font-bold mb-1">Cig. / jour</span>
                <span className="block text-[#F1F1F1] text-sm">{selectedUser.cigarettes_per_day}</span>
              </div>
              <div className="bg-[#1E1E22] border border-[#2E2E32] rounded-xl p-3">
                <span className="block text-[10px] text-[#686868] uppercase font-bold mb-1">Score Fagerström</span>
                <span className="block text-[#F1F1F1] text-sm font-bold">{selectedUser.fagerstrom_score !== null ? `${selectedUser.fagerstrom_score}/10` : 'Non passé'}</span>
              </div>
              <div className="bg-[#1E1E22] border border-[#2E2E32] rounded-xl p-3">
                <span className="block text-[10px] text-[#686868] uppercase font-bold mb-1">Boutique Réf.</span>
                <span className="block text-[#F1F1F1] text-sm text-[#CB8002] font-semibold">{selectedUser.preferred_shop || 'Aucune'}</span>
              </div>
            </div>

            <div className="card p-4 border-[#CB8002]/30 bg-[rgba(203,128,2,0.05)]">
               <h3 className="text-sm font-semibold text-[#CB8002] mb-2 uppercase">Objectif Plaisir</h3>
               <p className="text-[#F1F1F1] font-medium">{selectedUser.reward_name || 'Non défini'}</p>
               <p className="text-sm text-[#686868] mt-1">{selectedUser.reward_amount ? `${selectedUser.reward_amount} €` : '-'}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#F1F1F1] mb-2">Notes Conseiller (Privé)</h3>
              <textarea 
                className="input h-32 text-sm" 
                placeholder="Rédigez vos notes de suivi ici... (Bientôt sauvegardé en DB)"
              ></textarea>
              <button className="btn-primary mt-3 text-sm py-3">Sauvegarder Note</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
