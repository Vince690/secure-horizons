# @payguard/chain — PayGuardLedger on Avalanche Fuji

- `contracts/PayGuardLedger.sol` : `pay()` (paie + ancre le hash), `record()` (ancre HOLD / BLOCKED / REJECTED, même en pause), `activateKillSwitch()` / `deactivateKillSwitch()` (Pausable), `getDecision()`.
- `client/` : implémentation viem de l'interface `ChainClient` de `@payguard/shared`, importée par `apps/web` quand `CHAIN_MODE=fuji`.
- `scripts/deploy.ts` : déploie sur Fuji, fait un premier paiement de 0.001 AVAX, écrit `deployments/fuji.json`.
- `scripts/verify-decision.ts` : recalcule le hash d'une décision et le compare à l'ancrage on-chain (« INTÈGRE » / « ALTÉRÉE »).

```bash
npm run test -w packages/contracts            # 5 tests Hardhat sur réseau local
npm run deploy:fuji -w packages/contracts     # nécessite GUARDIAN_PRIVATE_KEY dans le .env racine
npm run verify-decision -w packages/contracts -- dec_xxx
```

Testnet uniquement : `hardhat.config.ts` ne connaît que `hardhat` et `fuji` (43113). Le script de déploiement refuse tout autre chainId.
