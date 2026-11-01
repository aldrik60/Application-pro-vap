/**
 * En-tête de l'accueil : le bouddha de l'icône suivi de « My Pro'Vap »
 * (choix d'Antony du 1er novembre 2026). L'emblème Pro'Vap, illisible à
 * cette taille, reste sur les écrans de connexion (ProVapLogo).
 * L'image est découpée dans l'icône « my provap v3 », 3x pour les écrans nets.
 */
export function AppBrand() {
  return (
    <div className="flex items-center text-ink" style={{ gap: 9 }}>
      <img
        src="/assets/bouddha-entete.png"
        alt=""
        width={40}
        height={38}
        style={{ display: 'block' }}
      />
      <span className="display" style={{ fontSize: 19, lineHeight: 1 }}>
        <span className="display-italic">My</span> Pro'Vap
      </span>
    </div>
  )
}
