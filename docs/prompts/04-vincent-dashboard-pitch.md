# Prompt 04 — Vincent : dashboard (front) + conformité légère + pitch

> Coller d'abord le prompt 00, puis ceci. Branche : `feat/dashboard`. Claude Code ouvert à la racine.
> **Au kickoff, avant tout le monde** : c'est toi qui crées le squelette Next.js (étape 1), tu le pousses sur `main`, puis chacun part de là.

```
Mon périmètre : dans apps/web, UNIQUEMENT src/app/(dashboard)/**, src/app/login/, src/app/signup/, src/app/page.tsx, src/components/**, src/fixtures/**, plus docs/COMPLIANCE.md, docs/compliance.rules.json, DEMO.md et les slides. Dev A possède src/app/api/**, src/lib/** et prisma/ : je n'y touche jamais. Je ne suis pas développeur : explique chaque choix en 1-2 phrases simples, et préfère des solutions visuelles simples à des abstractions.

Étape 1, kickoff (15 min, à faire AVANT que les autres commencent) :
1. Crée l'app : `npx create-next-app@latest apps/web --ts --app --tailwind --eslint --src-dir --import-alias "@/*" --use-npm`, ajoute la dépendance workspace "@payguard/shared": "*", vérifie que `npm run dev -w apps/web` affiche la page d'accueil, crée les dossiers vides src/app/(dashboard)/dashboard, src/app/api, src/lib, src/components, src/fixtures avec un .gitkeep chacun. Commit « Scaffold apps/web » et je pousse sur main immédiatement.

Objectif H+3 (toutes les pages sur données factices) :
2. src/fixtures/ : des données factices TYPÉES avec @payguard/shared (Decision[], SpendingPolicy, KillSwitchState, BalanceResponse, AuditEntry[]), réalistes et cohérentes avec la démo de docs/PLAN.md : une décision APPROVED 92 vers NordSound, une BLOCKED 12 vers N0rdSound avec les raisons DOMAIN_LOOKALIKE, PROMPT_INJECTION_SUSPECTED, RECIPIENT_UNKNOWN, AMOUNT_OVER_TX_LIMIT, une HOLD 58 en PENDING_CONFIRMATION, de faux hashes de tx Fuji.
3. Une couche d'accès src/components/data/ (ou src/app/(dashboard)/_data.ts) avec des fonctions getDecisions(), getPolicy(), etc. qui lisent les fixtures si NEXT_PUBLIC_USE_FIXTURES=true, sinon appellent les routes de docs/API.md §4 avec fetch. Comme ça, le jour où Dev A livre ses routes, je ne change qu'une variable d'environnement.
4. Pages, Tailwind, sobres, lisibles pour un jury à 3 mètres de l'écran (gros chiffres, contrastes forts, mode sombre) :
   - /login et /signup (email, mot de passe, nom de l'entreprise), formulaire simple.
   - /dashboard : en-tête avec le nom du compte, le solde Fuji, un GROS bouton rouge KILL SWITCH avec confirmation intégrée dans la page (pas de window.confirm) qui devient « RÉARMER » quand actif ; quatre tuiles DORA / MiCA / AML-CFT / AI Act en vert / orange / rouge ; les 5 dernières décisions.
   - /dashboard/policy : formulaire SpendingPolicy (plafond par achat, par jour, solde plancher, seuils de score, seuil de confirmation, listes de bénéficiaires et domaines de confiance) avec explication d'une ligne sous chaque champ.
   - /dashboard/api-keys : créer une clé, l'afficher UNE fois avec un bouton copier, lister et révoquer.
   - /dashboard/approvals : file des HOLD avec Approuver / Rejeter, le score et les raisons visibles sans cliquer.
   - /dashboard/decisions : tableau, score coloré (vert ≥ 70, orange 40-69, rouge < 40), verdict en pastille, montant, marchand, lien Snowtrace.
   - /dashboard/decisions/[id] : détail : score, raisons avec leur phrase en français et les cadres cités, l'explication, le hash de décision, les deux liens on-chain, le statut.
   - /dashboard/audit : liste des AuditEntry avec une pastille « chaîne intègre ».
   Un composant par brique réutilisable (ScoreBadge, VerdictPill, FrameworkTile, ReasonList, ExplorerLink).
5. Les pages se rafraîchissent toutes les 3 s (polling simple côté client) pour que la démo soit vivante.

Objectif H+6 (branchement) :
6. Passe NEXT_PUBLIC_USE_FIXTURES=false, teste chaque page contre les routes de Dev A. Si une réponse ne correspond pas à docs/API.md, écris-moi un message prêt à coller pour Dev A (« route, champ attendu, champ reçu ») : c'est lui qui corrige, pas moi.
7. Joue le rôle du dirigeant de bout en bout (créer un compte, régler le mandat, générer la clé, approuver un HOLD, déclencher le kill switch) et corrige tout ce qu'un non-technicien ne comprendrait pas.

En parallèle, conformité légère (1 h max, pas plus) :
8. docs/compliance.rules.json : pour chaque code de règle de docs/API.md §5, { frameworks: [], label_fr: "phrase de 15 mots max pour le dashboard" }. Vérifie en recherche web les articles déjà cités dans docs/COMPLIANCE.md (AI Act art. 12 et 14, DORA art. 17 et 19) et marque le reste « non vérifié » plutôt que de chercher longtemps. Dev A importe ce JSON tel quel dans le moteur.

Au freeze (H+8) :
9. DEMO.md minute par minute, ajusté à ce qui marche vraiment dans Claude Desktop (lire apps/mcp-server/README.md). Slides sobres, 6 max, avec la phrase obligatoire : PayGuard n'est pas un prestataire de services de paiement, il outille la conformité. Vérification secrets : `git ls-files | grep -E "\.env$"` vide, et `git log -p | grep -iE "sk-ant|0x[a-f0-9]{64}"` vide.

Ne fais PAS : les routes API, le moteur de décision, Prisma, le contrat, le serveur MCP.
```
