# Prompt 01 — Dev A : backend gardien + dashboard (`apps/web`)

> Coller d'abord le prompt 00, puis ceci. Branche : `feat/web`.

```
Mon périmètre : apps/web uniquement (je peux aussi créer le schéma Prisma dedans). Je suis le « merger » de l'équipe : les autres me feront des PR vers main.

Objectif H+3 (mocks) :
1. Crée l'app : `npx create-next-app@latest apps/web --ts --app --tailwind --eslint --src-dir --import-alias "@/*" --use-npm` puis ajoute Prisma (provider sqlite, DATABASE_URL de .env.example), bcryptjs, zod, viem. Déclare la dépendance workspace "@payguard/shared": "*" et importe les types depuis là.
2. Schéma Prisma : Account, ApiKey (keyHash, prefix), Policy (champs = SpendingPolicy, listes en JSON string), Recipient (address, name, domain, trusted), Decision (tous les champs de Decision, reasons/compliance en JSON string), AuditEntry (seq, event, payload, prevHash, hash), KillSwitch. Seed : un compte demo@payguard.dev / password "demo1234", policy = DEFAULT_POLICY, une clé API dont la valeur en clair est écrite dans la console du seed (et seulement là) pour que je la mette dans .env.
3. Auth API : middleware qui lit `Authorization: Bearer pg_test_...`, hache en SHA-256, retrouve le compte. Erreurs au format ApiError.
4. Moteur de décision dans src/lib/guardian/ : un fichier par règle (rules/*.ts), chaque règle = fonction pure (ctx) => Reason | null, un orchestrateur evaluate(ctx) => { score, verdict, reasons, compliance } exactement selon docs/API.md §5. Le contexte contient : la requête, la policy, le solde (mocké pour l'instant via une interface ChainClient que Dev B implémentera : getBalance, executePayment, recordDecision, setKillSwitch), l'historique 24 h, les bénéficiaires connus. Écris des tests unitaires (vitest) pour au moins : marchand de confiance => APPROVED ≥ 90 ; marchand inconnu + injection + montant hors mandat => BLOCKED < 40 ; montant > require_confirmation_above => HOLD.
5. Hash de décision : fonction computeDecisionHash exactement selon docs/API.md §6, dans src/lib/guardian/hash.ts (Dev B la réutilisera pour la vérification).
6. Routes : POST /api/v1/payments/evaluate (idempotence par request_id, écrit la Decision, appelle le ChainClient mock, écrit l'AuditEntry chaînée + une ligne JSONL dans logs/audit.jsonl), GET /api/v1/payments/:id, GET /api/v1/payments, GET /api/v1/policy, GET /api/v1/account/balance, GET /api/v1/killswitch. Kill switch actif => 423 et décision BLOCKED enregistrée quand même.
7. Explication LLM : src/lib/explain.ts, appel Anthropic (modèle claude-sonnet-5-5, 2 phrases en français pour un dirigeant non technique), cache en DB par decision_hash, timeout 4 s, fallback template qui concatène les messages des reasons. Ne jamais faire échouer une décision à cause du LLM.
8. Kill switch automatique selon docs/API.md §5 (3 BLOCKED en 10 min, ou injection critique + montant > max_per_tx).
Vérification du jalon : un script scripts/curl-demo.sh qui enchaîne 3 appels (légitime, piège, HOLD) et affiche les verdicts.

Objectif H+6 (dashboard, après que Dev B m'a livré le vrai ChainClient dans packages/contracts/client) :
9. Pages (App Router, Tailwind, sobre et lisible pour un jury à 3 m de l'écran, mode sombre acceptable) : /login, /signup, /dashboard (résumé : solde, kill switch, 4 cadres de conformité, dernières décisions), /dashboard/policy (formulaire SpendingPolicy), /dashboard/api-keys (créer, afficher une seule fois, révoquer), /dashboard/approvals (file HOLD avec boutons Approuver / Rejeter), /dashboard/decisions (table avec score coloré, verdict en pastille, lien Snowtrace par tx), /dashboard/decisions/[id] (détail : raisons, cadres cités, hash, liens on-chain, explication), /dashboard/audit (chaîne de hachage vérifiée, pastille « intègre »). Gros bouton rouge KILL SWITCH dans l'en-tête, avec confirmation inline (pas de window.confirm), qui appelle DB + on-chain.
10. Les pages se rafraîchissent toutes les 3 s (polling simple) pour que la démo soit vivante.
11. Brancher le vrai ChainClient à la place du mock derrière un flag env CHAIN_MODE=mock|fuji (mock par défaut si PAYGUARD_CONTRACT_ADDRESS est vide).

Ne fais PAS : le serveur MCP, les pages marchands, le contrat. Ne touche pas à docs/ ni packages/shared sans me le dire.
```
