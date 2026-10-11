# PayGuard — direction design du dashboard

> **Statut : spec, pas encore implémenté.** Ce document décrit où on veut amener l'UI du dashboard
> (`apps/web`), pas où elle en est aujourd'hui. Il sert de référence pour la prochaine étape de
> travail (redesign), à relire avant de coder quoi que ce soit dessus.
>
> Objectif : passer d'une interface « vibe-codée » (chaque pastille de statut est un `<span>`
> stylé à la main, logique de couleur dupliquée entre deux composants) à une interface qui a l'air
> d'un vrai produit devant un jury qui inclut KPMG et Avalanche.

## 1. Direction visuelle

On garde l'identité **sombre « salle de contrôle »** actuelle (`apps/web/src/app/globals.css`) :
elle correspond au narratif cybersécurité du projet. On ne la jette pas, on l'élève — meilleure
cohérence des composants, moins de styles ad hoc copiés-collés, vraie échelle de couleurs
sémantiques au lieu de classes Tailwind inventées à chaque pastille.

Le mode clair n'est pas une priorité : BoardUI le gère nativement, donc rien n'empêche de
l'activer plus tard, mais on ne theme pas le clair tant que personne ne doit le montrer.

## 2. Fondation technique : BoardUI

On adopte [BoardUI](https://boardui.com) comme base de composants : système basé sur React 19 /
Tailwind v4 / React Aria, distribué en code (pas un kit Figma) via `npx boardui@latest add
<composant>` — chaque commande copie le composant source dans le repo, à la manière de
shadcn/ui, plutôt que d'ajouter une dépendance runtime monolithique.

Règle d'adoption : **composant par composant**, jamais une bascule globale. Chaque composant
installé est un commit isolé, vérifiable visuellement avant de passer au suivant. On ne touche
pas à `apps/web/src/components/ui.tsx` dans son ensemble d'un coup.

Point à vérifier avant d'installer quoi que ce soit : que le composant visé est bien dans l'offre
gratuite de BoardUI (les tiers payants commencent à 149 €/an pour des templates Pro — les
composants de base type `Chip`/`StatusDot` sont attendus côté gratuit, mais ce n'est confirmé
qu'au moment de lancer la CLI).

## 3. Stratégie des tokens de couleur

Le dashboard a aujourd'hui 10 variables CSS dans `globals.css` (`--bg --surface --surface-2
--line --fg --muted --accent --ok --warn --crit`), reprises 1:1 en utilitaires Tailwind via
`@theme inline`. BoardUI arrive avec son **propre** système de tokens sémantiques
(`--status-lime-text`, `--background-tertiary-default`, etc.), nommés différemment.

**Décision : on ne fait pas cohabiter deux palettes indépendantes.** On installe les tokens
BoardUI tels quels, puis on repointe uniquement leurs *valeurs* vers les variables existantes
(ex. `--status-lime-text: var(--ok)`, `--status-rose-text: var(--crit)`,
`--background-tertiary-default: var(--surface-2)`). Les variables `--color-*` existantes ne sont
jamais renommées ni supprimées — l'ajout est strictement additif, donc sans risque pour tout
composant qui n'a pas encore été migré.

## 4. Mapping des couleurs de statut

Table de référence pour tout futur composant de statut (basée sur `Chip` de BoardUI, qui
accepte une couleur parmi `orange/lime/rose/yellow/cyan/blue/purple/neutral/gray/soft` et trois
niveaux d'emphase `bold/subtle/caption`) :

| Sémantique PayGuard | Couleur `Chip` | Emphase |
|---|---|---|
| `APPROVED` / verdict `HOLD` validé par un humain (« Paid (human) ») | `lime` | bold |
| `PENDING_CONFIRMATION` / verdict `HOLD` en attente (« waiting ») | `yellow` | bold |
| `BLOCKED`, `REJECTED` (« Rejected (human) ») | `rose` | bold |
| `FAILED` | `neutral` | subtle |
| `ComplianceState` : `ok` / `warn` / `fail` | `lime` / `yellow` / `rose` | subtle (via `StatusDot`) |

Cette table remplace les deux tables de couleur actuelles (`VERDICT_STYLE` dans
`apps/web/src/components/ui.tsx`, et celle du composant mort `StatusBadge.tsx`) : une seule
source de vérité au lieu de deux risquant de diverger.

## 5. Carte de migration des composants

État actuel de `apps/web/src/components/` face à BoardUI :

| Composant actuel | Fichier | Cible BoardUI | Priorité |
|---|---|---|---|
| `VerdictPill` | `ui.tsx` | `Chip` (bold), logique de « statut final » à conserver à l'identique | Maintenant |
| `StatusBadge` | `StatusBadge.tsx` | — | À supprimer (mort : jamais importé, doublon exact de `VerdictPill`) |
| `FrameworkTile` (pastille `ComplianceState`) | `ui.tsx` | `StatusDot` | Après |
| `Button` | `ui.tsx` | équivalent BoardUI (4 variantes à mapper) | Après (composant à plus large surface d'usage, donc à migrer en dernier) |
| `Card`, `Field`, `EmptyState` | `ui.tsx` | équivalents BoardUI | Après |
| `ReasonList`, `RailBadge`, `ScoreBadge`, `ExplorerLink` | `ui.tsx` | pas de composant BoardUI direct équivalent, à revoir au cas par cas | Après |
| `VolumeChart` / `SpendChart` (SVG fait main) | `dashboard/page.tsx` | librairie de graphes BoardUI/TanStack éventuelle | Hors scope pour l'instant — plus haut risque de régression, aucune librairie installée aujourd'hui |
| `Nav` (barre latérale) | `Nav.tsx` | — | Hors scope — pas de restructuration de navigation prévue |

`VerdictPill` est utilisé à exactement 3 endroits (`dashboard/page.tsx`,
`dashboard/decisions/page.tsx`, `dashboard/decisions/[id]/page.tsx`), toujours avec les mêmes
props `{ verdict, status }`. Une réimplémentation sur `Chip` qui garde cette signature ne demande
aucun changement dans ces 3 fichiers.

## 6. Périmètre

**Maintenant (premier commit de redesign)** : pastille de statut (`Chip`/`StatusDot`),
suppression de `StatusBadge.tsx`.

**Après, si le temps le permet** : pastille `ComplianceState` sur `StatusDot`, puis `Button`
(dernier parce que c'est le composant le plus utilisé — le risque de régression visuelle est le
plus large).

**Hors scope** (pas avant le pitch, pas sans décision explicite de l'équipe) : mode clair,
librairie de graphiques, librairie de tables, restructuration de la nav, composants interactifs
React Aria (select, dialog, etc.) — rien de tout ça n'est nécessaire pour le statut visuel qu'on
cherche à corriger.
