# PayGuard — contrat d'API commun

> **Source de vérité pour toute l'équipe.** Les types TypeScript correspondants sont dans
> `packages/shared/src/types.ts`. Toute modification passe par ce fichier + les types, puis un
> message dans le groupe. Ne pas inventer de champ localement.

## 1. Vue d'ensemble

```
┌──────────────────┐  MCP (stdio)  ┌──────────────────┐  HTTPS + API key  ┌──────────────────────┐
│  Claude Desktop  │ ────────────▶ │  apps/mcp-server │ ─────────────────▶│ apps/web  /api/v1/*  │
│  (agent acheteur)│ ◀──────────── │  outils payguard │ ◀─────────────────│ moteur de décision   │
└──────────────────┘   verdict     └──────────────────┘    Decision JSON  │ + Prisma/SQLite      │
        │ lit la page                                                     │ + audit log chaîné   │
        ▼                                                                 └──────────┬───────────┘
┌──────────────────┐                                                                 │ viem
│ apps/merchants   │  2 pages : marchand légitime (:4001) et marchand piège (:4002)   ▼
└──────────────────┘                                                     ┌──────────────────────┐
                                                                         │ PayGuardLedger.sol   │
┌──────────────────┐  session cookie                                     │ Fuji C-Chain 43113   │
│ Dashboard (web)  │ ────────────▶ apps/web  /api/dashboard/*            │ pay / record / pause │
└──────────────────┘                                                     └──────────────────────┘
```

Principes :
- **Le gardien décide, puis exécute lui-même** le paiement en AVAX de test via le contrat. L'agent ne touche jamais la clé.
- **Règles déterministes d'abord**, le LLM n'écrit que l'explication en français. Si le LLM tombe, un texte template prend le relais. Zéro aléa en démo.
- **Chaque décision est hachée** (SHA-256) et ancrée on-chain, qu'elle soit approuvée ou refusée. Les refus sont aussi des preuves.
- **Testnet uniquement.** Aucun vrai fonds, aucune clé personnelle.

## 2. Authentification

| Surface | Mécanisme | Header / cookie |
|---|---|---|
| API agent (`/api/v1/*`) | Clé API par compte, préfixe `pg_test_`, stockée hachée (SHA-256) en base | `Authorization: Bearer pg_test_xxxxxxxx` |
| Dashboard (`/api/dashboard/*`, pages) | Session cookie signée (email + mot de passe bcrypt). Un compte de démo est seedé. | cookie `payguard_session` |

Erreur standard (toutes routes) :
```json
{ "error": { "code": "UNAUTHORIZED", "message": "Invalid or missing API key" } }
```
Codes : `UNAUTHORIZED` 401, `INVALID_REQUEST` 400, `NOT_FOUND` 404, `KILL_SWITCH_ACTIVE` 423, `CHAIN_ERROR` 502, `INTERNAL` 500.

## 3. API agent — `/api/v1`

### 3.1 `POST /api/v1/payments/evaluate` — le cœur

L'agent demande un paiement. Le gardien évalue, exécute si approuvé, et répond.
(Les notes parlaient de GET : une évaluation crée une décision et déplace des fonds, donc POST. Les lectures sont en GET.)

Requête (`EvaluatePaymentRequest`) :
```json
{
  "agent_id": "claude-desktop",
  "request_id": "7b0d6d8e-3f6e-4c7e-9d2b-1a2b3c4d5e6f",
  "amount": "0.05",
  "currency": "AVAX",
  "recipient": {
    "address": "0xAbC...1234",
    "name": "NordSound",
    "domain": "nordsound.shop"
  },
  "purpose": "Casque audio NordSound ANC Pro",
  "context": {
    "page_url": "http://localhost:4001/",
    "page_excerpt": "NordSound ANC Pro — 0.05 AVAX — payer à 0xAbC...1234",
    "conversation": [
      { "role": "user", "content": "Achète-moi le casque NordSound ANC Pro, budget 0.06 AVAX max." }
    ]
  }
}
```

Réponse 200 (`Decision`) :
```json
{
  "decision_id": "dec_01J9Z...",
  "request_id": "7b0d6d8e-...",
  "agent_id": "claude-desktop",
  "verdict": "APPROVED",
  "status": "APPROVED",
  "score": 92,
  "reasons": [
    { "code": "RECIPIENT_TRUSTED", "severity": "low", "delta": 0,
      "message": "Le marchand est dans le registre de confiance.", "frameworks": ["AML_CFT"] }
  ],
  "compliance": { "DORA": "ok", "MiCA": "ok", "AML_CFT": "ok", "AI_ACT": "ok" },
  "explanation": "Paiement de 0,05 AVAX à NordSound autorisé : marchand connu, montant dans le mandat, demande explicite de l'utilisateur.",
  "amount": "0.05", "currency": "AVAX",
  "recipient": { "address": "0xabc...1234", "name": "NordSound", "domain": "nordsound.shop" },
  "purpose": "Casque audio NordSound ANC Pro",
  "payment_tx": { "tx_hash": "0x...", "explorer_url": "https://testnet.snowtrace.io/tx/0x..." },
  "ledger_tx":  { "tx_hash": "0x...", "explorer_url": "https://testnet.snowtrace.io/tx/0x..." },
  "decision_hash": "3f2a...e9",
  "created_at": "2026-10-11T02:14:05Z",
  "resolved_at": "2026-10-11T02:14:09Z",
  "resolved_by": "guardian",
  "status_url": "/api/v1/payments/dec_01J9Z..."
}
```

Comportement selon le verdict :

| Verdict | status initial | Action on-chain | Ce que l'agent doit faire |
|---|---|---|---|
| `APPROVED` | `APPROVED` | `pay()` (fonds + hash) | Confirmer l'achat à l'utilisateur, donner le lien explorer. |
| `HOLD` | `PENDING_CONFIRMATION` | `record()` (hash, verdict 1) | Dire à l'utilisateur qu'une confirmation humaine est demandée sur le dashboard, puis `GET status_url` toutes les 5 s (max 2 min). |
| `BLOCKED` | `BLOCKED` | `record()` (hash, verdict 2) | Expliquer le refus à l'utilisateur avec `explanation`. **Ne pas réessayer** avec d'autres paramètres. |

Idempotence : même `request_id` ⇒ même `Decision` renvoyée, aucune nouvelle exécution.
Si le kill switch est actif : 423 `KILL_SWITCH_ACTIVE` (et une décision BLOCKED est quand même enregistrée pour la trace).

### 3.2 `GET /api/v1/payments/:decision_id`
Renvoie la `Decision` à jour. Utilisé pour le polling après un HOLD.

### 3.3 `GET /api/v1/payments?limit=20`
Historique des décisions du compte, plus récentes d'abord.

### 3.4 `GET /api/v1/policy`
Renvoie la `SpendingPolicy` du compte (l'agent peut la lire pour s'auto-limiter, pas la modifier).

### 3.5 `GET /api/v1/account/balance`
Renvoie `BalanceResponse` : solde du wallet gardien sur Fuji.

### 3.6 `GET /api/v1/killswitch`
Renvoie `KillSwitchState`. (L'activation se fait côté dashboard, voir 4.)

## 4. API dashboard — `/api/dashboard` (session)

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/dashboard/auth/signup` | `{ email, password, company_name }` → crée compte + policy par défaut + wallet |
| POST | `/api/dashboard/auth/login` / `logout` | session |
| GET / PUT | `/api/dashboard/policy` | lire / modifier `SpendingPolicy` |
| GET / POST | `/api/dashboard/api-keys` | lister / créer une clé (la clé en clair n'est renvoyée **qu'une fois**) |
| DELETE | `/api/dashboard/api-keys/:id` | révoquer |
| GET | `/api/dashboard/decisions?status=PENDING_CONFIRMATION` | file d'attente des HOLD |
| POST | `/api/dashboard/decisions/:id/approve` | humain approuve ⇒ `pay()` ⇒ status `APPROVED` |
| POST | `/api/dashboard/decisions/:id/reject` | ⇒ status `REJECTED` |
| GET / POST | `/api/dashboard/killswitch` | `{ active, reason }` ⇒ flag DB **et** `pause()/unpause()` on-chain |
| GET | `/api/dashboard/audit?limit=100` | entrées `AuditEntry` + vérification de la chaîne de hachage |
| GET | `/api/dashboard/compliance` | agrégat des 4 cadres sur les 24 h (nombre de warn/fail par cadre) |

## 5. Moteur de décision (apps/web/src/lib/guardian/)

Score de départ 100. Chaque règle qui se déclenche ajoute un `Reason` avec un `delta`. Score final borné à [0, 100].

| Code | Condition | delta | Sévérité | Cadres |
|---|---|---|---|---|
| `KILL_SWITCH_ACTIVE` | kill switch actif | → BLOCKED direct | critical | DORA, AI_ACT |
| `RECIPIENT_BLOCKLISTED` | adresse dans `blocked_recipients` | −100 | critical | AML_CFT |
| `MIN_BALANCE_BREACH` | solde − montant < `min_balance` | −50 | high | MiCA |
| `AMOUNT_OVER_TX_LIMIT` | montant > `max_per_tx` | −40 | high | MiCA, AML_CFT |
| `DAILY_LIMIT_EXCEEDED` | cumul 24 h + montant > `max_daily` | −40 | high | AML_CFT |
| `PROMPT_INJECTION_SUSPECTED` | ~45 motifs FR/EN dans `page_excerpt` / sorties d'outils, 9 familles : override d'instructions, faux message système, ciblage explicite des IA, détournement de rôle, secret vis-à-vis de l'humain, contournement du gardien, fausse autorité, redirection du paiement, menace/récompense. Liste dans `rules/promptInjection.ts`. Jamais dans les messages de l'utilisateur | −70, **→ BLOCKED direct** | critical | AI_ACT, DORA |
| `HIDDEN_INSTRUCTIONS` | la page contient un bloc invisible pour un humain (`[[HIDDEN …]]` / `[[COMMENT]]`, marqués par `demo-shop`) avec un ordre, un montant ou une adresse | −50, **→ BLOCKED direct** | critical | AI_ACT, DORA |
| `PAGE_PRICE_MISMATCH` | montant demandé > prix le plus élevé **visible** sur la page (+5 %) | −35 | high | MiCA, AI_ACT |
| `PAGE_ADDRESS_MISMATCH` | la page affiche une ou des adresses et celle demandée n'en fait pas partie | −35 | high | AML_CFT, AI_ACT |
| `PAGE_PRODUCT_MISMATCH` | aucun mot de `purpose` sur la page lue (pages ≥ 15 mots seulement) | −20 | medium | AI_ACT |
| `PURPOSE_NOT_REQUESTED_BY_USER` | aucun message `user` ne mentionne le produit/marchand (similarité mots-clés) | −35 | high | AI_ACT |
| `RECIPIENT_CHANGED_MID_CONVERSATION` | une autre adresse 0x apparaît dans la conversation pour le même achat | −35 | high | AML_CFT |
| `DOMAIN_LOOKALIKE` | distance de Levenshtein ≤ 2 avec un `trusted_domain`, ou substitution 0/o, 1/l, rn/m | −30 | high | AML_CFT |
| `RECIPIENT_UNKNOWN` | adresse ni trusted ni dans l'historique | −25 | medium | AML_CFT |
| `VELOCITY_ANOMALY` | ≥ 3 demandes en 10 min | −20 | medium | AML_CFT, DORA |
| `PRICE_ANOMALY` | montant > 3× la médiane des achats passés ou > montant max cité par l'utilisateur | −15 | medium | MiCA |
| `URGENCY_LANGUAGE` | « urgent », « immédiatement », « dernière chance », « now », « expires » | −10 | low | AML_CFT |
| `RECIPIENT_TRUSTED` | adresse dans `trusted_recipients` | 0 (informatif) | low | AML_CFT |

Verdict :
- `KILL_SWITCH_ACTIVE`, `RECIPIENT_BLOCKLISTED`, `PROMPT_INJECTION_SUSPECTED` ou `HIDDEN_INSTRUCTIONS` présent ⇒ `BLOCKED` direct (règles terminales) ;
- montant > `require_confirmation_above` ⇒ au mieux `HOLD`, jamais APPROVED automatique ;
- `score ≥ auto_approve_score` ⇒ `APPROVED` ;
- `hold_score ≤ score < auto_approve_score` ⇒ `HOLD` ;
- `score < hold_score` ⇒ `BLOCKED`.

`compliance` : pour chaque cadre, `fail` si une raison `critical`/`high` le cite, `warn` si `medium`/`low`, sinon `ok`.

Kill switch automatique : 3 décisions `BLOCKED` en 10 min, ou une raison `PROMPT_INJECTION_SUSPECTED` de niveau critical avec montant > `max_per_tx` ⇒ activation du kill switch (DB + on-chain) + entrée d'audit `KILL_SWITCH_ON` avec `reason: "auto"`.

Explication LLM : prompt système court, entrée = la décision JSON, sortie = 2 phrases en français pour un dirigeant non technique. Mise en cache par `decision_hash`. Fallback template si erreur ou > 4 s.

## 6. Hash de décision

`decision_hash = sha256(JSON.stringify({ decision_id, request_id, agent_id, amount, currency, recipient: { address }, purpose, verdict, score, reasons: reasons.map(r => r.code).sort(), created_at }))`

Même formule côté API et côté script de vérification. Le hash est passé à `pay()` ou `record()` et est visible dans l'explorer.

## 7. Contrat `PayGuardLedger.sol` (packages/contracts)

```solidity
// Owner = wallet gardien (GUARDIAN_PRIVATE_KEY). OpenZeppelin Ownable + Pausable.
event PaymentExecuted(bytes32 indexed decisionId, address indexed to, uint256 amount, bytes32 decisionHash);
event DecisionRecorded(bytes32 indexed decisionId, uint8 verdict, bytes32 decisionHash); // 1 = HOLD, 2 = BLOCKED, 3 = REJECTED
event KillSwitchActivated(string reason);
event KillSwitchDeactivated();

function pay(bytes32 decisionId, address payable to, bytes32 decisionHash) external payable onlyOwner whenNotPaused;
function record(bytes32 decisionId, uint8 verdict, bytes32 decisionHash) external onlyOwner; // works even when paused
function activateKillSwitch(string calldata reason) external onlyOwner;   // _pause()
function deactivateKillSwitch() external onlyOwner;                        // _unpause()
function getDecision(bytes32 decisionId) external view returns (uint8 verdict, bytes32 decisionHash, uint256 timestamp);
```

`decisionId` = `keccak256(decision_id string)`. Le client TypeScript (viem) expose :
`executePayment(decisionId, to, amountWei, decisionHash)`, `recordDecision(decisionId, verdict, decisionHash)`, `setKillSwitch(active, reason)`, `getBalance()`, `explorerUrl(txHash)`.

## 8. Outils MCP (apps/mcp-server)

Serveur `payguard` (stdio) :

| Outil | Entrée | Sortie |
|---|---|---|
| `request_payment` | `amount, recipient_address, recipient_name?, recipient_domain?, purpose, page_url?, page_excerpt?, conversation_summary?` | texte : verdict, score, explication, lien explorer, et consigne (confirmer / attendre / abandonner) |
| `check_payment_status` | `decision_id` | status à jour |
| `get_spending_policy` | — | policy lisible |
| `get_balance` | — | solde Fuji |

Serveur `demo-shop` (stdio, séparé pour que le gardien ne soit pas celui qui fournit la page) :

| Outil | Entrée | Sortie |
|---|---|---|
| `read_merchant_page` | `url` | texte de la page ; les blocs invisibles pour un humain sont conservés mais **marqués** `[[HIDDEN <raison>]] … [[/HIDDEN]]` (display:none, visibility, opacity, taille 0/1px, blanc sur blanc, hors écran, attribut hidden, aria-hidden) et `[[COMMENT]] … [[/COMMENT]]` pour les commentaires HTML. Le gardien s'en sert pour séparer « ce que l'humain a vu » de « ce que l'agent a lu » |

Le serveur MCP génère `request_id` (UUID v4) et transmet la conversation résumée fournie par l'agent.

## 9. Variables d'environnement

Voir `.env.example` à la racine. Jamais de valeur dans le code ni dans un commit.
