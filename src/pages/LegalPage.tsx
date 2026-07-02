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
  const today = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="page pb-24">
      <header className="px-6 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-ink-3 text-sm hover:text-ink transition-colors mb-6"
        >
          <ChevronLeft size={18} /> Retour
        </button>

        <span className="eyebrow">Légal</span>
        <h1 className="display text-ink mt-2" style={{ fontSize: 32 }}>
          Mentions <span className="display-italic">légales.</span>
        </h1>
        <p className="text-[12px] text-ink-3 mt-2" style={{ letterSpacing: '0.06em' }}>
          Dernière mise à jour : {today}
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
            <p><strong>Contact :</strong> contact@provap.fr</p>
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
            Contact RGPD : <span className="text-gold-text">contact@provap.fr</span>.
          </p>

          <h3 className="text-base font-semibold text-ink mt-4 mb-2">4.2 Données collectées</h3>
          <ul className="list-disc list-inside text-ink space-y-1">
            <li><strong>Identification :</strong> nom, adresse email.</li>
            <li><strong>Profil de sevrage :</strong> date d'arrêt déclarée, consommation quotidienne de cigarettes, prix du paquet, type de tabac, tranche d'âge.</li>
            <li><strong>Suivi :</strong> check-ins de nicotine, score Fagerström, objectif personnel, compteur de "cravings" surmontés.</li>
            <li><strong>Témoignages :</strong> textes que vous publiez volontairement (modération avant publication).</li>
            <li><strong>Données techniques :</strong> aucune donnée de navigation n'est collectée à des fins publicitaires. Aucun cookie tiers, aucun traceur Google/Facebook.</li>
          </ul>

          <h3 className="text-base font-semibold text-ink mt-4 mb-2">4.3 Finalités</h3>
          <ul className="list-disc list-inside text-ink space-y-1">
            <li>Vous fournir le service de suivi personnalisé du sevrage.</li>
            <li>Calculer vos statistiques (économies, jours, jalons santé).</li>
            <li>Vous envoyer des messages d'accompagnement liés à votre parcours.</li>
            <li>Permettre, le cas échéant, un échange avec un conseiller en boutique Pro'Vap.</li>
          </ul>

          <h3 className="text-base font-semibold text-ink mt-4 mb-2">4.4 Base légale</h3>
          <p className="text-ink">
            Le traitement repose sur votre consentement (article 6.1.a du RGPD), donné lors de la création de votre compte. Vous pouvez le retirer à tout moment via la suppression de votre compte.
          </p>

          <h3 className="text-base font-semibold text-ink mt-4 mb-2">4.5 Durée de conservation</h3>
          <p className="text-ink">
            Vos données sont conservées tant que votre compte est actif. À la suppression de votre compte, l'ensemble de vos données est effacé sous 30 jours, à l'exception des données strictement nécessaires aux obligations légales (facturation, journalisation de sécurité), conservées au maximum 5 ans.
          </p>

          <h3 className="text-base font-semibold text-ink mt-4 mb-2">4.6 Vos droits</h3>
          <p className="text-ink mb-2">Conformément aux articles 15 à 22 du RGPD, vous disposez des droits suivants :</p>
          <ul className="list-disc list-inside text-ink space-y-1">
            <li><strong>Accès et portabilité :</strong> téléchargement de l'ensemble de vos données depuis l'onglet Profil ("Exporter mes données").</li>
            <li><strong>Rectification :</strong> modification de votre profil à tout moment depuis l'app.</li>
            <li><strong>Effacement :</strong> suppression complète et définitive depuis l'onglet Profil ("Supprimer mon compte").</li>
            <li><strong>Opposition / limitation :</strong> à exercer par email à contact@provap.fr.</li>
            <li><strong>Réclamation :</strong> auprès de la CNIL (<span className="text-gold-text">www.cnil.fr</span>) si vous estimez vos droits non respectés.</li>
          </ul>

          <h3 className="text-base font-semibold text-ink mt-4 mb-2">4.7 Hébergement et transferts</h3>
          <p className="text-ink">
            Vos données personnelles sont stockées sur des serveurs Supabase situés en Irlande (Union européenne). Aucun transfert n'est effectué hors UE pour les données personnelles. Les services techniques d'hébergement (Vercel) peuvent traiter des journaux techniques (adresses IP) aux États-Unis, encadrés par les Clauses Contractuelles Types de la Commission européenne.
          </p>

          <h3 className="text-base font-semibold text-ink mt-4 mb-2">4.8 Sécurité</h3>
          <p className="text-ink">
            L'accès à vos données est protégé par authentification (Supabase Auth) et chiffrement TLS de bout en bout. Vos données sensibles (check-ins, profil) sont protégées par des règles d'accès strictes (Row Level Security) qui garantissent qu'aucun autre utilisateur ne peut y accéder.
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
              Cette application est un outil d'accompagnement personnel et ne constitue ni un avis médical, ni un traitement, ni un dispositif médical. Les informations affichées sont indicatives. Pour toute question médicale liée à l'arrêt du tabac, consultez un professionnel de santé ou contactez <strong className="text-gold-text">Tabac Info Service au 3989</strong> (appel non surtaxé du lundi au samedi, 8h-20h).
            </p>
          </div>
        </section>

      </div>
      </div>
    </div>
  )
}
