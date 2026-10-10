# Secure Horizons — contexte projet (hackathon ESSEC, 10–11 octobre 2026)

## Qui je suis
- Vincent, étudiant en M2 « IA & Propriété intellectuelle » (droit). Pas développeur : je ne code pas à la main, je pilote des agents IA.
- J'ai déjà publié une app iOS. Je comprends les concepts produit, pas forcément le détail technique.
- Équipe de **4** : 3 développeurs (Dev A API+moteur+base, Dev B blockchain, Dev C MCP+démo) et moi (dashboard front avec Claude Code, conformité légère, pitch, démo). Explique-moi tes choix en 1–2 phrases simples, en français. Code, noms de variables et commentaires en anglais.

## L'événement
- Hackathon IA & cybersécurité de 36 h à l'ESSEC Cergy, ~150 étudiants, 15 000 € en cash et crédits.
- Organisé par UTOPIA (asso IA de l'ESSEC), KRYPTOSPHERE (asso crypto/blockchain/IA) et l'ESSEC Metalab.
- Thème de fond : en juillet 2026, des agents IA sont sortis de leur environnement de test et ont attaqué Hugging Face (identifiants exposés + failles). Message des orgas : il faut former des défenseurs, attaquer et défendre des systèmes agentiques sous pression.
- Tracks :
  - Track 1 « Guardians of Value » : sécuriser systèmes financiers, transactions, actifs numériques. Jury : Team1 (Avalanche), KPMG, KRYPTOSPHERE.
  - Track 2 « Defenders Augmented » : l'IA au service de la cyber, et sécuriser l'IA elle-même. Jury : GitGuardian, ESSEC Metalab, KPMG.
  - Track 3 « Uncharted Frontiers » : défis cyber nouveaux, hors catégories. Jury : Bpifrance, ESSEC Alumni, UTOPIA.
- Critères probables (édition 2025) : qualité du pitch, innovation, implémentation technique, MVP qui fonctionne.

## Mon projet : PayGuard
- Track choisi : **1 « Guardians of Value »** (jury Avalanche Team1, KPMG, KRYPTOSPHERE).
- Problème en une phrase : les protocoles de paiement par agents signent la transaction, pas la décision ; un agent manipulé par une page piégée fait un paiement « valide » mais non voulu.
- Solution : un plugin MCP que l'agent appelle pour payer. PayGuard vérifie (mandat + contexte + injection), exécute lui-même sur Avalanche Fuji si OK, met en attente ou bloque sinon, grave chaque décision on-chain, kill switch manuel et automatique (contrat en pause).
- Pour qui : entreprises qui confient des achats/paiements à des agents IA (PME, DAF, équipes plateforme), et à terme assureurs/auditeurs qui veulent la preuve.
- Démo en 3 minutes : Claude Desktop achète chez un marchand légitime (APPROVED, tx Fuji) puis chez un marchand piège (BLOCKED, injection détectée), un HOLD confirmé sur le dashboard, kill switch auto après 3 blocages, panneau conformité DORA/MiCA/AML-CFT/AI Act. Détail dans `DEMO.md`.
- Hors scope : fine-tuning, vraie banque, multi-devises, détection vocale, mobile, mainnet.
- Documents de référence : `docs/API.md` (contrat, source de vérité), **`docs/BUILD_ORDER.md` (ordre de construction étape par étape, mode une machine)**, `docs/PLAN.md` (cadrage), `docs/COMPLIANCE.md`, `docs/prompts/` (prompts détaillés).

## Règles de travail pour Claude
1. **La démo d'abord.** On construit le chemin principal de bout en bout avant toute fonctionnalité secondaire. Une chose qui marche vaut mieux que cinq à moitié faites.
2. **Petits pas vérifiés.** Après chaque étape qui fonctionne : tu vérifies (preview, test, commande), puis tu fais un commit git avec un message clair.
3. **Stack simple et connue.** Privilégie des outils très documentés. Pas de nouvelle dépendance exotique sans me demander.
4. **Zéro secret dans le code.** Clés et tokens dans `.env` uniquement, `.env` dans `.gitignore`, un `.env.example` sans valeurs. (GitGuardian est dans le jury.)
5. **Testnet uniquement.** Jamais de mainnet, jamais de vrais fonds, jamais ma clé privée personnelle. Wallets de test dédiés au hackathon.
6. **Cadre défensif.** On construit des protections, de la détection, des simulations d'attaque sur nos propres systèmes de démo. Rien contre des systèmes tiers réels.
7. **Si un truc bloque plus de 20 minutes,** propose-moi une alternative plus simple plutôt que de t'acharner.
8. **Tiens à jour** `README.md` (quoi, pourquoi, comment lancer) et `DEMO.md` (script minute par minute de la démo).
9. **Gel des fonctionnalités** : quand je dis « freeze », plus aucune nouvelle feature, uniquement fiabilité, polish et préparation de la démo.

## Journal des décisions
(Claude ajoute ici une ligne par décision importante : date/heure, décision, raison.)
- 2026-10-10 21:45 — Projet **PayGuard**, Track 1. Hybride des pistes « PayGuard » et « MandateWall » du rapport : scénario agent acheteur (faux site vs site légitime) pour rester fidèle aux notes de l'équipe, exécution réelle en AVAX test via un contrat Fuji parce que les orgas demandent un usage « preuve / traçabilité » de la chaîne.
- 2026-10-10 21:45 — Stack tout TypeScript (Next.js 15 + Prisma/SQLite, SDK MCP, viem, Hardhat). Raison : un seul langage pour 4 personnes qui codent avec l'IA, SDK MCP et viem excellents en TS.
- 2026-10-10 21:45 — Démo dans Claude Desktop via MCP, avec `apps/demo-agent` (SDK Anthropic) en plan B. Raison : effet « plugin » devant le jury, filet si l'hôte hésite en live.
- 2026-10-10 21:45 — Contrat unique `PayGuardLedger` (pay / record / pause). Raison : le kill switch devient on-chain, les refus sont aussi des preuves, une seule adresse à montrer.
- 2026-10-10 21:45 — Règles déterministes en première ligne, LLM uniquement pour l'explication en français (cache + fallback). Raison : zéro aléa en démo.
- 2026-10-10 21:45 — Freeze fixé à H+8 (≈ 06:00 dimanche). Pitch 12:00.
- 2026-10-10 22:30 — Vincent prend le **dashboard (front)** ; Dev A garde API + moteur + base. Frontière dans `apps/web` : `api/`, `lib/`, `prisma/` à Dev A ; `(dashboard)/`, `components/`, `fixtures/` à Vincent. Raison : Vincent veut une part de dev et le dashboard est la partie produit ; le juridique réduit à `compliance.rules.json` (1 h).
- 2026-10-10 23:00 — **Tout se construit sur la machine de Vincent, en séquence** (voir `docs/BUILD_ORDER.md`). Ordre : cerveau (moteur testable) → chemin complet avec mocks → chaîne Fuji → dashboard → fiabilité. Raison : une démo mockée complète existe dès l'étape 4, la blockchain ne peut plus tout bloquer. Dépôt GitHub privé créé : https://github.com/Vince690/secure-horizons
- 2026-10-10 23:40 — `PROMPT_INJECTION_SUSPECTED` devient une **règle terminale** (BLOCKED direct, −70). Raison (équipe) : une page qui donne des ordres à l'agent est par nature malveillante, −40 était trop léger.
- 2026-10-11 00:10 — Détection renforcée (étape 4) : le lecteur de page **marque** le texte invisible pour un humain (`[[HIDDEN …]]`, `[[COMMENT]]`) et le gardien ajoute 4 règles de cohérence page / demande (`HIDDEN_INSTRUCTIONS` terminale, `PAGE_PRICE_MISMATCH`, `PAGE_ADDRESS_MISMATCH`, `PAGE_PRODUCT_MISMATCH`). Raison : « l'ordre était invisible pour l'humain, visible pour l'agent » est l'argument central de la démo.
- 2026-10-11 00:50 — **Contrat déployé sur Fuji** : `PayGuardLedger` à `0xb1ee492a58e1163e47e2f10a386edb80af3f9ce1`, wallet gardien dédié `0xCc86BB75d603aA474dddA53930cf4252C6257764` (clé dans `.env` seulement). API en `CHAIN_MODE=fuji`. `min_balance` par défaut passé de 0,5 à 0,1 AVAX pour coller aux fonds de test disponibles.
- 2026-10-11 01:40 — Dashboard livré (étape 6) : routes `/api/dashboard/*` avec session cookie signée, pages login / vue d'ensemble / à confirmer / décisions / détail / mandat / clés API / audit, kill switch dans l'en-tête. Thème sombre, polices système (pas de Google Fonts, pour marcher hors ligne). Approbation d'un HOLD = `pay()` sous `<id>:approved`, rejet = `record(<id>:rejected, 3)`.
