// Mode de distribution de l'application :
//  - 'full' : version complète pour clients existants (Vercel privé)
//  - 'lite' : version publique sans contenu commercial (App Store / Google Play)
// Configuré via la variable d'environnement VITE_APP_MODE.
// Par défaut : 'full' (sécuritaire pour développement local).

export type AppMode = 'full' | 'lite'

const raw = (import.meta.env.VITE_APP_MODE ?? 'full').toString().toLowerCase()

export const APP_MODE: AppMode = raw === 'lite' ? 'lite' : 'full'
export const IS_FULL = APP_MODE === 'full'
export const IS_LITE = APP_MODE === 'lite'
