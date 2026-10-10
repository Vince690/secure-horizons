# PayGuard — le gardien entre un agent IA et son argent

Hackathon **Secure Horizons** (ESSEC Cergy, 10–11 octobre 2026), Track 1 « Guardians of Value ».

## Quoi
Un plugin MCP qu'un agent IA appelle quand il veut acheter : il vérifie chaque site candidat (`check_merchant`), classe les offres en écartant les sites frauduleux (`find_best_offer`), puis contrôle et exécute le paiement (`request_payment`). PayGuard vérifie la demande contre le mandat donné par l'humain (plafonds, solde plancher, bénéficiaires de confiance) et contre le contexte (page lue, conversation, injection de prompt), puis :
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
apps/merchants      3 pages marchands de démo (légitime :4001, piège :4002, concurrent légitime :4003), serveur Node sans dépendance
apps/demo-agent     démo scriptée (plan B) qui pilote les mêmes serveurs MCP sans LLM ni Claude Desktop
packages/contracts  PayGuardLedger.sol (Hardhat, Fuji 43113) + client viem
packages/shared     types TypeScript communs, hash de décision, interface chaîne, compliance.rules.json
docs/               API.md (contrat), PLAN.md, COMPLIANCE.md, prompts/
```

## Lancer
```bash
cp .env.example .env            # remplir, ne jamais commiter
npm install
npm run db:push -w apps/web     # crée la base SQLite (apps/web/prisma/dev.db)
npm run db:seed -w apps/web     # compte demo@payguard.dev / demo1234, affiche la clé API UNE fois
#   -> copier la clé dans .env : PAYGUARD_API_KEY=pg_test_...  (les resets suivants la réutilisent)
npm run dev:web                 # dashboard + API : http://localhost:3000
npm run dev:merchants           # marchand légitime :4001, marchand piège :4002
npm run demo                    # démo scriptée sans Claude Desktop (plan B) ; npm run demo:all = + HOLD + kill switch
bash apps/web/scripts/curl-demo.sh   # 3 appels bruts à l'API : légitime / piège / HOLD
npm run smoke:mcp               # pilote les 2 serveurs MCP comme Claude Desktop le ferait
# Claude Desktop : config exacte dans apps/mcp-server/README.md
```
Chaîne : `CHAIN_MODE=fuji` (vrai contrat, voir ci-dessous) ou `CHAIN_MODE=mock` (simulateur en mémoire, aucun réseau). Modèle de langage : optionnel, `ANTHROPIC_API_KEY` vide = explications template et règles par motifs uniquement.

Le journal d'audit interne s'écrit dans `apps/web/logs/audit.jsonl` (ignoré par git), en plus de la base.

## Comment ça décide
Score de confiance 100 au départ, chaque signal retire des points (`docs/API.md` §5, 20 règles) : mandat du dirigeant (plafonds, plancher, bénéficiaires), manipulation de l'agent (ordres dans la page, **texte invisible pour un humain**, achat non demandé, prix ou adresse différents de la page), comportement (rafale, prix anormal, adresse sans historique on-chain), et un second avis sémantique par le modèle si une clé est fournie. ≥ 70 APPROVED, 40-69 HOLD (un humain tranche), < 40 BLOCKED. Quatre signaux bloquent seuls : kill switch, liste noire, injection de prompt, instructions invisibles. Trois blocages en dix minutes déclenchent le kill switch automatique, qui met le contrat en pause.

Chaque point retiré est relié à un cadre (DORA, MiCA, AML/CFT, AI Act) et à une référence d'article dans `packages/shared/src/compliance.rules.json`, maintenu par le juriste de l'équipe.

## Contrat déployé (Fuji C-Chain, chainId 43113)
| Contrat | Adresse | Explorer |
|---|---|---|
| PayGuardLedger | `0xb1ee492a58e1163e47e2f10a386edb80af3f9ce1` | https://testnet.snowtrace.io/address/0xb1ee492a58e1163e47e2f10a386edb80af3f9ce1 |
| Wallet gardien (owner) | `0xCc86BB75d603aA474dddA53930cf4252C6257764` | https://testnet.snowtrace.io/address/0xCc86BB75d603aA474dddA53930cf4252C6257764 |

Déployé le 11 octobre 2026, détails dans `packages/contracts/deployments/fuji.json`. Premier paiement de test : https://testnet.snowtrace.io/tx/0xb78631b431adde45bacf13f8a520f821bbbb7a94d8b42b58ebca0d45e9f9aea6

## Feuille de route
Voir `docs/ROADMAP_RAILS.md` : paiements en euros par cartes virtuelles à usage unique créées sur le compte bancaire du client (« connecte ton compte »), Stripe Issuing en second, EURC ; Avalanche reste la couche de preuve et de kill switch. Règle invariante : PayGuard ne détient jamais les fonds et l'agent ne voit jamais un secret.

## Sécurité
- Testnet uniquement, wallet dédié hackathon, aucune clé personnelle.
- Secrets dans `.env` seulement (`.env.example` sans valeurs).
- PayGuard n'est pas un prestataire de services de paiement ; la démo exécute sur testnet, la production recommande.
