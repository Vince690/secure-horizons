# PayGuard — ordre de construction (une machine, ~10 h de build + 2 h de répétition)

> Mode actuel : tout se construit sur l'ordinateur de Vincent, étape après étape. Chaque étape a un
> **critère de passage** vérifiable et un **prompt** à coller dans Claude Code (toujours précédé du
> prompt `docs/prompts/00-shared-context.md`). On ne passe à l'étape suivante que si le critère est
> rempli. À tout moment, l'étape terminée la plus avancée doit rester démontrable.
>
> Principe : on construit **le cerveau d'abord** (testable sans réseau), puis **le chemin complet avec
> des mocks**, puis on remplace les mocks un par un (chaîne, LLM), puis le dashboard, puis la
> fiabilité. La blockchain arrive à l'étape 5, après qu'une démo de bout en bout fonctionne déjà :
> si Fuji pose problème, on a quand même quelque chose à montrer.

## Vue d'ensemble

| # | Étape | Durée | Démontrable après l'étape |
|---|---|---|---|
| 0 | Squelette monorepo + Next.js | 0:20 | `npm run dev:web` affiche une page |
| 1 | Moteur de décision pur + tests | 1:00 | `npx vitest` vert : APPROVED / HOLD / BLOCKED sur 3 cas |
| 2 | API `evaluate` + SQLite + clé API + audit log (chaîne mockée) | 1:15 | `scripts/curl-demo.sh` affiche 3 verdicts |
| 3 | Serveur MCP + Claude Desktop | 1:00 | Claude Desktop appelle `request_payment` et affiche un verdict |
| 4 | Pages marchands + scénario d'attaque | 0:45 | Légitime ⇒ APPROVED, piège ⇒ BLOCKED, dans Claude Desktop |
| 5 | Contrat Fuji + client viem, remplace le mock | 1:30 | Lien Snowtrace réel dans la réponse de Claude |
| 6 | Routes + pages du dashboard | 2:30 | Un HOLD approuvé à la main, kill switch manuel, historique avec liens |
| 7 | Kill switch auto on-chain + explications LLM en cache | 0:45 | 3 pièges ⇒ `pause()` visible ; explication en français sans latence |
| 8 | Script de secours + conformité JSON + README/DEMO | 1:00 | `npm run demo -w apps/demo-agent` rejoue tout en terminal |
| 9 | **FREEZE**, répétitions, vidéo, scan secrets | 2:00 | Démo < 3 min, trois fois de suite |

Si une étape dépasse sa durée de plus de 20 minutes : on demande à Claude une version plus simple, ou on garde le mock et on avance. Si une étape est optionnelle pour la démo (7, 8), on peut la sauter en cas de retard.

Option « deux terminaux » : si deux personnes veulent avancer en parallèle sur la même machine, l'étape 5 (contrat, dossier `packages/contracts`) peut se faire dans un second terminal Claude Code pendant les étapes 2 à 4, car elle ne touche aucun fichier commun. Rien d'autre ne se fait en parallèle.

---

## Étape 0 — Squelette (0:20)

**Fichiers** : `apps/web` (create-next-app), racine.
**Prompt** :
```
Étape 0 de docs/BUILD_ORDER.md. Crée l'app Next.js : `npx create-next-app@latest apps/web --ts --app --tailwind --eslint --src-dir --import-alias "@/*" --use-npm`. Ajoute la dépendance workspace "@payguard/shared": "*" dans apps/web/package.json, lance `npm install` à la racine, vérifie que `npm run dev:web` affiche la page d'accueil sur http://localhost:3000, puis crée les dossiers vides apps/web/src/app/api, src/lib, src/components, src/fixtures (avec .gitkeep). Commit « Scaffold apps/web ».
```
**Critère** : la page s'affiche, `git log` montre le commit.

## Étape 1 — Moteur de décision pur (1:00)

**Fichiers** : `apps/web/src/lib/guardian/**`.
**Prompt** :
```
Étape 1 de docs/BUILD_ORDER.md. Suis le prompt docs/prompts/01-dev-a-backend-api.md, points 4 et 5 uniquement : le moteur de décision dans apps/web/src/lib/guardian/ (une règle par fichier, fonctions pures, orchestrateur evaluate()) exactement selon docs/API.md §5, la fonction computeDecisionHash selon §6, et les tests vitest. Aucune base de données, aucun réseau à cette étape : le contexte (policy, solde, historique, bénéficiaires) est passé en paramètre. Ajoute aussi un ChainClient d'interface (getBalance, executePayment, recordDecision, setKillSwitch, isPaused) et un createMockChainClient() dans src/lib/chain/ : Dev B remplacera le mock à l'étape 5.
```
**Critère** : `npx vitest run` vert avec au moins : marchand de confiance ⇒ APPROVED ≥ 90 ; inconnu + injection + hors mandat ⇒ BLOCKED < 40 ; montant > seuil de confirmation ⇒ HOLD.

## Étape 2 — API `evaluate` + base + clé API + audit (1:15)

**Fichiers** : `apps/web/prisma/`, `apps/web/src/app/api/v1/**`, `apps/web/src/lib/{db,auth,audit}.ts`, `apps/web/scripts/curl-demo.sh`.
**Prompt** :
```
Étape 2 de docs/BUILD_ORDER.md. Suis le prompt docs/prompts/01-dev-a-backend-api.md, points 1, 2, 3, 6 : Prisma + SQLite avec le schéma décrit, seed (compte demo@payguard.dev, policy par défaut, clé API affichée une seule fois dans la console du seed), middleware de clé API, toutes les routes /api/v1 de docs/API.md §3 avec le mock chain client, audit log chaîné (DB + logs/audit.jsonl), idempotence par request_id, 423 si kill switch. L'explication reste un texte template pour l'instant (pas d'appel LLM). Termine par scripts/curl-demo.sh qui enchaîne les 3 cas (légitime, piège, HOLD) et affiche verdict + score.
```
**Critère** : `bash apps/web/scripts/curl-demo.sh` affiche APPROVED, BLOCKED, HOLD. Je mets la clé API dans `.env` (`PAYGUARD_API_KEY`).

## Étape 3 — Serveur MCP + Claude Desktop (1:00)

**Fichiers** : `apps/mcp-server/**`, config Claude Desktop (hors repo).
**Prompt** :
```
Étape 3 de docs/BUILD_ORDER.md. Suis le prompt docs/prompts/03-dev-c-mcp-merchants-demo.md, points 1 et 2, mais sans le mini serveur mock : PAYGUARD_API_URL pointe directement sur http://localhost:3000 avec la vraie clé de .env. Les deux serveurs (payguard, demo-shop) doivent apparaître dans Claude Desktop. Écris la config exacte dans apps/mcp-server/README.md avec des chemins absolus vers ce Mac.
```
**Critère** : dans Claude Desktop, « Appelle request_payment pour 0.05 AVAX vers 0x1111… pour un casque NordSound » ⇒ réponse avec verdict et score. Si Claude Desktop refuse ou hésite, noter la formulation qui marche.

## Étape 4 — Pages marchands + scénario d'attaque (0:45)

**Fichiers** : `apps/merchants/**`.
**Prompt** :
```
Étape 4 de docs/BUILD_ORDER.md. Suis le prompt docs/prompts/03-dev-c-mcp-merchants-demo.md, points 3 et 4 : les deux pages marchands (légitime :4001, piège :4002 avec injection cachée), servies par `npm run dev:merchants`. Puis rejoue dans Claude Desktop les deux phrases de démo et note dans apps/mcp-server/README.md celles qui marchent de façon fiable. Ajoute l'adresse du marchand légitime dans la policy du seed (trusted_recipients + trusted_domains) pour que le cas légitime passe ≥ 90.
```
**Critère** : légitime ⇒ APPROVED, piège ⇒ BLOCKED avec au moins DOMAIN_LOOKALIKE, PROMPT_INJECTION_SUSPECTED, RECIPIENT_UNKNOWN. **Première démo complète (chaîne mockée).** Commit, et on garde cet état comme filet.

## Étape 5 — Contrat Fuji + client viem (1:30)

**Fichiers** : `packages/contracts/**`, `apps/web/src/lib/chain/fuji.ts`, `README.md` (adresse).
**Prompt** :
```
Étape 5 de docs/BUILD_ORDER.md. Suis le prompt docs/prompts/02-dev-b-blockchain.md, points 1 à 5 et 8 : Hardhat, PayGuardLedger.sol selon docs/API.md §7, tests, déploiement sur Fuji avec GUARDIAN_PRIVATE_KEY (jamais commitée), adresse écrite dans README.md, client viem exporté en @payguard/chain qui implémente exactement l'interface ChainClient de apps/web/src/lib/chain/. Branche-le dans l'API derrière CHAIN_MODE=fuji. Vérifie d'abord le solde du wallet : s'il est sous 1 AVAX, dis-le-moi avant de déployer.
```
**Critère** : `curl-demo.sh` renvoie des `payment_tx` et `ledger_tx` réels, cliquables sur testnet.snowtrace.io ; Claude Desktop montre le lien. Garder `CHAIN_MODE=mock` comme repli documenté dans README.

## Étape 6 — Dashboard : routes puis pages (2:30)

**Fichiers** : `apps/web/src/app/api/dashboard/**`, `apps/web/src/app/(dashboard)/**`, `src/app/login`, `src/components/**`.
**Prompt A (routes, 0:45)** :
```
Étape 6A de docs/BUILD_ORDER.md. Suis le prompt docs/prompts/01-dev-a-backend-api.md, points 9 et 11 : toutes les routes /api/dashboard/* de docs/API.md §4, session cookie signée, approve ⇒ pay() ⇒ APPROVED, killswitch ⇒ DB + on-chain. Teste chaque route avec curl avant de passer aux pages.
```
**Prompt B (pages, 1:45)** :
```
Étape 6B de docs/BUILD_ORDER.md. Suis le prompt docs/prompts/04-vincent-dashboard-pitch.md, points 4 et 5, en appelant directement les routes (pas de fixtures puisque les routes existent). Ordre des pages, par importance pour la démo : /login, /dashboard (solde, kill switch, 4 tuiles conformité, dernières décisions), /dashboard/approvals, /dashboard/decisions et [id], /dashboard/policy, /dashboard/api-keys, /dashboard/audit. Montre-moi chaque page dans le navigateur avant de passer à la suivante.
```
**Critère** : un achat à 0.09 AVAX (au-dessus du seuil de confirmation) ⇒ HOLD ⇒ j'approuve sur /dashboard/approvals ⇒ tx Fuji ⇒ l'agent voit APPROVED via `check_payment_status`. Bouton kill switch ⇒ 423 côté agent.

## Étape 7 — Kill switch automatique + explications LLM (0:45)

**Prompt** :
```
Étape 7 de docs/BUILD_ORDER.md. Suis docs/prompts/01-dev-a-backend-api.md, points 7 et 8 : explication LLM (Anthropic, claude-sonnet-5-5, 2 phrases FR, cache par decision_hash, timeout 4 s, fallback template) et kill switch automatique (3 BLOCKED en 10 min ou injection critique + montant > max_per_tx) qui appelle aussi activateKillSwitch on-chain. Rejoue ensuite le scénario de démo deux fois : la seconde ne doit déclencher aucun appel LLM.
```
**Critère** : 3 pièges d'affilée ⇒ dashboard passe en « KILL SWITCH ACTIF », tx `pause()` visible sur Snowtrace, Claude Desktop reçoit le message 423.

## Étape 8 — Secours, conformité, docs (1:00)

**Prompt** :
```
Étape 8 de docs/BUILD_ORDER.md. (a) Suis docs/prompts/03-dev-c-mcp-merchants-demo.md, points 5 et 6 : apps/demo-agent qui rejoue la démo en terminal sans Claude Desktop, et demo:attack. (b) Suis docs/prompts/04-vincent-dashboard-pitch.md, point 8 : docs/compliance.rules.json, et branche-le dans le moteur pour les champs frameworks et message. (c) Complète README.md (Lancer, Contrat déployé) et DEMO.md avec ce qui marche vraiment.
```
**Critère** : `npm run demo -w apps/demo-agent` affiche la séquence complète ; README permet à un inconnu de lancer le projet.

## Étape 9 — FREEZE (2:00)

Coller `docs/prompts/05-integration-freeze.md`. Plus aucune feature. Trois répétitions chronométrées, enregistrement vidéo du happy path (hors repo), `git ls-files | grep -E "\.env$"` vide, `git log -p | grep -iE "sk-ant|0x[a-f0-9]{64}"` vide, repo passé en public si on veut le montrer au jury.

## Rôles pendant la construction (même machine)

- **Au clavier avec Claude Code** : une personne à la fois par terminal. Celui qui connaît le mieux la brique en cours (Dev A pour 1-2-6A-7, Dev C pour 3-4-8a, Dev B pour 5, Vincent pour 6B-8b-8c-9).
- **Les autres** : relisent `docs/API.md` pour repérer les écarts, testent chaque critère de passage, préparent les slides et le script de démo, tiennent le chrono. Une personne note dans CLAUDE.md (journal) chaque décision prise.
