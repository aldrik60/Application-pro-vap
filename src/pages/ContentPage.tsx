import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ContentArticle, VaperStory } from '../types'
import { Modal } from '../components/Modal'
import { FileText, MessageSquare, PlusCircle, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

// ─── Static content ────────────────────────────────────────────────────────────

const STATIC_ARTICLES = [
  {
    id: 'static-1',
    title: 'Gérer une envie soudaine',
    summary: 'Les envies de fumer sont intenses mais brèves. Voici comment les traverser sans craquer.',
    category: 'sevrage',
    created_at: '',
    body: `Une envie de fumer dure rarement plus de 3 à 5 minutes. Si vous pouvez traverser ce pic, la sensation s'atténue d'elle-même.

1. VAPOTEZ IMMÉDIATEMENT
Votre e-cigarette est votre premier allié. Quelques bouffées suffisent souvent à calmer l'envie grâce à la nicotine, qui agit en quelques secondes.

2. RESPIREZ PROFONDÉMENT
La technique 4-4-4 est redoutable : inspirez lentement sur 4 secondes, retenez votre souffle 4 secondes, expirez sur 4 secondes. Répétez 3 fois.

3. BUVEZ UN GRAND VERRE D'EAU
L'eau refroidit la gorge et occupe les mains. Buvez lentement, une gorgée à la fois.

4. CHANGEZ D'ENVIRONNEMENT
Si vous êtes dans un endroit associé à la cigarette (bureau, terrasse, voiture), bougez. Un simple changement de pièce peut suffire.

5. CHRONOMÉTREZ L'ENVIE
Regardez votre montre et dites-vous : "Dans 5 minutes, ça sera passé." Observez l'envie diminuer. Vous devenez plus fort à chaque fois que vous résistez.`,
  },
  {
    id: 'static-2',
    title: 'Le stress sans tabac',
    summary: 'Le tabac semblait calmer le stress. Comment gérer ses émotions autrement ?',
    category: 'bien-être',
    created_at: '',
    body: `Le tabac crée l'illusion de réduire le stress, mais en réalité, il ne fait que soulager le manque de nicotine qu'il a lui-même créé. Sans cigarette, votre niveau de stress basal sera plus bas.

1. LA RESPIRATION ABDOMINALE
Posez une main sur votre ventre. Inspirez en gonflant le ventre (pas la poitrine) sur 4 secondes, expirez sur 6 secondes. 5 cycles suffisent pour activer le système nerveux parasympathique et réduire le cortisol.

2. L'ACTIVITÉ PHYSIQUE
30 minutes de marche libèrent des endorphines — les mêmes molécules que la nicotine stimule. Même 10 minutes de marche rapide changent votre état d'esprit.

3. LA TECHNIQUE "5-4-3-2-1"
Nommez 5 choses que vous voyez, 4 que vous entendez, 3 que vous touchez, 2 que vous sentez, 1 que vous goûtez. Cet exercice ancre dans le présent et coupe le circuit anxieux.

4. ANTICIPEZ VOS DÉCLENCHEURS
Identifiez vos situations de stress habituelles (réunion difficile, embouteillages, conflit). Prévoyez votre kit à portée et une stratégie pour chacune.`,
  },
  {
    id: 'static-3',
    title: 'Comment fonctionne le sevrage ?',
    summary: 'Comprendre ce qui se passe dans votre corps vous aide à mieux traverser cette période.',
    category: 'science',
    created_at: '',
    body: `Comprendre le sevrage, c'est déjà le maîtriser à moitié. Voici ce qui se passe vraiment dans votre cerveau et votre corps.

1. LA DÉPENDANCE À LA NICOTINE
La nicotine se fixe sur des récepteurs spécifiques du cerveau et déclenche une libération de dopamine — la molécule du plaisir. Votre cerveau finit par s'y attendre. Sans nicotine, il manque de dopamine : c'est le manque.

2. LES SYMPTÔMES DU SEVRAGE
Les premières 72h sont les plus intenses (irritabilité, concentration difficile, envies fortes). Après J+7, les symptômes s'atténuent. Après J+21, votre cerveau commence à se recâbler.

3. LE RÔLE DE LA VAPE
La cigarette électronique délivre de la nicotine sans combustion, ce qui supprime le manque sans les 7 000 substances toxiques de la fumée. Elle permet une transition progressive.

4. LA DÉSENSIBILISATION DES RÉCEPTEURS
En maintenant un taux de nicotine stable via la vape, les récepteurs de votre cerveau commencent à se désensibiliser. En descendant progressivement le taux, vous réduisez la dépendance sans souffrir.

5. LA GUÉRISON EST RÉELLE
À J+30, vos poumons ont déjà commencé à se régénérer. À J+90, la dépendance physique est essentiellement terminée. À J+1 an, votre risque cardiovasculaire a diminué de moitié. Votre corps a une capacité de guérison remarquable.`,
  },
  {
    id: 'static-4',
    title: 'Les bénéfices heure par heure',
    summary: 'Ce qui se passe dans votre corps dès que vous arrêtez de fumer.',
    category: 'santé',
    created_at: '',
    body: `Votre corps commence à se réparer dès la première seconde sans cigarette. Voici le calendrier de votre guérison.

⏱ 20 MINUTES
Votre rythme cardiaque et votre pression artérielle baissent. La circulation sanguine dans vos mains et vos pieds s'améliore.

🕐 8 HEURES
Le taux de monoxyde de carbone (CO) dans votre sang est normalisé. L'oxygène peut à nouveau circuler correctement jusqu'à vos cellules.

📅 24 HEURES
Votre risque de crise cardiaque commence à diminuer. Vous respirez plus facilement sans le CO.

📅 48 HEURES
Les terminaisons nerveuses du goût et de l'odorat, endommagées par la fumée, commencent à se régénérer.

📅 72 HEURES (J+3)
Les bronches se relâchent, rendant la respiration plus facile. La capacité pulmonaire augmente déjà.

📅 2 SEMAINES À 3 MOIS
La circulation sanguine s'améliore sensiblement. La marche et l'exercice deviennent plus faciles. Les poumons fonctionnent mieux de semaine en semaine.

📅 1 À 9 MOIS
Les cils bronchiques (qui évacuent le mucus) se régénèrent. Les infections respiratoires diminuent. L'énergie revient.

📅 1 AN
Votre risque de maladie coronarienne est deux fois moins élevé que celui d'un fumeur.

📅 5 ANS
Votre risque d'AVC est comparable à celui d'un non-fumeur. Le risque de cancer buccal, de la gorge et de l'œsophage est divisé par deux.

📅 10 ANS
Le risque de cancer du poumon est divisé par deux. Le risque d'autres cancers (bouche, gorge, œsophage, reins) continue de diminuer.`,
  },
]

const FAQ_ITEMS = [
  {
    question: 'Combien de temps durent les envies de fumer ?',
    answer: 'Une envie de fumer dure généralement entre 3 et 5 minutes, même si elle peut sembler interminable. Pendant cette période, votre cerveau envoie des signaux urgents, mais ils s\'atténuent d\'eux-mêmes. Chaque envie surmontée affaiblit les suivantes. Avec la vape, vous pouvez également calmer l\'envie en quelques bouffées.',
  },
  {
    question: 'La vape aide-t-elle vraiment à arrêter de fumer ?',
    answer: 'Oui. De nombreuses études, dont celles de l\'ANSM et du NHS britannique, montrent que la cigarette électronique est environ 2 fois plus efficace que les patchs ou gommes à la nicotine pour arrêter de fumer. Elle reproduit le geste et la sensation tout en supprimant les 7 000 substances toxiques de la fumée. L\'accompagnement par un professionnel (comme nos conseillers Pro\'Vap) augmente encore les chances de succès.',
  },
  {
    question: 'Quel taux de nicotine choisir pour commencer ?',
    answer: 'Le taux dépend de votre consommation quotidienne :\n• Moins de 5 cigarettes/jour → 3 mg/ml\n• 5 à 10 cigarettes/jour → 6 mg/ml\n• 10 à 20 cigarettes/jour → 12 mg/ml\n• Plus de 20 cigarettes/jour → 16 mg/ml\n\nIl vaut mieux commencer légèrement plus haut que nécessaire pour éviter le manque, puis descendre progressivement.',
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
    answer: 'La dépendance physique à la nicotine disparaît généralement entre J+21 et J+90. Après 3 mois sans fumer, les envies sont rares et faibles. La dépendance psychologique (les habitudes, rituels) peut persister plus longtemps, mais devient de plus en plus gérable. La vape aide à maintenir le geste tout en éliminant la dépendance chimique progressive.',
  },
  {
    question: 'Je vapote beaucoup plus qu\'avant, est-ce normal ?',
    answer: 'Oui, c\'est tout à fait normal au début. Vous compensez l\'absence de cigarettes et les gestes associés. Avec le temps, la fréquence diminuera naturellement. L\'essentiel est de ne pas retourner à la cigarette. Si vous avez l\'impression de vaper excessivement, il est possible que votre taux de nicotine soit trop faible — consultez votre conseiller Pro\'Vap.',
  },
  {
    question: 'Quand faut-il changer la résistance de sa vape ?',
    answer: 'Changez votre résistance lorsque vous percevez : un goût brûlé ou âcre, une vapeur moins dense, un sifflement anormal, ou si votre e-liquide prend un goût métallique. En moyenne, une résistance dure 1 à 3 semaines selon votre usage. Nos boutiques Pro\'Vap ont toutes les résistances adaptées à votre matériel.',
  },
  {
    question: 'Comment descendre progressivement en nicotine ?',
    answer: 'Attendez de vous sentir stable à votre taux actuel (4 à 8 semaines minimum), puis descendez d\'un palier : 16 → 12 → 9 → 6 → 3 → 0 mg/ml. Ne sautez pas d\'étapes. Si vous ressentez un manque intense, remontez d\'un palier et attendez plus longtemps. Certaines personnes restent à 3 mg à long terme — c\'est parfaitement acceptable pour votre santé.',
  },
  {
    question: 'Puis-je contacter ma boutique Pro\'Vap directement ?',
    answer: 'Bien sûr ! Nos 7 boutiques en Picardie sont là pour vous accompagner. Vous pouvez appeler ou prendre rendez-vous depuis l\'onglet Profil de cette application. Nos conseillers sont formés au sevrage tabagique et peuvent adapter vos recommandations selon votre évolution.',
  },
]

// ─── Component ─────────────────────────────────────────────────────────────────

export function ContentPage() {
  const { user, profile } = useAuth()
  const [dbArticles, setDbArticles] = useState<ContentArticle[]>([])
  const [stories, setStories] = useState<VaperStory[]>([])
  const [shopFilter, setShopFilter] = useState<string>('all')

  const [selectedArticle, setSelectedArticle] = useState<ContentArticle | typeof STATIC_ARTICLES[0] | null>(null)
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false)
  const [newStoryText, setNewStoryText] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const allArticles = dbArticles.length > 0 ? dbArticles : STATIC_ARTICLES

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

  const SHOPS = ['Noyon', 'Compiègne', 'Clermont', 'Nogent-sur-Oise', 'Breteuil', 'Beauvais', 'Ferrières-en-Bray']

  return (
    <div className="page p-4 pb-24 space-y-8">
      <header className="mt-2">
        <h1 className="text-3xl font-display text-[#B8482A] tracking-wider mb-1">RESSOURCES</h1>
        <p className="text-[#686868] text-sm">Tout ce dont vous avez besoin pour réussir</p>
      </header>

      {/* ── Articles Section ─────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FileText size={20} className="text-[#CB8002]" />
          <h2 className="text-lg font-semibold text-[#F1F1F1]">Guides Pratiques</h2>
        </div>

        <div className="flex flex-col gap-3">
          {allArticles.map(article => (
            <div
              key={article.id}
              className="card p-4 active:scale-[0.98] transition-transform cursor-pointer hover:border-[#B8482A]/50"
              onClick={() => setSelectedArticle(article)}
            >
              <span className="text-[10px] text-[#B8482A] font-bold uppercase tracking-wider block mb-1">
                {article.category}
              </span>
              <h3 className="font-semibold text-[#F1F1F1] mb-1">{article.title}</h3>
              <p className="text-sm text-[#686868] line-clamp-2">{article.summary}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ Section ──────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[#CB8002] text-xl font-bold">?</span>
          <h2 className="text-lg font-semibold text-[#F1F1F1]">Questions fréquentes</h2>
        </div>

        <div className="flex flex-col divide-y divide-[#2E2E32] card overflow-hidden">
          {FAQ_ITEMS.map((item, idx) => (
            <div key={idx}>
              <button
                className="w-full flex items-center justify-between p-4 text-left"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <span className="text-sm font-medium text-[#F1F1F1] pr-3 leading-snug">{item.question}</span>
                {openFaq === idx
                  ? <ChevronUp size={16} className="shrink-0 text-[#B8482A]" />
                  : <ChevronDown size={16} className="shrink-0 text-[#686868]" />}
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-[#686868] leading-relaxed whitespace-pre-line">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Stories Section ──────────────────────────────────────────────────── */}
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

        {/* Shop filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 hide-scrollbar">
          <button
            onClick={() => setShopFilter('all')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${shopFilter === 'all' ? 'bg-[#CB8002] text-[#1E1E22]' : 'bg-[#1E1E22] text-[#686868] border border-[#2E2E32]'}`}
          >
            Toutes
          </button>
          {SHOPS.map(s => (
            <button
              key={s}
              onClick={() => setShopFilter(s)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${shopFilter === s ? 'bg-[#CB8002] text-[#1E1E22]' : 'bg-[#1E1E22] text-[#686868] border border-[#2E2E32]'}`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
          {filteredStories.length === 0 ? (
            <p className="text-[#686868] text-sm italic py-4">Soyez le premier à partager votre histoire !</p>
          ) : (
            filteredStories.map(story => (
              <div
                key={story.id}
                className="card p-4 min-w-[280px] max-w-[300px] snap-center flex-shrink-0"
              >
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

      {/* ── Videos Section ───────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[#CB8002] text-lg">▶</span>
          <h2 className="text-lg font-semibold text-[#F1F1F1]">Vidéos & Conseils</h2>
        </div>
        <div className="card p-8 text-center border-dashed">
          <p className="text-4xl mb-3">🎬</p>
          <p className="text-[#686868] text-sm font-medium">Bientôt disponible</p>
          <p className="text-[10px] text-[#686868] mt-1">Des vidéos de conseils et témoignages sont en préparation.</p>
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
          <p className="text-[#CB8002] italic mb-6 leading-relaxed">{selectedArticle?.summary}</p>
          <div className="text-[#F1F1F1] space-y-4 leading-relaxed whitespace-pre-line text-sm">
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
            <div className="p-4 bg-[rgba(192,57,43,0.1)] border border-[#C0392B] rounded-[14px] text-sm text-[#F1F1F1]">
              Vous devez d'abord définir votre boutique Pro'Vap dans l'onglet Profil.
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
                onChange={e => setNewStoryText(e.target.value)}
                required
              />
              <div className="text-right text-xs text-[#686868]">{newStoryText.length}/500</div>
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
