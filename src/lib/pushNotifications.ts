import { supabase } from './supabase'

/**
 * Helpers pour les Push Notifications (Web Push).
 *
 * Architecture provider-agnostique :
 * - On stocke la subscription utilisateur en DB (table push_subscriptions).
 * - L'envoi peut se faire via la lib `web-push` (Supabase Edge Function),
 *   OneSignal, ou tout autre provider compatible RFC 8030.
 *
 * Pour activer en prod, il faut renseigner VITE_VAPID_PUBLIC_KEY dans .env
 * (clé publique VAPID — la clé privée reste côté serveur uniquement).
 */

// Clé publique VAPID — par nature publique (envoyée au navigateur pour signer
// les requêtes). Hardcodée pour éviter une étape de config Vercel manuelle.
// Pour la changer, on regénère une paire avec `npx web-push generate-vapid-keys`
// puis on met à jour ce fichier + le Vault Supabase (vault.secrets).
const VAPID_PUBLIC_KEY_FALLBACK = 'BIK52orGJBZ60gYd5QSXe07vQ4EYY3hNQVZ1IJ0r9O9dCMxAT8U4TvH2cMb3-qznHcnS1RSxAdHpFxa_urHQrLk'

const VAPID_PUBLIC_KEY = ((import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)?.trim()) || VAPID_PUBLIC_KEY_FALLBACK

export type PushSupportStatus =
  | 'unsupported'           // Pas de support navigateur
  | 'ios-needs-install'     // iOS Safari : doit installer la PWA d'abord
  | 'permission-default'    // L'utilisateur n'a rien encore choisi
  | 'permission-denied'     // L'utilisateur a refusé (peut être réactivé dans les réglages)
  | 'permission-granted'    // OK

export function getPushSupport(): PushSupportStatus {
  if (typeof window === 'undefined') return 'unsupported'

  const hasNotifications = 'Notification' in window
  const hasServiceWorker = 'serviceWorker' in navigator
  const hasPushManager = 'PushManager' in window

  if (!hasNotifications || !hasServiceWorker || !hasPushManager) return 'unsupported'

  // Détection iOS Safari hors PWA : push impossible tant que l'app n'est pas
  // ajoutée à l'écran d'accueil (limitation Apple).
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream
  // @ts-expect-error - standalone propriété non standard iOS
  const isStandalone = navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches
  if (isIOS && !isStandalone) return 'ios-needs-install'

  switch (Notification.permission) {
    case 'granted': return 'permission-granted'
    case 'denied':  return 'permission-denied'
    default:        return 'permission-default'
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

/**
 * Demande la permission et enregistre la subscription côté serveur.
 * À appeler depuis un click utilisateur (les navigateurs imposent un user gesture).
 */
export async function subscribeUserToPush(userId: string): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY) {
    console.warn('[push] VITE_VAPID_PUBLIC_KEY manquante — souscription désactivée')
    return false
  }

  if (Notification.permission === 'default') {
    const result = await Notification.requestPermission()
    if (result !== 'granted') return false
  } else if (Notification.permission !== 'granted') {
    return false
  }

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
    })
  }

  const subJson = subscription.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: subJson.keys?.p256dh ?? '',
      auth: subJson.keys?.auth ?? '',
      user_agent: navigator.userAgent,
      enabled: true,
    },
    { onConflict: 'user_id,endpoint' }
  )

  return !error
}

export async function unsubscribeUserFromPush(): Promise<void> {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (subscription) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
    await subscription.unsubscribe()
  }
}
