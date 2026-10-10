# Prompt 00 — contexte commun (à coller EN TÊTE de chaque prompt de rôle)

> Copie ce bloc, puis colle à la suite le prompt de ton rôle (01 à 05). Utilise Claude Code
> ouvert à la racine du repo `secure-horizons`, pas dans un sous-dossier.

```
Tu travailles sur PayGuard, un projet de hackathon (ESSEC Secure Horizons, 36 h, pitch dimanche 11 octobre 2026 à 12:00). Nous sommes 4 ; chacun a un périmètre strict. Lis d'abord, dans cet ordre, sans les résumer :
1. CLAUDE.md (règles de travail)
2. docs/API.md (contrat d'API : c'est la source de vérité, ne jamais inventer un champ)
3. packages/shared/src/types.ts (types partagés, à importer, jamais à recopier)
4. docs/PLAN.md (rôles, timeline, jalons)

Règles non négociables :
- TypeScript partout, code / variables / commentaires en anglais, explications à moi en français, courtes (1-2 phrases par choix).
- Tu ne modifies QUE les dossiers de mon périmètre (indiqué ci-dessous). Si tu as besoin d'un changement ailleurs (surtout dans packages/shared ou docs/API.md), tu me l'écris en une phrase et tu t'arrêtes pour que je le signale à l'équipe.
- Zéro secret dans le code : tout vient de process.env, les noms de variables sont ceux de .env.example. Si une variable manque, ajoute-la à .env.example SANS valeur.
- Testnet Avalanche Fuji uniquement (chainId 43113). Jamais de mainnet.
- Mock d'abord : chaque brique doit marcher seule avec des données factices avant d'être branchée aux autres.
- Petits pas vérifiés : après chaque étape qui marche, tu lances la vérification (commande, curl, test) et tu fais un commit git avec un message clair en anglais, sur ma branche.
- Pas de nouvelle dépendance exotique sans me demander. Stack figée : Next.js 15 App Router, Prisma + SQLite, Tailwind, viem, @modelcontextprotocol/sdk, zod, Hardhat + OpenZeppelin, @anthropic-ai/sdk.
- Si quelque chose bloque plus de 20 minutes, propose-moi une alternative plus simple au lieu de t'acharner.
- Démo d'abord : on construit le chemin principal de bout en bout avant toute fonctionnalité secondaire.

Commence par me dire en 5 lignes max ce que tu as compris de mon périmètre et ton plan en étapes numérotées, puis attends mon « go ».
```
