# PayGuard — le gardien entre un agent IA et son argent

Hackathon **Secure Horizons** (ESSEC Cergy, 10–11 octobre 2026), Track 1 « Guardians of Value ».

## Quoi
Un plugin MCP qu'un agent IA appelle quand il veut payer. PayGuard vérifie la demande contre le mandat donné par l'humain (plafonds, solde plancher, bénéficiaires de confiance) et contre le contexte (page lue, conversation, injection de prompt), puis :
- **APPROVED** : exécute lui-même le paiement en AVAX test sur Avalanche Fuji et grave le hash de la décision on-chain ;
- **HOLD** : attend une confirmation humaine sur le dashboard ;
- **BLOCKED** : refuse, explique en français, grave le refus on-chain.
Un **kill switch** (manuel ou automatique) met le contrat en pause : plus aucun paiement ne sort, même si l'API est compromise.

## Pourquoi
Les protocoles de paiement par agents signent la transaction, pas la décision. Un agent manipulé par une page piégée fait un paiement « valide » mais non voulu. PayGuard contrôle la décision, produit la preuve, et outille DORA, MiCA, AML/CFT et l'AI Act.

## Structure
```
apps/web            Next.js 15 : dashboard + API (/api/v1, /api/dashboard), Prisma/SQLite, moteur de décision
apps/mcp-server     serveurs MCP « payguard » et « demo-shop » (stdio)
apps/merchants      2 pages marchands de démo (légitime :4001, piège :4002), serveur Node sans dépendance
apps/demo-agent     script de secours qui rejoue la démo sans Claude Desktop
packages/contracts  PayGuardLedger.sol (Hardhat, Fuji 43113) + client viem
packages/shared     types TypeScript communs
docs/               API.md (contrat), PLAN.md, COMPLIANCE.md, prompts/
```

## Lancer (à compléter au fil de la nuit)
```bash
cp .env.example .env            # remplir, ne jamais commiter
npm install
npm run db:push -w apps/web     # crée la base SQLite (apps/web/prisma/dev.db)
npm run db:seed -w apps/web     # compte demo@payguard.dev / demo1234, affiche la clé API UNE fois
#   -> copier la clé dans .env : PAYGUARD_API_KEY=pg_test_...  (les resets suivants la réutilisent)
npm run dev:web                 # http://localhost:3000
bash apps/web/scripts/curl-demo.sh   # rejoue légitime / piège / HOLD contre l'API
npm run dev:merchants           # :4001 et :4002 (étape 4)
# Claude Desktop : voir apps/mcp-server/README.md pour la config (étape 3)
```
Le journal d'audit interne s'écrit dans `apps/web/logs/audit.jsonl` (ignoré par git), en plus de la base.

## Contrat déployé (Fuji C-Chain, chainId 43113)
| Contrat | Adresse | Explorer |
|---|---|---|
| PayGuardLedger | `0xb1ee492a58e1163e47e2f10a386edb80af3f9ce1` | https://testnet.snowtrace.io/address/0xb1ee492a58e1163e47e2f10a386edb80af3f9ce1 |
| Wallet gardien (owner) | `0xCc86BB75d603aA474dddA53930cf4252C6257764` | https://testnet.snowtrace.io/address/0xCc86BB75d603aA474dddA53930cf4252C6257764 |

Déployé le 11 octobre 2026, détails dans `packages/contracts/deployments/fuji.json`. Premier paiement de test : https://testnet.snowtrace.io/tx/0xb78631b431adde45bacf13f8a520f821bbbb7a94d8b42b58ebca0d45e9f9aea6

## Sécurité
- Testnet uniquement, wallet dédié hackathon, aucune clé personnelle.
- Secrets dans `.env` seulement (`.env.example` sans valeurs).
- PayGuard n'est pas un prestataire de services de paiement ; la démo exécute sur testnet, la production recommande.
