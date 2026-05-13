# Templates emails Supabase — Pro'Vap

Templates HTML personnalisés pour les emails transactionnels envoyés par Supabase Auth.

## Comment les appliquer

1. Aller sur https://supabase.com/dashboard/project/cvlutwrbminueqgnsoin/auth/templates
2. Pour chaque template ci-dessous, ouvrir l'onglet correspondant dans le dashboard
3. Copier le contenu HTML du fichier `.html` et le coller dans le champ "Message (HTML)"
4. Modifier également le sujet ("Subject heading") avec la valeur indiquée
5. Sauvegarder

## Fichiers

| Template Supabase | Fichier | Sujet |
|---|---|---|
| Confirm signup | [confirm-signup.html](confirm-signup.html) | Confirmez votre inscription Pro'Vap |
| Reset password | [reset-password.html](reset-password.html) | Réinitialisez votre mot de passe Pro'Vap |
| Change email address | [change-email.html](change-email.html) | Confirmez votre nouvelle adresse Pro'Vap |

## Variables Supabase utilisées

- `{{ .ConfirmationURL }}` : lien d'action (confirmation, reset, etc.)
- `{{ .Email }}` : email actuel de l'utilisateur
- `{{ .NewEmail }}` : nouvel email (pour Change email uniquement)

## Choix de design

- Fond crème ivoire (`#F6F1E8`) pour rester lisible dans Gmail, Outlook, Apple Mail
- Serif Georgia / Times en fallback de Cormorant Garamond (Google Fonts non chargées dans Gmail webmail)
- Bouton CTA terracotta (`#B8482A`)
- Logo : PNG hébergé sur `application-pro-vap.vercel.app/icons/icon-512.png`
- Layout table-based pour compatibilité Outlook
- Largeur max 600px
- Vouvoiement (cohérent avec l'app)
