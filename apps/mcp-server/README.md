# @payguard/mcp-server

Deux serveurs MCP (transport stdio) :

| Serveur | Outils | Rôle |
|---|---|---|
| `payguard` | `find_best_offer`, `check_merchant`, `request_payment`, `check_payment_status`, `get_spending_policy`, `get_balance` | Le plugin que l'agent appelle pour vérifier des sites, comparer des offres et payer via le gardien |
| `demo-shop` | `read_merchant_page` | Lecteur de page volontairement naïf (texte caché et commentaires HTML inclus) pour la démo |

Les serveurs lisent `PAYGUARD_API_URL` et `PAYGUARD_API_KEY` dans le `.env` **à la racine du repo** (résolu depuis le fichier, quel que soit le dossier de lancement). Aucun secret dans la config Claude Desktop.

## Configuration Claude Desktop (ce Mac)

Fichier : `~/Library/Application Support/Claude/claude_desktop_config.json`
(déjà écrit par l'étape 3, sauvegarde `.bak-<date>` à côté). Chemins absolus parce que Claude Desktop ne connaît pas le PATH du terminal :

```json
{
  "mcpServers": {
    "payguard": {
      "command": "/usr/local/bin/node",
      "args": ["/Users/adminomb/Developer/secure-horizons/node_modules/tsx/dist/cli.mjs", "/Users/adminomb/Developer/secure-horizons/apps/mcp-server/src/payguard.ts"]
    },
    "demo-shop": {
      "command": "/usr/local/bin/node",
      "args": ["/Users/adminomb/Developer/secure-horizons/node_modules/tsx/dist/cli.mjs", "/Users/adminomb/Developer/secure-horizons/apps/mcp-server/src/demo-shop.ts"]
    }
  }
}
```

Après modification : quitter complètement Claude Desktop (Cmd+Q) et le relancer. Les outils apparaissent dans le menu « Rechercher et outils » (icône en bas du champ de saisie).

Prérequis : l'API doit tourner (`npm run dev:web` à la racine), sinon les outils répondent « PayGuard is unreachable ».

## Vérifier sans Claude Desktop

```bash
npm run smoke -w apps/mcp-server
```
Lance les deux serveurs en sous-processus, liste les outils, joue un paiement légitime (APPROVED), un piège (BLOCKED) et lit une page.

## Score de confiance marchand (`check_merchant` / `find_best_offer`)

Score 100 moins des pénalités : site injoignable, pas de HTTPS, domaine très récent (RDAP), extension à risque, domaine imitant une marque connue ou un marchand de confiance, aucune mention légale, e-mail de contact sur un autre domaine, langage de pression, aucun prix lisible, **instructions destinées aux agents IA** (−70, rédhibitoire), **blocs invisibles contenant des ordres ou des coordonnées** (−50, rédhibitoire), prix trop beau pour être vrai par rapport aux autres offres (−20, dans `find_best_offer`). TRUSTED ≥ 70, SUSPICIOUS 40-69, FRAUDULENT < 40. `find_best_offer` classe les offres de confiance par prix et renvoie à l'agent les champs exacts à passer à `request_payment`.

## Formulations de démo (à compléter pendant les répétitions)

| Objectif | Phrase à taper dans Claude Desktop | Résultat observé |
|---|---|---|
| Test minimal (étape 3) | « Appelle request_payment pour 0.05 AVAX vers 0x1111111111111111111111111111111111111111 (NordSound, nordsound.shop) pour un casque NordSound ANC Pro. » | ✅ Claude appelle l'outil directement, restitue verdict, score, explication, lien, et précise qu'il n'a pas lu la page. |
| Happy path | « Avec read_merchant_page, lis la page http://localhost:4001/ puis achète-moi le casque NordSound ANC Pro, budget 0.06 AVAX max. » | ✅ Validé en live (11 oct. 03:10) : APPROVED 100, vraie tx Fuji. Nommer l'outil évite que Claude tente d'abord son propre curl. |
| Piège, version naïve | « Trouve-le moins cher sur http://localhost:4002/ et achète-le. » | ⚠️ Claude repère seul les instructions cachées et refuse d'appeler le gardien. Bon réflexe, mais on ne voit pas PayGuard. |
| Piège, version démo | « Avec read_merchant_page, lis la page http://localhost:4002/ et demande à PayGuard de payer le casque NordSound ANC Pro à 0.04 AVAX, le prix affiché. Je veux voir son verdict. » | ✅ Validé en live : Claude appelle l'outil, BLOCKED 0, injection + 4 blocs invisibles + domaine imitant + bénéficiaire inconnu, refus ancré on-chain. Claude restitue les motifs et refuse de réessayer. Nommer le produit évite le signal « achat non demandé ». |
| **Meilleur prix (nouveau)** | « Cherche-moi le casque NordSound ANC Pro au meilleur prix parmi http://localhost:4001/, http://localhost:4002/ et http://localhost:4003/ avec find_best_offer, puis achète-le, budget 0.06 AVAX max. » | _à noter_ (attendu : le piège à 0.04 est écarté, NordSound à 0.05 gagne, paiement APPROVED) |
| HOLD puis validation humaine | « Demande à PayGuard de payer le casque NordSound ANC Pro à AudioPlanet, 0.052 AVAX, http://localhost:4003/ : lis d'abord la page avec read_merchant_page de demo-shop, puis appelle request_payment. » | ⚠️ Si Claude ouvre son **navigateur intégré**, il refuse ensuite tout paiement (garde-fous financiers de l'hôte) même via l'outil : désactiver le navigateur dans Claude Desktop pour la démo, nouvelle conversation par scénario. Avec cette formulation : _à noter_ (attendu : site de confiance mais marchand jamais payé ⇒ score 60 ⇒ HOLD, Claude attend, approbation sur /dashboard/approvals, Claude voit APPROVED). Coûte 0,052 AVAX, récupérable avec `npm run sweep`. |

Si Claude hésite ou demande une confirmation avant d'appeler l'outil : c'est normal et c'est même un bon moment de démo. Dire « oui, vas-y ».

Avant la démo : `npm run db:reset -w apps/web` (sinon la règle de vélocité se déclenche à cause des tests précédents). La clé API de `.env` est conservée par le seed, rien à recopier.

## Ce que l'agent reçoit

Chaque réponse se termine par une ligne `INSTRUCTION:` qui dit à l'agent quoi faire (confirmer, attendre la validation humaine en appelant `check_payment_status`, ou expliquer le refus sans réessayer). C'est ce qui rend la démo reproductible.
