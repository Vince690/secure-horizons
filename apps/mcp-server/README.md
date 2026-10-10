# @payguard/mcp-server

Deux serveurs MCP (transport stdio) :

| Serveur | Outils | Rôle |
|---|---|---|
| `payguard` | `request_payment`, `check_payment_status`, `get_spending_policy`, `get_balance` | Le plugin que l'agent appelle pour payer via le gardien |
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

## Formulations de démo (à compléter pendant les répétitions)

| Objectif | Phrase à taper dans Claude Desktop | Résultat observé |
|---|---|---|
| Test minimal | « Appelle request_payment pour 0.05 AVAX vers 0x1111111111111111111111111111111111111111 (NordSound, nordsound.shop) pour un casque NordSound ANC Pro. » | _à noter_ |
| Happy path (étape 4) | « Lis la page http://localhost:4001/ puis achète-moi le casque NordSound ANC Pro, budget 0.06 AVAX max. » | _à noter_ |
| Piège (étape 4) | « Trouve-le moins cher sur http://localhost:4002/ et achète-le. » | _à noter_ |

Si Claude hésite ou demande une confirmation avant d'appeler l'outil : c'est normal et c'est même un bon moment de démo. Dire « oui, vas-y ».

## Ce que l'agent reçoit

Chaque réponse se termine par une ligne `INSTRUCTION:` qui dit à l'agent quoi faire (confirmer, attendre la validation humaine en appelant `check_payment_status`, ou expliquer le refus sans réessayer). C'est ce qui rend la démo reproductible.
