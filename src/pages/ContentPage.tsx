import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ContentArticle, VaperStory } from '../types'
import { Modal } from '../components/Modal'
import { FileText, MessageSquare, PlusCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

export function ContentPage() {
  const { user, profile } = useAuth()
  const [articles, setArticles] = useState<ContentArticle[]>([])
  const [stories, setStories] = useState<VaperStory[]>([])
  
  const [selectedArticle, setSelectedArticle] = useState<ContentArticle | null>(null)
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false)
  const [newStoryText, setNewStoryText] = useState('')

  useEffect(() => {
    // Fetch articles
    supabase.from('content_articles')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setArticles(data)
      })

    // Fetch published stories
    supabase.from('vaper_stories')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setStories(data)
      })
  }, [])

  const handleStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.preferred_shop || !user) {
      toast.error('Veuillez configurer votre boutique dans votre profil.')
      return
    }

    try {
      const { error } = await supabase.from('vaper_stories').insert({
        user_id: user.id,
        author_name: profile.name,
        shop: profile.preferred_shop,
        story_text: newStoryText,
        is_published: false
      })
      if (error) throw error

      toast.success('Témoignage envoyé ! Il sera publié après modération.')
      setIsStoryModalOpen(false)
      setNewStoryText('')
    } catch (err: any) {
      toast.error('Erreur lors de l\'envoi du témoignage.')
    }
  }

  return (
    <div className="page p-4 pb-24 space-y-8">
      <header className="mt-2">
        <h1 className="text-3xl font-display text-[#B8482A] tracking-wider mb-2">RESSOURCES ET SOUTIEN</h1>
        <p className="text-[#686868] text-sm">Tout ce dont vous avez besoin pour réussir</p>
      </header>

      {/* Articles Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FileText size={20} className="text-[#CB8002]" />
          <h2 className="text-lg font-semibold text-[#F1F1F1]">Guides Pratiques</h2>
        </div>
        
        <div className="flex flex-col gap-3">
          {articles.map(article => (
            <div 
              key={article.id} 
              className="card p-4 active:scale-95 transition-transform cursor-pointer border-[#2E2E32] hover:border-[#B8482A]/50"
              onClick={() => setSelectedArticle(article)}
            >
              <h3 className="font-semibold text-[#F1F1F1] mb-1">{article.title}</h3>
              <p className="text-sm text-[#686868] line-clamp-2">{article.summary}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stories Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} className="text-[#CB8002]" />
            <h2 className="text-lg font-semibold text-[#F1F1F1]">Histoires de Vapoteurs</h2>
          </div>
          <button 
            onClick={() => setIsStoryModalOpen(true)}
            className="flex items-center gap-1 text-[#B8482A] text-sm font-medium p-1"
          >
            <PlusCircle size={16} /> Partager
          </button>
        </div>

        <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
          {stories.length === 0 ? (
            <p className="text-[#686868] text-sm italic py-4">Soyez le premier à partager votre histoire !</p>
          ) : (
            stories.map(story => (
              <div key={story.id} className="card p-4 min-w-[280px] max-w-[300px] snap-center flex-shrink-0 bg-gradient-to-br from-[#1E1E22] to-[#28282D]">
                <p className="text-sm text-[#F1F1F1] italic mb-4 line-clamp-4">"{story.story_text}"</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#CB8002]">{story.author_name}</span>
                  <span className="text-[#686868] bg-[#2E2E32] px-2 py-1 rounded-md">{story.shop}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Article Modal */}
      <Modal 
        isOpen={!!selectedArticle} 
        onClose={() => setSelectedArticle(null)}
        title={selectedArticle?.title}
        fullScreen
      >
        <div className="p-4 pt-0">
          <p className="text-[#CB8002] italic mb-6 leading-relaxed">
            {selectedArticle?.summary}
          </p>
          <div 
            className="text-[#F1F1F1] space-y-4 leading-relaxed whitespace-pre-line"
          >
            {selectedArticle?.body}
          </div>
        </div>
      </Modal>

      {/* Write Story Modal */}
      <Modal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        title="Partager mon histoire"
      >
        <form onSubmit={handleStorySubmit} className="flex flex-col gap-4">
          {!profile?.preferred_shop ? (
            <div className="p-4 bg-[rgba(192,57,43,0.1)] border border-[#C0392B] rounded-xl text-sm text-[#F1F1F1]">
              Vous devez d'abord définir votre boutique Pro'Vap dans votre Profil (onglet Profil).
            </div>
          ) : (
            <>
              <p className="text-sm text-[#686868]">
                Racontez votre parcours, vos victoires et vos difficultés. Votre témoignage (max 500 caractères) inspirera d'autres fumeurs.
              </p>
              <textarea 
                className="input h-32 text-sm" 
                placeholder="Racontez votre expérience..."
                maxLength={500}
                value={newStoryText}
                onChange={(e) => setNewStoryText(e.target.value)}
                required
              />
              <div className="text-right text-xs text-[#686868]">{newStoryText.length}/500</div>
              <button type="submit" className="btn-primary mt-4">Soumettre (Soumis à validation)</button>
            </>
          )}
        </form>
      </Modal>
    </div>
  )
}
