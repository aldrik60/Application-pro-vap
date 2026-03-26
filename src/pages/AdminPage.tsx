import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Profile, VaperStory, DailyMessage, ContentArticle } from '../types'
import { format, parseISO, subDays, differenceInDays } from 'date-fns'
import toast from 'react-hot-toast'
import { Modal } from '../components/Modal'
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react'

type Tab = 'dashboard' | 'utilisateurs' | 'temoignages' | 'messages' | 'articles' | 'videos'

// ─── Dashboard Tab ──────────────────────────────────────────────────────────────

function DashboardTab() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    newThisWeek: 0,
    avgDaysSmokeFree: 0,
    totalCravingsOvercome: 0,
    pendingStories: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const weekAgo = subDays(new Date(), 7).toISOString()

      const [{ data: users }, { count: newCount }, { count: pendingCount }] = await Promise.all([
        supabase.from('profiles').select('quit_date, craving_count'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('vaper_stories').select('*', { count: 'exact', head: true }).eq('is_published', false),
      ])

      if (users) {
        const withQuit = users.filter(u => u.quit_date)
        const avgDays = withQuit.length > 0
          ? Math.round(withQuit.reduce((acc, u) => acc + Math.max(0, differenceInDays(new Date(), new Date(u.quit_date))), 0) / withQuit.length)
          : 0
        const totalCravings = users.reduce((acc, u) => acc + (u.craving_count || 0), 0)

        setStats({
          totalUsers: users.length,
          newThisWeek: newCount || 0,
          avgDaysSmokeFree: avgDays,
          totalCravingsOvercome: totalCravings,
          pendingStories: pendingCount || 0,
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#CB8002] border-t-transparent rounded-full animate-spin" /></div>

  const items = [
    { label: 'Utilisateurs total', value: stats.totalUsers, color: 'text-[#CB8002]' },
    { label: 'Nouveaux cette semaine', value: stats.newThisWeek, color: 'text-[#2D9B55]' },
    { label: 'Jours sans tabac (moy.)', value: stats.avgDaysSmokeFree, color: 'text-[#B8482A]' },
    { label: 'Envies surmontées (total)', value: stats.totalCravingsOvercome, color: 'text-[#F1F1F1]' },
    { label: 'Témoignages en attente', value: stats.pendingStories, color: stats.pendingStories > 0 ? 'text-[#C0392B]' : 'text-[#686868]' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item, i) => (
        <div key={i} className="card p-4">
          <p className="text-[10px] text-[#686868] uppercase font-bold tracking-wider mb-1">{item.label}</p>
          <p className={`text-3xl font-display ${item.color}`}>{item.value}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Users Tab ──────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<Profile[]>([])
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setUsers(data as Profile[]) })
  }, [])

  const handleSaveNote = async () => {
    if (!selectedUser) return
    try {
      setSavingNote(true)
      await supabase.from('admin_notes').insert({
        user_id: selectedUser.id,
        note: noteText,
        created_by: 'admin',
      })
      toast.success('Note enregistrée.')
      setNoteText('')
    } catch {
      toast.error('Erreur lors de la sauvegarde.')
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {users.map(u => {
          const days = u.quit_date
            ? Math.max(0, differenceInDays(new Date(), new Date(u.quit_date)))
            : null
          return (
            <div
              key={u.id}
              className="card p-4 flex justify-between items-center cursor-pointer hover:border-[#CB8002]/50 active:scale-[0.98] transition-all"
              onClick={() => setSelectedUser(u)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#CB8002]/20 flex items-center justify-center font-display text-lg text-[#CB8002]">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-[#F1F1F1] font-semibold text-sm">{u.name}</h3>
                  <p className="text-[#686868] text-xs">{u.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-xs font-bold text-[#CB8002]">{u.preferred_shop || 'Aucune'}</span>
                {days !== null && <span className="block text-xs text-[#686868]">J+{days}</span>}
              </div>
            </div>
          )
        })}
      </div>

      <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="Dossier Client" fullScreen>
        {selectedUser && (
          <div className="p-4 pt-0 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#CB8002] rounded-full flex items-center justify-center text-[#1E1E22] font-display text-3xl">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#F1F1F1]">{selectedUser.name}</h2>
                <p className="text-sm text-[#CB8002]">{selectedUser.email}</p>
                <p className="text-xs text-[#686868] mt-0.5">
                  Inscrit le {format(parseISO(selectedUser.created_at), 'dd/MM/yyyy')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Date d\'arrêt', value: selectedUser.quit_date ? format(new Date(selectedUser.quit_date), 'dd/MM/yyyy') : 'Non définie' },
                { label: 'Jours sans tabac', value: selectedUser.quit_date ? `J+${Math.max(0, differenceInDays(new Date(), new Date(selectedUser.quit_date)))}` : '-' },
                { label: 'Cig. / jour', value: selectedUser.cigarettes_per_day || '-' },
                { label: 'Score Fagerström', value: selectedUser.fagerstrom_score != null ? `${selectedUser.fagerstrom_score}/10` : 'Non passé' },
                { label: 'Boutique', value: selectedUser.preferred_shop || 'Aucune' },
                { label: 'Envies surmontées', value: selectedUser.craving_count || 0 },
                { label: 'Kit recommandé', value: selectedUser.smoker_profile || '-' },
                { label: 'Nicotine (mg)', value: selectedUser.recommended_nicotine_mg ? `${selectedUser.recommended_nicotine_mg} mg` : '-' },
              ].map((item, i) => (
                <div key={i} className="bg-[#1E1E22] border border-[#2E2E32] rounded-[14px] p-3">
                  <span className="block text-[10px] text-[#686868] uppercase font-bold mb-1">{item.label}</span>
                  <span className="block text-[#F1F1F1] text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>

            {selectedUser.reward_name && (
              <div className="card p-4 border-[#CB8002]/30">
                <h3 className="text-xs font-bold text-[#CB8002] uppercase mb-1">Objectif Plaisir</h3>
                <p className="text-[#F1F1F1] font-medium">{selectedUser.reward_name}</p>
                <p className="text-sm text-[#686868]">{selectedUser.reward_amount ? `${selectedUser.reward_amount}€` : '-'}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-[#F1F1F1] mb-2">
                Notes Conseiller <span className="text-[10px] text-[#C0392B] font-normal">(privé, non visible par le client)</span>
              </h3>
              <textarea
                className="input h-28 text-sm"
                placeholder="Rédigez vos notes de suivi..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
              />
              <button className="btn-primary mt-3 text-sm py-3" onClick={handleSaveNote} disabled={savingNote || !noteText.trim()}>
                {savingNote ? 'Enregistrement...' : 'Sauvegarder la note'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

// ─── Stories Tab ────────────────────────────────────────────────────────────────

function StoriesTab() {
  const [stories, setStories] = useState<VaperStory[]>([])

  useEffect(() => {
    supabase.from('vaper_stories').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setStories(data as VaperStory[]) })
  }, [])

  const toggle = async (id: string, current: boolean) => {
    const { error } = await supabase.from('vaper_stories').update({ is_published: !current }).eq('id', id)
    if (error) { toast.error('Erreur'); return }
    toast.success(current ? 'Masqué' : 'Publié !')
    setStories(prev => prev.map(s => s.id === id ? { ...s, is_published: !current } : s))
  }

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce témoignage ?')) return
    await supabase.from('vaper_stories').delete().eq('id', id)
    setStories(prev => prev.filter(s => s.id !== id))
    toast.success('Témoignage supprimé.')
  }

  return (
    <div className="flex flex-col gap-4">
      {stories.length === 0 && <p className="text-[#686868] text-sm italic">Aucun témoignage.</p>}
      {stories.map(s => (
        <div key={s.id} className="card p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-sm font-semibold text-[#F1F1F1]">{s.author_name} — {s.shop}</span>
              <span className="block text-xs text-[#686868]">{format(parseISO(s.created_at), 'dd/MM/yyyy')}</span>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded border ${s.is_published ? 'bg-[rgba(45,155,85,0.1)] text-[#2D9B55] border-[#2D9B55]/30' : 'bg-[rgba(184,72,42,0.1)] text-[#B8482A] border-[#B8482A]/30'}`}>
              {s.is_published ? 'Publié' : 'En attente'}
            </span>
          </div>
          <p className="text-sm text-[#F1F1F1] italic mb-4 leading-relaxed">"{s.story_text}"</p>
          <div className="flex gap-2">
            <button
              onClick={() => toggle(s.id, s.is_published)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${s.is_published ? 'border border-[#C0392B] text-[#C0392B]' : 'bg-[#2D9B55] text-white'}`}
            >
              {s.is_published ? <><X size={14} /> Masquer</> : <><Check size={14} /> Approuver</>}
            </button>
            <button
              onClick={() => remove(s.id)}
              className="px-3 py-2 rounded-lg border border-[#2E2E32] text-[#686868] hover:border-[#C0392B] hover:text-[#C0392B] transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Messages Tab ───────────────────────────────────────────────────────────────

function MessagesTab() {
  const [messages, setMessages] = useState<DailyMessage[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [newDay, setNewDay] = useState('')
  const [newText, setNewText] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('daily_messages').select('*').order('day_number')
      .then(({ data }) => { if (data) setMessages(data as DailyMessage[]); setLoading(false) })
  }, [])

  const startEdit = (m: DailyMessage) => { setEditingId(m.id); setEditText(m.message) }

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from('daily_messages').update({ message: editText }).eq('id', id)
    if (error) { toast.error('Erreur'); return }
    setMessages(prev => prev.map(m => m.id === id ? { ...m, message: editText } : m))
    setEditingId(null)
    toast.success('Message mis à jour.')
  }

  const addMessage = async () => {
    if (!newDay || !newText) return
    const { data, error } = await supabase.from('daily_messages').insert({ day_number: parseInt(newDay), message: newText }).select().single()
    if (error) { toast.error('Erreur : ' + error.message); return }
    if (data) setMessages(prev => [...prev, data as DailyMessage].sort((a, b) => a.day_number - b.day_number))
    setNewDay(''); setNewText('')
    toast.success('Message ajouté.')
  }

  const remove = async (id: string) => {
    await supabase.from('daily_messages').delete().eq('id', id)
    setMessages(prev => prev.filter(m => m.id !== id))
    toast.success('Supprimé.')
  }

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[#CB8002] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-4">
      {/* Add new */}
      <div className="card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[#CB8002]">Ajouter un message</h3>
        <div className="grid grid-cols-3 gap-2">
          <input type="number" className="input text-sm" placeholder="Jour" min="1" max="90" value={newDay} onChange={e => setNewDay(e.target.value)} />
          <textarea className="input text-sm col-span-2 h-16" placeholder="Message (utilisez 'vous')" value={newText} onChange={e => setNewText(e.target.value)} />
        </div>
        <button onClick={addMessage} disabled={!newDay || !newText} className="btn-primary text-sm py-2.5">
          <Plus size={14} className="inline mr-1" /> Ajouter
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {messages.map(m => (
          <div key={m.id} className="card p-3">
            {editingId === m.id ? (
              <div className="space-y-2">
                <span className="text-xs text-[#CB8002] font-bold">J+{m.day_number}</span>
                <textarea className="input text-sm h-20" value={editText} onChange={e => setEditText(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(m.id)} className="flex-1 bg-[#2D9B55] text-white text-sm py-2 rounded-lg font-medium"><Check size={14} className="inline mr-1" />Valider</button>
                  <button onClick={() => setEditingId(null)} className="flex-1 border border-[#2E2E32] text-[#686868] text-sm py-2 rounded-lg"><X size={14} className="inline mr-1" />Annuler</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold text-[#CB8002] w-8 shrink-0 pt-0.5">J+{m.day_number}</span>
                <p className="text-sm text-[#686868] flex-1 leading-snug">{m.message}</p>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(m)} className="p-1.5 text-[#686868] hover:text-[#CB8002]"><Pencil size={13} /></button>
                  <button onClick={() => remove(m.id)} className="p-1.5 text-[#686868] hover:text-[#C0392B]"><Trash2 size={13} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Articles Tab ───────────────────────────────────────────────────────────────

function ArticlesTab() {
  const [articles, setArticles] = useState<ContentArticle[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<ContentArticle | null>(null)
  const [form, setForm] = useState({ title: '', summary: '', body: '', category: '' })

  useEffect(() => {
    supabase.from('content_articles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setArticles(data) })
  }, [])

  const openNew = () => { setEditing(null); setForm({ title: '', summary: '', body: '', category: '' }); setIsModalOpen(true) }
  const openEdit = (a: ContentArticle) => { setEditing(a); setForm({ title: a.title, summary: a.summary, body: a.body, category: a.category }); setIsModalOpen(true) }

  const save = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (editing) {
      const { error } = await supabase.from('content_articles').update(form).eq('id', editing.id)
      if (error) { toast.error('Erreur'); return }
      setArticles(prev => prev.map(a => a.id === editing.id ? { ...a, ...form } : a))
      toast.success('Article mis à jour.')
    } else {
      const { data, error } = await supabase.from('content_articles').insert(form).select().single()
      if (error) { toast.error('Erreur'); return }
      if (data) setArticles(prev => [data, ...prev])
      toast.success('Article ajouté.')
    }
    setIsModalOpen(false)
  }

  const remove = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return
    await supabase.from('content_articles').delete().eq('id', id)
    setArticles(prev => prev.filter(a => a.id !== id))
    toast.success('Article supprimé.')
  }

  return (
    <>
      <button onClick={openNew} className="btn-gold text-sm py-3 flex items-center justify-center gap-2 mb-4">
        <Plus size={16} /> Nouvel article
      </button>
      <div className="flex flex-col gap-3">
        {articles.map(a => (
          <div key={a.id} className="card p-4">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <span className="text-[10px] text-[#B8482A] font-bold uppercase">{a.category}</span>
                <h3 className="text-sm font-semibold text-[#F1F1F1] mt-0.5">{a.title}</h3>
                <p className="text-xs text-[#686868] mt-1 line-clamp-2">{a.summary}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(a)} className="p-2 text-[#686868] hover:text-[#CB8002]"><Pencil size={15} /></button>
                <button onClick={() => remove(a.id)} className="p-2 text-[#686868] hover:text-[#C0392B]"><Trash2 size={15} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Modifier l\'article' : 'Nouvel article'} fullScreen>
        <form onSubmit={save} className="p-4 pt-0 flex flex-col gap-4">
          <div>
            <label className="block text-xs text-[#686868] mb-1 uppercase font-semibold">Titre</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs text-[#686868] mb-1 uppercase font-semibold">Catégorie</label>
            <input className="input" placeholder="Ex : sevrage, santé, bien-être" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-[#686868] mb-1 uppercase font-semibold">Résumé</label>
            <textarea className="input h-20 text-sm" value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs text-[#686868] mb-1 uppercase font-semibold">Contenu complet</label>
            <textarea className="input text-sm" style={{ minHeight: '200px' }} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} required />
          </div>
          <button type="submit" className="btn-primary mt-2">Enregistrer</button>
        </form>
      </Modal>
    </>
  )
}

// ─── Videos Tab ─────────────────────────────────────────────────────────────────

function VideosTab() {
  const [videos, setVideos] = useState<{ id: string; title: string; url: string }[]>([])
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  useEffect(() => {
    supabase.from('videos').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setVideos(data) })
  }, [])

  const add = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.from('videos').insert({ title, url }).select().single()
    if (error) { toast.error('Erreur : ' + error.message); return }
    if (data) setVideos(prev => [data, ...prev])
    setTitle(''); setUrl('')
    toast.success('Vidéo ajoutée.')
  }

  const remove = async (id: string) => {
    await supabase.from('videos').delete().eq('id', id)
    setVideos(prev => prev.filter(v => v.id !== id))
    toast.success('Vidéo supprimée.')
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[#CB8002]">Ajouter une vidéo YouTube</h3>
        <input className="input text-sm" placeholder="Titre de la vidéo" value={title} onChange={e => setTitle(e.target.value)} />
        <input className="input text-sm" placeholder="URL YouTube (https://...)" value={url} onChange={e => setUrl(e.target.value)} />
        <button onClick={add} disabled={!title || !url} className="btn-primary text-sm py-2.5">
          <Plus size={14} className="inline mr-1" /> Ajouter
        </button>
      </div>

      {videos.length === 0 && (
        <p className="text-[#686868] text-sm italic text-center py-4">Aucune vidéo pour l'instant.</p>
      )}
      {videos.map(v => (
        <div key={v.id} className="card p-4 flex justify-between items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#F1F1F1] truncate">{v.title}</p>
            <p className="text-xs text-[#686868] truncate">{v.url}</p>
          </div>
          <button onClick={() => remove(v.id)} className="p-2 text-[#686868] hover:text-[#C0392B] shrink-0">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Main AdminPage ─────────────────────────────────────────────────────────────

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  const TABS: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Tableau de bord' },
    { id: 'utilisateurs', label: 'Clients' },
    { id: 'temoignages', label: 'Témoignages' },
    { id: 'messages', label: 'Messages' },
    { id: 'articles', label: 'Articles' },
    { id: 'videos', label: 'Vidéos' },
  ]

  return (
    <div className="page p-4 pb-24">
      <header className="mb-5 mt-2">
        <h1 className="text-3xl font-display text-[#CB8002] tracking-wider mb-1">PANNEAU ADMIN</h1>
        <p className="text-[#686868] text-sm">Gestion du réseau Pro'Vap</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`snap-start whitespace-nowrap px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${activeTab === t.id ? 'bg-[#CB8002] text-[#1E1E22]' : 'bg-[#1E1E22] text-[#686868] border border-[#2E2E32]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && <DashboardTab />}
      {activeTab === 'utilisateurs' && <UsersTab />}
      {activeTab === 'temoignages' && <StoriesTab />}
      {activeTab === 'messages' && <MessagesTab />}
      {activeTab === 'articles' && <ArticlesTab />}
      {activeTab === 'videos' && <VideosTab />}
    </div>
  )
}
