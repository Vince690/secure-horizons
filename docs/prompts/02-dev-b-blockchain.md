# Prompt 02 — Dev B : contrat Fuji + client chain (`packages/contracts`)

> Coller d'abord le prompt 00, puis ceci. Branche : `feat/chain`.

```
Mon périmètre : packages/contracts uniquement, puis à H+3 l'intégration de mon client dans apps/web/src/lib/chain/ en coordination avec Dev A (je lui fais une PR, je ne touche pas au reste de apps/web).

Contexte : nous avons déjà un wallet de test Fuji avec des AVAX (GUARDIAN_PRIVATE_KEY dans .env, jamais commitée). Les orgas demandent explicitement d'utiliser la blockchain pour « preuve, traçabilité, logs infalsifiables » et de noter les adresses de contrat dans le repo.

Objectif H+3 :
1. Initialise Hardhat (TypeScript) dans packages/contracts avec @openzeppelin/contracts, réseau "fuji" (FUJI_RPC_URL, chainId 43113, accounts depuis GUARDIAN_PRIVATE_KEY via dotenv). Ajoute un second RPC de secours en commentaire dans .env.example.
2. Écris contracts/PayGuardLedger.sol exactement selon docs/API.md §7 : Ownable + Pausable ; pay(decisionId, to, decisionHash) payable onlyOwner whenNotPaused qui transfère msg.value et émet PaymentExecuted ; record(decisionId, verdict, decisionHash) onlyOwner qui fonctionne même en pause ; activateKillSwitch(reason) / deactivateKillSwitch ; getDecision(decisionId) ; mapping decisionId => (verdict, hash, timestamp) ; refuse les doublons de decisionId. Verdict : 0 = APPROVED (écrit par pay), 1 = HOLD, 2 = BLOCKED, 3 = REJECTED.
3. Tests Hardhat : paiement OK, refus quand paused, record possible quand paused, doublon refusé, onlyOwner.
4. Script de déploiement + vérification sur Snowtrace si possible ; écris l'adresse dans README.md (tableau « Contrat déployé ») et dans .env.example en commentaire. Fais un premier pay() de 0.001 AVAX vers une adresse de test pour que la démo ait déjà une tx visible.
5. Client TypeScript (viem, pas ethers) dans packages/contracts/client/index.ts exporté comme "@payguard/chain" : createChainClient({ rpcUrl, privateKey, contractAddress }) qui renvoie { getBalance(): Promise<string AVAX>, executePayment(decisionId: string, to: `0x${string}`, amountAvax: string, decisionHash: `0x${string}`): Promise<ChainReference>, recordDecision(decisionId, verdict: 1|2|3, decisionHash): Promise<ChainReference>, setKillSwitch(active: boolean, reason: string): Promise<ChainReference>, isPaused(): Promise<boolean>, explorerUrl(txHash): string }. decisionId string => keccak256(toBytes(decision_id)). ChainReference vient de @payguard/shared. Toute erreur RPC est encapsulée en Error avec code CHAIN_ERROR. Timeout 20 s.
6. Un mock du même client (createMockChainClient) qui renvoie de faux hashes, pour que Dev A et Dev C puissent travailler sans réseau.
7. Script packages/contracts/scripts/verify-decision.ts : prend un decision_id et le JSON de décision exporté par l'API, recalcule le hash avec la même formule que apps/web/src/lib/guardian/hash.ts (docs/API.md §6) et le compare à celui stocké on-chain. Affiche « INTÈGRE » ou « ALTÉRÉ ». C'est l'argument « preuve » du pitch.

Objectif H+6 :
8. PR vers Dev A : brancher createChainClient dans apps/web derrière CHAIN_MODE=fuji. Tester le happy path complet avec son script curl.
9. Si le temps le permet : une page /dashboard/proof dans apps/web (après accord de Dev A) qui liste les tx du contrat avec liens Snowtrace et le résultat de verify-decision pour la dernière décision ; un export JSON « dossier de preuve » par décision.

Sécurité : jamais la clé dans un fichier commité, jamais de mainnet dans hardhat.config, pas de faucet mainnet. Si le wallet manque de fonds, dis-le-moi tout de suite (faucet : https://core.app/tools/testnet-faucet/).
```
