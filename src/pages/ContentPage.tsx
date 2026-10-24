import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ContentArticle, VaperStory, Video } from '../types'
import { Modal } from '../components/Modal'
import { PlusCircle, ChevronDown, ChevronUp, Play } from 'lucide-react'
import { getYouTubeId, youTubeEmbedUrl } from '../lib/youtube'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { IS_FULL } from '../lib/appMode'

// ─── Static content ────────────────────────────────────────────────────────────

const FAQ_ITEMS: { question: string; answer: string; fullOnly?: boolean }[] = [
  {
    question: 'Combien de temps durent les envies de fumer ?',
    answer: 'Une envie de fumer dure généralement entre 3 et 5 minutes, même si elle peut sembler interminable. Pendant cette période, votre cerveau envoie des signaux urgents, mais ils s\'atténuent d\'eux-mêmes. Chaque envie surmontée affaiblit les suivantes. Avec la vape, vous pouvez également calmer l\'envie en quelques bouffées.',
  },
  {
    question: 'La vape aide-t-elle vraiment à arrêter de fumer ?',
    answer: 'Selon plusieurs études (NHS britannique, recherches publiées dans le New England Journal of Medicine), la cigarette électronique peut être un outil de transition efficace pour les personnes qui souhaitent arrêter le tabac, en particulier lorsqu\'elle est utilisée avec un accompagnement adapté. Elle reproduit le geste et la sensation tout en évitant la combustion. Pour un avis personnalisé, consultez un professionnel de santé ou de l\'arrêt du tabac.',
  },
  {
    question: 'Quel taux de nicotine choisir pour commencer ?',
    answer: 'Le taux dépend de votre consommation quotidienne :\n• Moins de 5 cigarettes/jour → 3 mg/ml\n• 5 à 9 cigarettes/jour → 6 mg/ml\n• 10 à 20 cigarettes/jour → 12 mg/ml\n• Plus de 20 cigarettes/jour → 16 mg/ml\n\nIl vaut mieux commencer légèrement plus haut que nécessaire pour éviter le manque, puis descendre progressivement.',
  },
  {
    question: 'Vais-je grossir en arrêtant de fumer ?',
    answer: 'Une légère prise de poids (2 à 4 kg en moyenne) est possible, car la nicotine accélère le métabolisme et coupe l\'appétit. Mais elle n\'est pas inévitable. Quelques conseils : hydratez-vous bien, pratiquez une activité physique légère, évitez de grignoter en optant pour des fruits ou légumes. Les bénéfices pour votre santé dépassent largement cet inconvénient.',
  },
  {
    question: 'Comment gérer le stress sans cigarette ?',
    answer: 'La cigarette semblait réduire le stress, mais elle ne faisait que soulager le manque qu\'elle avait créé. En réalité, les non-fumeurs ont un niveau de stress basal plus bas. Pour gérer le stress : pratiquez la respiration profonde (4s inspiration, 4s rétention, 4s expiration), marchez 10 minutes, buvez de l\'eau, ou parlez à quelqu\'un. Votre kit de vape peut aussi aider dans les moments difficiles.',
  },
  {
    question: 'Quand l\'envie de fumer disparaît-elle complètement ?',
    answer: 'Les envies de fumer deviennent en général rares entre 3 semaines et 3 mois. Après 3 mois sans fumer, elles sont rares et faibles. Les habitudes (café, pause, soirée) peuvent persister plus longtemps, mais deviennent de plus en plus gérables. Avec la vape, vous gardez le geste et la nicotine, puis vous baissez le taux par paliers, à votre rythme, jusqu\'à pouvoir vous en passer.',
  },
  {
    question: 'Je vapote beaucoup plus qu\'avant, est-ce normal ?',
    answer: 'Oui, c\'est fréquent au début. Vous compensez l\'absence de cigarettes et les gestes associés. Avec le temps, la fréquence diminue souvent naturellement. Si vous avez l\'impression de vapoter beaucoup, il est possible que votre taux de nicotine soit trop faible. Un professionnel de la vape ou de l\'arrêt du tabac peut vous orienter.',
  },
  {
    question: 'Quand faut-il changer la résistance de sa vape ?',
    answer: 'Changez votre résistance lorsque vous percevez : un goût brûlé ou âcre, une vapeur moins dense, un sifflement anormal, ou si votre e-liquide prend un goût métallique. En moyenne, une résistance dure 1 à 3 semaines selon votre usage.',
  },
  {
    question: 'Comment descendre progressivement en nicotine ?',
    answer: 'Attendez de vous sentir stable à votre taux actuel (4 à 8 semaines minimum), puis descendez d\'un palier : 16 → 12 → 9 → 6 → 3 → 0 mg/ml. Ne sautez pas d\'étapes. Si vous ressentez un manque intense, remontez d\'un palier et attendez plus longtemps. Certaines personnes restent à 3 mg longtemps avant d\'aller plus loin : avancez à votre rythme.',
  },
  {
    question: 'Puis-je contacter ma boutique Pro\'Vap directement ?',
    answer: 'Bien sûr ! Nos boutiques sont là pour vous accompagner. Vous pouvez appeler ou prendre rendez-vous depuis l\'onglet Profil de cette application. Nos conseillers sont formés au sevrage tabagique et peuvent adapter vos recommandations selon votre évolution.',
    fullOnly: true,
  },
]

// ─── Vidéo : rien n'est chargé depuis YouTube avant le clic ────────────────────

function VideoCard({ video }: { video: Video }) {
  const [playing, setPlaying] = useState(false)
  const id = getYouTubeId(video.youtube_url)
  if (!id) return null

  return (
    <div className="card overflow-hidden">
      <div className="relative w-full" style={{ aspectRatio: '16 / 9', background: 'var(--color-bg-elev)' }}>
        {playing ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={youTubeEmbedUrl(id)}
            title={video.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2"
            aria-label={`Lire la vidéo : ${video.title}`}
          >
            <span
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-pv-terracotta)', color: 'var(--color-pv-ivory)' }}
            >
              <Play size={22} strokeWidth={1.6} style={{ marginLeft: 3 }} />
            </span>
            <span className="text-[11px] text-ink-3">Lecture via YouTube</span>
          </button>
        )}
      </div>
      <div className="p-4">
        <p className="font-display text-ink" style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.25 }}>
          {video.title}
        </p>
        {video.description && (
          <p className="text-xs text-ink-3 mt-1.5 leading-relaxed">{video.description}</p>
        )}
      </div>
    </div>
  )
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ContentPage() {
  const { user, profile } = useAuth()
  const [dbArticles, setDbArticles] = useState<ContentArticle[]>([])
  const [stories, setStories] = useState<VaperStory[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [shops, setShops] = useState<string[]>([])
  const [shopFilter, setShopFilter] = useState<string>('all')

  const [selectedArticle, setSelectedArticle] = useState<ContentArticle | null>(null)
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false)
  const [newStoryText, setNewStoryText] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Les guides viennent uniquement de la base (plus d'ancienne copie dans le code)
  const allArticles = dbArticles
  const visibleFaqs = IS_FULL ? FAQ_ITEMS : FAQ_ITEMS.filter(f => !f.fullOnly)

  useEffect(() => {
    supabase.from('content_articles')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) setDbArticles(data)
      })

    supabase.from('vaper_stories')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setStories(data)
      })

    supabase.from('videos')
      .select('*')
      .eq('is_published', true)
      .order('order_number', { ascending: true })
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setVideos(data as Video[])
      })

    supabase.from('shops')
      .select('name')
      .order('name', { ascending: true })
      .then(({ data }) => {
        if (data) setShops(data.map(s => s.name as string))
      })
  }, [])

  const handleStorySubmit = async (e: React.SyntheticEvent) => {
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
        is_published: false,
      })
      if (error) throw error
      toast.success('Témoignage envoyé ! Il sera publié après modération.')
      setIsStoryModalOpen(false)
      setNewStoryText('')
    } catch {
      toast.error('Erreur lors de l\'envoi du témoignage.')
    }
  }

  const filteredStories = shopFilter === 'all'
    ? stories
    : stories.filter(s => s.shop === shopFilter)

  return (
    <div className="page pb-32">
      <header className="px-6 pt-6">
        <span className="eyebrow">Ressources</span>
        <h1 className="display text-ink mt-2" style={{ fontSize: 36 }}>
          Guides &amp; <span className="display-italic">conseils.</span>
        </h1>
        <p className="text-sm text-ink-3 mt-2">Pour comprendre, anticiper, tenir.</p>
      </header>

      {/* ── Articles ─────────────────────────────────────────────────────── */}
      <section className="px-5 mt-7">
        <span className="eyebrow">Guides pratiques</span>
        <div className="mt-3 flex flex-col gap-2.5">
          {allArticles.map(article => (
            <button
              key={article.id}
              className="card p-5 text-left transition-transform active:scale-[0.98] hover:border-pv-terracotta/50"
              onClick={() => setSelectedArticle(article)}
            >
              <span className="eyebrow text-flame-text">{article.category}</span>
              <p
                className="font-display text-ink mt-2"
                style={{ fontSize: 19, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.2 }}
              >
                {article.title}
              </p>
              <p className="text-xs text-ink-3 mt-1.5 line-clamp-2 leading-relaxed">{article.summary}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="px-5 mt-7">
        <span className="eyebrow">Questions fréquentes</span>
        <div className="card mt-3 overflow-hidden">
          {visibleFaqs.map((item, idx) => (
            <div
              key={idx}
              style={{ borderBottom: idx < visibleFaqs.length - 1 ? '1px solid var(--color-line)' : 'none' }}
            >
              <button
                className="w-full flex items-center justify-between gap-3 p-4 text-left"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <span className="text-sm text-ink pr-2 leading-snug font-medium">{item.question}</span>
                {openFaq === idx
                  ? <ChevronUp size={15} className="shrink-0 text-gold-text" strokeWidth={1.4} />
                  : <ChevronDown size={15} className="shrink-0 text-ink-3" strokeWidth={1.4} />}
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-ink-2 leading-relaxed whitespace-pre-line">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Stories — full only ──────────────────────────────────────────── */}
      {IS_FULL && (
        <section className="px-5 mt-7">
          <div className="flex justify-between items-center px-1 mb-3">
            <span className="eyebrow">Histoires de vapoteurs</span>
            <button
              onClick={() => setIsStoryModalOpen(true)}
              className="flex items-center gap-1.5 text-gold-text text-[12px] hover:underline"
              style={{ letterSpacing: '0.06em', padding: 12, margin: -12 }}
            >
              <PlusCircle size={13} strokeWidth={1.4} /> Partager
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 hide-scrollbar px-1">
            <button
              onClick={() => setShopFilter('all')}
              className="whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] transition-colors"
              style={{
                background: shopFilter === 'all' ? 'var(--color-pv-terracotta)' : 'transparent',
                color: shopFilter === 'all' ? 'var(--color-pv-ivory)' : 'var(--color-ink-3)',
                border: '1px solid ' + (shopFilter === 'all' ? 'var(--color-pv-terracotta)' : 'var(--color-line)'),
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              Toutes
            </button>
            {shops.map(s => (
              <button
                key={s}
                onClick={() => setShopFilter(s)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full text-[12px] transition-colors"
                style={{
                  background: shopFilter === s ? 'var(--color-pv-terracotta)' : 'transparent',
                  color: shopFilter === s ? 'var(--color-pv-ivory)' : 'var(--color-ink-3)',
                  border: '1px solid ' + (shopFilter === s ? 'var(--color-pv-terracotta)' : 'var(--color-line)'),
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex overflow-x-auto gap-3 pb-4 snap-x hide-scrollbar">
            {filteredStories.length === 0 ? (
              <p className="display-italic text-ink-3 text-sm py-2 px-1">
                Partagez la première histoire.
              </p>
            ) : (
              filteredStories.map(story => (
                <div
                  key={story.id}
                  className="card p-5 min-w-[280px] max-w-[300px] snap-center shrink-0"
                >
                  <p
                    className="display-italic text-ink mb-4 line-clamp-5"
                    style={{ fontSize: 16, lineHeight: 1.45 }}
                  >
                    « {story.story_text} »
                  </p>
                  <div className="flex justify-between items-center pt-2"
                    style={{ borderTop: '1px solid var(--color-line)' }}>
                    <span className="text-gold-text text-xs font-semibold">{story.author_name}</span>
                    <span className="eyebrow text-ink-3">{story.shop}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* ── Vidéos : section affichée seulement si au moins une vidéo est publiée ── */}
      {videos.length > 0 && (
        <section className="px-5 mt-7">
          <span className="eyebrow">Vidéos &amp; conseils</span>
          <div className="mt-3 flex flex-col gap-3">
            {videos.map(v => <VideoCard key={v.id} video={v} />)}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <p className="text-[11px] text-ink-3 text-center leading-relaxed mt-7 px-6">
        Les informations affichées sont indicatives et ne remplacent pas l'avis d'un professionnel de santé.
        Pour un accompagnement confidentiel, contactez{' '}
        <span className="text-gold-text font-semibold">Tabac Info Service au 39 89</span> (service gratuit, prix d'un appel).
      </p>

      {/* Article Modal */}
      <Modal
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        title={selectedArticle?.title}
        fullScreen
      >
        <div className="pt-0">
          {selectedArticle?.summary && (
            <p
              className="display-italic text-gold-text mb-6 leading-relaxed"
              style={{ fontSize: 18 }}
            >
              {selectedArticle.summary}
            </p>
          )}
          <div className="text-ink space-y-4 leading-relaxed whitespace-pre-line text-[15px]">
            {selectedArticle?.body}
          </div>
        </div>
      </Modal>

      {/* Story Modal */}
      <Modal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        title="Partager mon histoire"
      >
        <form onSubmit={handleStorySubmit} className="flex flex-col gap-4">
          {!profile?.preferred_shop ? (
            <div className="p-4 rounded-md text-sm text-ink"
              style={{ background: 'rgba(200,74,42,0.10)', border: '1px solid rgba(200,74,42,0.30)' }}>
              Vous devez d'abord définir votre boutique Pro'Vap dans votre profil.
            </div>
          ) : (
            <>
              <p className="text-sm text-ink-2 leading-relaxed">
                Racontez votre parcours, vos victoires et vos difficultés. Votre témoignage (500 caractères max) inspirera d'autres.
              </p>
              <textarea
                className="input h-32 text-sm"
                placeholder="Racontez votre expérience…"
                maxLength={500}
                value={newStoryText}
                onChange={e => setNewStoryText(e.target.value)}
                required
              />
              <div className="text-right text-xs text-ink-3">{newStoryText.length}/500</div>
              <button type="submit" className="btn-primary mt-2">
                Soumettre mon témoignage
              </button>
            </>
          )}
        </form>
      </Modal>
    </div>
  )
}
