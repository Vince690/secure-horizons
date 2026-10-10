# Prompt 01 — Dev A : backend gardien, API + moteur + base (`apps/web`, hors pages)

> Coller d'abord le prompt 00, puis ceci. Branche : `feat/web`.

```
Mon périmètre : dans apps/web, UNIQUEMENT src/app/api/**, src/lib/**, prisma/ et les scripts. Vincent construit les pages du dashboard dans src/app/(dashboard)/** et src/components/** : je n'y touche jamais, et il ne touche jamais à mon périmètre. Le squelette Next.js existe déjà (créé au kickoff) : je ne relance pas create-next-app. Je suis le « merger » de l'équipe : les autres me font des PR vers main.

Objectif H+3 (mocks) :
1. Ajoute à apps/web : Prisma (provider sqlite, DATABASE_URL de .env.example), bcryptjs, zod, viem, vitest. Vérifie que "@payguard/shared" est bien une dépendance workspace et importe les types depuis là.
2. Schéma Prisma : Account, ApiKey (keyHash, prefix), Policy (champs = SpendingPolicy, listes en JSON string), Recipient (address, name, domain, trusted), Decision (tous les champs de Decision, reasons/compliance en JSON string), AuditEntry (seq, event, payload, prevHash, hash), KillSwitch. Seed : un compte demo@payguard.dev / password "demo1234", policy = DEFAULT_POLICY, une clé API dont la valeur en clair est écrite dans la console du seed (et seulement là) pour que je la mette dans .env.
3. Auth API : middleware qui lit `Authorization: Bearer pg_test_...`, hache en SHA-256, retrouve le compte. Erreurs au format ApiError.
4. Moteur de décision dans src/lib/guardian/ : un fichier par règle (rules/*.ts), chaque règle = fonction pure (ctx) => Reason | null, un orchestrateur evaluate(ctx) => { score, verdict, reasons, compliance } exactement selon docs/API.md §5. Le contexte contient : la requête, la policy, le solde (mocké pour l'instant via une interface ChainClient que Dev B implémentera : getBalance, executePayment, recordDecision, setKillSwitch), l'historique 24 h, les bénéficiaires connus. Écris des tests unitaires (vitest) pour au moins : marchand de confiance => APPROVED ≥ 90 ; marchand inconnu + injection + montant hors mandat => BLOCKED < 40 ; montant > require_confirmation_above => HOLD.
5. Hash de décision : fonction computeDecisionHash exactement selon docs/API.md §6, dans src/lib/guardian/hash.ts (Dev B la réutilisera pour la vérification).
6. Routes : POST /api/v1/payments/evaluate (idempotence par request_id, écrit la Decision, appelle le ChainClient mock, écrit l'AuditEntry chaînée + une ligne JSONL dans logs/audit.jsonl), GET /api/v1/payments/:id, GET /api/v1/payments, GET /api/v1/policy, GET /api/v1/account/balance, GET /api/v1/killswitch. Kill switch actif => 423 et décision BLOCKED enregistrée quand même.
7. Explication LLM : src/lib/explain.ts, appel Anthropic (modèle claude-sonnet-5-5, 2 phrases en français pour un dirigeant non technique), cache en DB par decision_hash, timeout 4 s, fallback template qui concatène les messages des reasons. Ne jamais faire échouer une décision à cause du LLM.
8. Kill switch automatique selon docs/API.md §5 (3 BLOCKED en 10 min, ou injection critique + montant > max_per_tx).
Vérification du jalon : un script scripts/curl-demo.sh qui enchaîne 3 appels (légitime, piège, HOLD) et affiche les verdicts.

Objectif H+6 (après que Dev B m'a livré le vrai ChainClient dans packages/contracts/client) :
9. Routes dashboard (session cookie signée avec SESSION_SECRET, bcrypt) exactement selon docs/API.md §4 : signup, login, logout, policy GET/PUT, api-keys GET/POST/DELETE (clé en clair renvoyée une seule fois), decisions GET avec filtre status, approve (=> pay() => APPROVED) / reject, killswitch GET/POST (DB + on-chain), audit GET avec vérification de la chaîne de hachage, compliance GET (agrégat 24 h par cadre). Vincent consomme ces routes depuis ses pages : si une réponse diffère du contrat, c'est moi qui corrige, pas lui.
10. Brancher le vrai ChainClient à la place du mock derrière un flag env CHAIN_MODE=mock|fuji (mock par défaut si PAYGUARD_CONTRACT_ADDRESS est vide).
11. Une route GET /api/dashboard/me (compte courant) pour que les pages sachent si l'utilisateur est connecté.

Ne fais PAS : les pages du dashboard (Vincent), le serveur MCP, les pages marchands, le contrat. Ne touche pas à docs/ ni packages/shared sans me le dire.
```
