import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, ChevronDown } from 'lucide-react'

interface Message {
  id: string
  from: 'bot' | 'user'
  text: string
}

const OPENING_MESSAGE =
  "Bonjour ! Je suis votre conseiller Pro'Vap. Je suis là pour vous aider dans votre parcours de sevrage tabagique. Comment puis-je vous aider ?"

type Rule = { keywords: string[]; response: string }

const RULES: Rule[] = [
  {
    keywords: ['bonjour', 'salut', 'hello', 'bonsoir', 'bonne journée', 'coucou'],
    response: "Bonjour ! Ravi de vous retrouver. Comment puis-je vous accompagner aujourd'hui dans votre parcours de sevrage ?",
  },
  {
    keywords: ['nicotine', 'taux', 'mg', 'dosage', 'milligramme', 'force', 'concentrat'],
    response: "Le taux de nicotine dépend de votre consommation :\n\n• Moins de 5 cig/jour → 3 mg/ml\n• 5 à 10 cig/jour → 6 mg/ml\n• 10 à 20 cig/jour → 12 mg/ml\n• Plus de 20 cig/jour → 16 mg/ml\n\nIl vaut mieux partir d'un taux suffisant pour éviter les envies, puis descendre progressivement. Nos conseillers en boutique peuvent affiner cette recommandation selon votre situation.",
  },
  {
    keywords: ['kit confort', 'kit sevrage', 'kit cbd', 'kit récréatif', 'kit recreatif', 'quel kit', 'meilleur kit', 'matériel', 'materiel', 'appareil', 'pod', 'mod', 'cigarette électronique', 'e-cigarette', 'vaporette'],
    response: "Nous proposons 4 kits adaptés à chaque profil :\n\n🌿 Kit CBD Confort (39,90€) — Pour accompagner le sevrage du cannabis\n🌱 Kit Sevrage (84,90€) — Pour les fumeurs légers (< 10 cig/jour)\n⭐ Kit Confort (99,90€) — Notre kit phare, pour la majorité des fumeurs\n✨ Kit Récréatif (124,90€) — Pour une expérience vapeur premium\n\nPour connaître votre kit idéal, faites le Diagnostic Kit dans l'onglet Profil. Nos conseillers peuvent également vous guider en boutique.",
  },
  {
    keywords: ['envie', 'craving', 'manque', 'besoin', 'résister', 'resister', 'urgence', 'tenir', 'tenu'],
    response: "Une envie de fumer ne dure en général que 3 à 5 minutes. Pour passer ce cap :\n\n1. Vapotez immédiatement si vous avez votre kit\n2. Respirez profondément : inspirez 4s, retenez 4s, expirez 4s\n3. Buvez un grand verre d'eau froide lentement\n4. Changez d'activité ou d'environnement\n5. Utilisez le bouton SOS de l'application pour un accompagnement guidé\n\nChaque envie surmontée renforce votre cerveau. Vous devenez plus fort à chaque fois !",
  },
  {
    keywords: ['stress', 'anxiété', 'anxiete', 'nerveux', 'nerveuse', 'tendu', 'panique', 'angoisse', 'calmer'],
    response: "Le stress est l'une des principales causes de rechute. Quelques stratégies efficaces :\n\n• La respiration 4-4-4 : inspirez 4s, retenez 4s, expirez 4s\n• La marche rapide pendant 10 minutes libère des endorphines\n• Les e-liquides mentholés ont un effet rafraîchissant apaisant\n• Identifiez vos déclencheurs de stress pour les anticiper\n\nN'hésitez pas à contacter votre boutique Pro'Vap pour un accompagnement personnalisé.",
  },
  {
    keywords: ['grossir', 'poids', 'kilos', 'kilogr', 'manger', 'grignoter', 'appétit', 'faim'],
    response: "La prise de poids à l'arrêt du tabac est réelle mais limitée (en moyenne 2 à 4 kg). La nicotine augmente le métabolisme et coupe l'appétit. Pour limiter cet effet :\n\n• Hydratez-vous bien (2L d'eau par jour)\n• Pratiquez une activité physique, même légère\n• Ayez des en-cas sains à portée (fruits, légumes)\n• Les e-liquides fruités et gourmands peuvent réduire les envies de sucre\n\nCes kilos éventuels sont largement compensés par les bénéfices pour votre santé !",
  },
  {
    keywords: ['rechute', 'recraqué', 'recruté', 'fumé', 'echoué', 'échoué', 'raté', 'rate', 'recommence'],
    response: "Une rechute n'est pas un échec — c'est une information précieuse. La plupart des fumeurs font plusieurs tentatives avant d'arrêter définitivement.\n\nAnalysez ce qui s'est passé : était-ce le stress, une situation sociale, un manque de nicotine ? Puis reprenez votre sevrage en ajustant votre stratégie.\n\nNos conseillers Pro'Vap sont là pour vous aider à comprendre et rebondir. Ne vous découragez pas, chaque jour sans fumer compte !",
  },
  {
    keywords: ['résistance', 'resistance', 'coil', 'changer résist', 'brûlé', 'brule', 'mauvais goût', 'goût brûlé'],
    response: "Il est temps de changer votre résistance quand vous ressentez :\n\n• Un goût brûlé ou âcre\n• Une vapeur moins dense que d'habitude\n• Un sifflement inhabituel\n\nEn général, une résistance dure entre 1 et 3 semaines selon votre utilisation. En boutique Pro'Vap, nos conseillers peuvent vérifier votre matériel et vous fournir les résistances adaptées.",
  },
  {
    keywords: ['e-liquide', 'eliquid', 'liquide', 'arôme', 'arome', 'saveur', 'goût', 'gout', 'fruit', 'tabac', 'menthol'],
    response: "Le choix de l'e-liquide est essentiel pour réussir votre sevrage :\n\n• Commencez par des arômes tabac ou menthol si vous avez du mal à rompre avec la cigarette\n• Les arômes fruités et gourmands aident à vous éloigner du goût du tabac\n• Variez les saveurs pour maintenir l'intérêt\n• Nos boutiques Pro'Vap proposent des tests gratuits\n\nN'hésitez pas à demander conseil à nos équipes en boutique !",
  },
  {
    keywords: ['descendre', 'baisser', 'réduire nicotine', 'diminuer', 'palier', 'sevrer'],
    response: "Pour descendre progressivement en nicotine :\n\n1. Attendez de vous sentir stable et sans manque à votre taux actuel (minimum 4 à 8 semaines)\n2. Descendez d'un palier à la fois : 16 → 12 → 9 → 6 → 3 → 0 mg\n3. Ne descendez pas trop vite — mieux vaut prendre son temps\n4. Certains préfèrent rester sur 3 mg à long terme, c'est tout à fait acceptable\n\nVotre santé s'améliore dès que vous arrêtez les cigarettes, quelle que soit la nicotine résiduelle !",
  },
  {
    keywords: ['boutique', 'magasin', 'adresse', 'horaire', 'ouvert', 'contact', 'téléphone', 'telephone', 'appeler', 'noyon', 'compiègne', 'compiegne', 'clermont', 'nogent', 'breteuil', 'beauvais', 'ferrières', 'ferrieres'],
    response: "Nos 7 boutiques Pro'Vap en Picardie :\n\n📍 Noyon — 03 44 44 44 44\n📍 Compiègne — 03 44 20 56 78\n📍 Clermont — 03 44 50 20 20\n📍 Nogent-sur-Oise — 03 44 55 30 30\n📍 Breteuil — 03 22 29 10 10\n📍 Beauvais — 03 44 06 40 40\n📍 Ferrières-en-Bray — 02 35 90 00 00\n\nVous pouvez aussi prendre rendez-vous depuis l'onglet Profil de l'application.",
  },
  {
    keywords: ['bénéfice', 'benefice', 'santé', 'sante', 'améliore', 'ameliore', 'mieux', 'guéri', 'gueri', 'poumon', 'cœur', 'coeur', 'circulat'],
    response: "Les bénéfices de l'arrêt commencent très rapidement :\n\n⏱ 20 min — Rythme cardiaque normalisé\n🕐 8h — CO éliminé du sang\n📅 J+3 — Goût et odorat qui reviennent\n📅 J+14 — Circulation améliorée\n📅 J+30 — Poumons en récupération\n📅 J+90 — Dépendance physique terminée\n📅 J+1 an — Risque coronarien divisé par 2\n\nConsultez la page Badges pour visualiser tous vos jalons de santé !",
  },
  {
    keywords: ['fagerström', 'fagerstrom', 'test', 'score', 'dépendance', 'dependance'],
    response: "Le test de Fagerström est un questionnaire médical de 6 questions qui évalue votre niveau de dépendance physique à la nicotine (score de 0 à 10).\n\n• 0-2 : Dépendance faible\n• 3-4 : Dépendance modérée\n• 5-6 : Dépendance forte\n• 7-10 : Dépendance très forte\n\nVous pouvez passer ce test depuis votre Profil. Il nous aide à affiner la recommandation de nicotine pour votre kit.",
  },
  {
    keywords: ['prix', 'coût', 'cout', 'cher', 'économies', 'economies', 'argent', 'euro'],
    response: "Voici comment calculer vos économies avec la vape :\n\nÉconomies = (cigarettes/jour ÷ 20) × prix du paquet × jours\n\nLe coût d'un kit Pro'Vap (84 à 124€) est amorti en 10 à 30 jours selon votre consommation. Après amortissement, vous économisez chaque jour ce que vous dépensiez en cigarettes.\n\nSuivez vos économies en temps réel sur la page d'Accueil de l'application !",
  },
  {
    keywords: ['dormir', 'sommeil', 'insomnie', 'nuit', 'réveille', 'reveille', 'fatigué', 'fatigue'],
    response: "Les troubles du sommeil sont fréquents lors du sevrage tabagique, surtout les premières semaines. La nicotine est un stimulant et son absence peut perturber votre cycle.\n\nConseils :\n• Évitez de vaper 1h avant de dormir\n• Optez pour des e-liquides sans nicotine le soir si possible\n• Une tisane relaxante peut aider\n• Ces troubles disparaissent généralement au bout de 2 à 4 semaines\n\nSi les troubles persistent, consultez votre médecin.",
  },
  {
    keywords: ['merci', 'super', 'parfait', 'excellent', 'bravo', 'génial', 'genial', 'bien'],
    response: "Merci ! C'est avec plaisir que je vous accompagne. N'hésitez pas si vous avez d'autres questions. Vous faites le bon choix pour votre santé ! 💪",
  },
  {
    keywords: ['au revoir', 'à bientôt', 'bonne journée', 'bonsoir', 'ciao', 'bye'],
    response: "À bientôt ! Courage dans votre parcours. N'oubliez pas que nos conseillers Pro'Vap sont disponibles en boutique si vous avez besoin d'un accompagnement personnalisé. Bonne continuation ! 🌟",
  },
]

const DEFAULT_RESPONSE =
  "Je ne suis pas sûr de comprendre votre question. Pour un accompagnement personnalisé, n'hésitez pas à contacter votre boutique Pro'Vap ou à prendre rendez-vous depuis votre Profil. Je suis spécialisé dans le sevrage tabagique et les conseils vape — posez-moi une question sur ces sujets !"

function getBotResponse(input: string): string {
  const lower = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const rule of RULES) {
    const match = rule.keywords.some(kw => {
      const kwNorm = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return lower.includes(kwNorm)
    })
    if (match) return rule.response
  }
  return DEFAULT_RESPONSE
}

const QUICK_QUESTIONS = [
  'Quel taux de nicotine choisir ?',
  'Comment gérer une envie ?',
  'Quels kits proposez-vous ?',
  'Où trouver ma boutique ?',
]

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', from: 'bot', text: OPENING_MESSAGE },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, messages])

  const sendMessage = (text: string) => {
    if (!text.trim()) return

    const userMsg: Message = { id: Date.now().toString(), from: 'user', text: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const botResponse = getBotResponse(text)
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        from: 'bot',
        text: botResponse,
      }
      setMessages(prev => [...prev, botMsg])
      setIsTyping(false)
    }, 800 + Math.random() * 400)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-[80px] right-4 z-40 w-14 h-14 bg-[#B8482A] rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(184,72,42,0.5)] transition-transform active:scale-90 ${isOpen ? 'hidden' : 'flex'}`}
        aria-label="Ouvrir le conseiller Pro'Vap"
      >
        <MessageCircle size={24} color="white" />
      </button>

      {/* Chat Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-[#28282D]">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-[#2E2E32] bg-[#1E1E22]">
            <div className="w-10 h-10 rounded-full bg-[#B8482A] flex items-center justify-center font-display text-lg text-white shadow">
              PV
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-[#F1F1F1] text-sm">Conseil Pro'Vap</h2>
              <p className="text-[10px] text-[#2D9B55] font-medium">En ligne</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 bg-[#28282D] rounded-full text-[#686868] hover:text-[#F1F1F1] transition-colors"
            >
              <ChevronDown size={22} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
              >
                {msg.from === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-[#B8482A] flex items-center justify-center font-display text-xs text-white shrink-0 mt-1">
                    PV
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    msg.from === 'user'
                      ? 'bg-[#B8482A] text-white rounded-tr-sm'
                      : 'bg-[#1E1E22] text-[#F1F1F1] border border-[#2E2E32] rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start gap-2">
                <div className="w-7 h-7 rounded-full bg-[#B8482A] flex items-center justify-center font-display text-xs text-white shrink-0 mt-1">
                  PV
                </div>
                <div className="bg-[#1E1E22] border border-[#2E2E32] px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#686868] animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2">
              <p className="text-[10px] text-[#686868] mb-2 uppercase font-semibold tracking-wider">Questions fréquentes</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="text-xs px-3 py-2 rounded-full bg-[#1E1E22] border border-[#2E2E32] text-[#B8482A] hover:border-[#B8482A] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-3 p-4 border-t border-[#2E2E32] bg-[#1E1E22]"
          >
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-[#28282D] border border-[#2E2E32] rounded-full px-4 py-3 text-sm text-[#F1F1F1] outline-none focus:border-[#B8482A] placeholder:text-[#686868]"
              placeholder="Posez votre question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-11 h-11 rounded-full bg-[#B8482A] flex items-center justify-center disabled:opacity-40 transition-opacity active:scale-90"
            >
              <Send size={18} color="white" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
