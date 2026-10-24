import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

/**
 * Mentions légales + Politique de confidentialité.
 * Page unique en deux sections — permet une seule URL pour les stores.
 *
 * ⚠️  Les champs entre [CROCHETS] sont à compléter avant la mise en production.
 */
export function LegalPage() {
  const navigate = useNavigate()

  return (
    <div className="page pb-24">
      <header className="px-6 pt-6">
        <button
          onClick={() => {
            // Ouverte dans un nouvel onglet (depuis l'inscription) : pas d'historique
            const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
            if (idx > 0) navigate(-1)
            else navigate('/login', { replace: true })
          }}
          className="flex items-center gap-2 text-ink-3 text-sm hover:text-ink transition-colors mb-6"
          style={{ minHeight: 44 }}
        >
          <ChevronLeft size={18} /> Retour
        </button>

        <span className="eyebrow">Légal</span>
        <h1 className="display text-ink mt-2" style={{ fontSize: 32 }}>
          Mentions <span className="display-italic">légales.</span>
        </h1>
        <p className="text-[12px] text-ink-3 mt-2" style={{ letterSpacing: '0.06em' }}>
          Dernière mise à jour : 24 octobre 2026
        </p>
      </header>

      <div className="px-6 mt-7">

      <div className="space-y-8 text-sm leading-relaxed">

        {/* ── 1. ÉDITEUR ──────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-gold-text mb-3">1. Éditeur de l'application</h2>
          <div className="card p-4 space-y-1.5 text-ink">
            <p><strong>Raison sociale :</strong> Pro'Vap SAS</p>
            <p><strong>Forme juridique :</strong> SAS (Société par Actions Simplifiée) au capital de 3 000 €</p>
            <p><strong>Siège social :</strong> 5 esplanade Marguerite Perey, 60200 Compiègne</p>
            <p><strong>SIREN :</strong> 804 189 322</p>
            <p><strong>SIRET (siège) :</strong> 804 189 322 00063</p>
            <p><strong>RCS :</strong> Compiègne 804 189 322</p>
            <p><strong>TVA intracommunautaire :</strong> FR80 804 189 322</p>
            <p><strong>Directeur de la publication :</strong> Antony Antic</p>
            <p><strong>Contact :</strong> contact@pro-vap.com</p>
          </div>
        </section>

        {/* ── 2. HÉBERGEMENT ───────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-gold-text mb-3">2. Hébergement</h2>
          <div className="card p-4 space-y-1.5 text-ink">
            <p><strong>Application web :</strong> Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</p>
            <p><strong>Base de données :</strong> Supabase Inc., 970 Toa Payoh North, #07-04, Singapore 318992 (instance hébergée en Union européenne, région eu-west-1, Irlande).</p>
          </div>
        </section>

        {/* ── 3. PROPRIÉTÉ INTELLECTUELLE ─────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-gold-text mb-3">3. Propriété intellectuelle</h2>
          <p className="text-ink">
            L'ensemble des contenus de l'application (textes, graphismes, logo, icônes, photographies, vidéos, code source) est la propriété exclusive de Pro'Vap SAS ou est utilisé avec autorisation. Toute reproduction, distribution, modification ou exploitation sans accord écrit préalable est interdite.
          </p>
        </section>

        {/* ── 4. POLITIQUE DE CONFIDENTIALITÉ ─────────────────────────────────── */}
        <section>
          <h2 className="font-display text-3xl text-flame-text mb-3 mt-10 tracking-wider">POLITIQUE DE CONFIDENTIALITÉ</h2>
          <p className="text-ink-3 text-xs mb-4">Conforme au Règlement Général sur la Protection des Données (RGPD).</p>

          <h3 className="text-base font-semibold text-ink mt-4 mb-2">4.1 Responsable du traitement</h3>
          <p className="text-ink">
            Pro'Vap SAS, 5 esplanade Marguerite Perey, 60200 Compiègne, représentée par Antony Antic.
            Délégué à la protection des données (DPO) : <span className="text-gold-text">rgpd@pro-vap.com</span>.
          </p>

          <h3 className="text-base font-semibold text-ink mt-4 mb-2">4.2 Données collectées</h3>
          <ul className="list-disc list-inside text-ink space-y-1">
            <li><strong>Identification :</strong> nom, adresse email.</li>
            <li><strong>Profil de sevrage :</strong> date d'arrêt déclarée, consommation quotidienne de cigarettes, prix du paquet, type de tabac, tranche d'âge.</li>
            <li><strong>Suivi :</strong> points d'étape nicotine, score Fagerström, humeur du jour et notes de journal, objectif personnel, compteur d'envies surmontées.</li>
            <li><strong>Boutique :</strong> boutique de référence, demandes de rendez-vous (nom, e-mail, téléphone, créneau, message).</li>
            <li><strong>Témoignages :</strong> textes que vous publiez volontairement (modération avant publication).</li>
            <li><strong>Notifications :</strong> identifiant technique de votre appareil, si vous activez les notifications.</li>
            <li><strong>Données techniques :</strong> aucune donnée n'est collectée à des fins publicitaires, aucun cookie publicitaire, aucun traceur Facebook. Les polices de caractères sont chargées depuis Google Fonts, qui reçoit à cette occasion votre adresse IP.</li>
          </ul>
          <p className="text-ink mt-2">
            Plusieurs de ces informations (consommation, test de dépendance, humeur) concernent votre santé. Elles ne sont enregistrées qu'avec votre accord explicite, donné par une case dédiée lors de la création du compte.
          </p>

          <h3 className="text-base font-semibold text-ink mt-4 mb-2">4.3 Finalités</h3>
          <ul className="list-disc list-inside text-ink space-y-1">
            <li>Vous fournir le service de suivi personnalisé du sevrage.</li>
            <li>Calculer vos statistiques (économies, jours, jalons santé).</li>
            <li>Vous envoyer des messages d'accompagnement liés à votre parcours.</li>
            <li>Permettre, le cas échéant, un échange avec un conseiller en boutique Pro'Vap.</li>
          </ul>

          <h3 className="text-base font-semibold text-ink mt-4 mb-2">4.4 Base légale</h3>
          <p className="text-ink">
            Le traitement repose sur votre consentement (article 6.1.a du RGPD) et, pour les informations qui concernent votre santé, sur votre consentement explicite (article 9.2.a), donnés lors de la création de votre compte. Vous pouvez les retirer à tout moment par e-mail ou en supprimant votre compte.
          </p>
          <p className="text-ink mt-2">
            <strong>Qui voit quoi :</strong> l'équipe Pro'Vap peut consulter votre profil de sevrage (date d'arrêt, consommation déclarée, score Fagerström, boutique) pour vous accompagner. Votre journal d'humeur et vos points d'étape nicotine ne sont visibles que par vous.
          </p>

          <h3 className="text-base font-semibold text-ink mt-4 mb-2">4.5 Durée de conservation</h3>
          <p className="text-ink">
            Vos données sont conservées tant que votre compte est actif. À la suppression de votre compte, l'ensemble de vos données est effacé sous 30 jours, à l'exception des journaux techniques de sécurité, conservés au maximum 12 mois.
          </p>

          <h3 className="text-base font-semibold text-ink mt-4 mb-2">4.6 Vos droits</h3>
          <p className="text-ink mb-2">Conformément aux articles 15 à 22 du RGPD, vous disposez des droits suivants :</p>
          <ul className="list-disc list-inside text-ink space-y-1">
            <li><strong>Accès et portabilité :</strong> téléchargement de l'ensemble de vos données depuis l'onglet Profil ("Exporter mes données").</li>
            <li><strong>Rectification :</strong> modification de votre profil à tout moment depuis l'app.</li>
            <li><strong>Effacement :</strong> suppression complète et définitive depuis l'onglet Profil ("Supprimer mon compte").</li>
            <li><strong>Opposition / limitation :</strong> à exercer par email à rgpd@pro-vap.com.</li>
            <li><strong>Réclamation :</strong> auprès de la CNIL (<span className="text-gold-text">www.cnil.fr</span>) si vous estimez vos droits non respectés.</li>
          </ul>

          <h3 className="text-base font-semibold text-ink mt-4 mb-2">4.7 Hébergement et transferts</h3>
          <p className="text-ink">
            Vos données personnelles sont stockées sur des serveurs Supabase situés en Irlande (Union européenne). Vercel et Supabase sont des sociétés américaines, et Google Fonts ainsi que les services de notification de votre téléphone (Apple, Google, Mozilla) peuvent traiter des données techniques, comme votre adresse IP, hors de l'Union européenne. Ces transferts sont encadrés par les Clauses Contractuelles Types de la Commission européenne ou le cadre de protection des données UE-États-Unis.
          </p>

          <h3 className="text-base font-semibold text-ink mt-4 mb-2">4.8 Sécurité</h3>
          <p className="text-ink">
            L'accès à vos données est protégé par authentification (Supabase Auth) et les échanges entre votre appareil et nos serveurs sont chiffrés (TLS). Des règles d'accès strictes (Row Level Security) garantissent qu'aucun autre utilisateur ne peut voir vos données.
          </p>

          <h3 className="text-base font-semibold text-ink mt-4 mb-2">4.9 Mineurs</h3>
          <p className="text-ink">
            L'application est réservée aux personnes majeures (18 ans et plus). Aucun compte ne doit être créé par un mineur.
          </p>

          <h3 className="text-base font-semibold text-ink mt-4 mb-2">4.10 Modifications</h3>
          <p className="text-ink">
            Cette politique peut être modifiée. Toute modification substantielle vous sera notifiée dans l'application avant son application.
          </p>
        </section>

        {/* ── 5. DISCLAIMER MÉDICAL ──────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-gold-text mb-3">5. Avertissement</h2>
          <div className="card p-4 bg-pv-terracotta/5 border-pv-terracotta/30 text-ink">
            <p>
              Cette application est un outil d'accompagnement personnel et ne constitue ni un avis médical, ni un traitement, ni un dispositif médical. Les informations affichées sont indicatives. Pour toute question médicale liée à l'arrêt du tabac, consultez un professionnel de santé ou contactez <strong className="text-gold-text">Tabac Info Service au 39 89</strong> (service gratuit, prix d'un appel, du lundi au samedi de 8 h à 20 h).
            </p>
          </div>
        </section>

      </div>
      </div>
    </div>
  )
}
