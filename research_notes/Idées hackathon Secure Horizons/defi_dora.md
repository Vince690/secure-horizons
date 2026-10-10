# Real-time on-chain exploit detection + DORA incident reporting on Avalanche Fuji — feasibility notes (as of 2026-10-10)

## Q1. Problem size: DeFi/crypto losses 2025–2026, time-to-drain

### Takeaway
2025 was a record year (~$2.7–3.4B stolen depending on counter, dominated by the $1.5B Bybit/DPRK theft); H1 2026 shows fewer dollars (~$1.0–1.3B) but a record number of incidents (207–344). The big drains happen in minutes (Drift ~$285M in <12 min; Balancer $128M in <30 min), and the damage has shifted from smart-contract bugs to key compromise / privileged access / infra — which argues for runtime monitoring + pause, not just audits.

### Cited Findings
- Chainalysis "2026 Crypto Crime Report" (18 Dec 2025): ~$3.4B stolen in 2025, DPRK ~59% / ≥$2.02B (+51% YoY), DPRK attack count −74% but larger per attack — figures seen only on mirror sites, primary page not retrieved — [mirror](https://www.energy001.it.com/cvhc-p/pfhqs/mmo.html) (UNVERIFIED); a TechCrunch-sourced piece gives a lower combined Chainalysis/TRM figure of $2.7B (vs $2.2B in 2024) — [DeepStrike](https://deepstrike.io/blog/web3-security-statistics)
- CertiK 2025: $3.353B across 630 incidents — [DeepStrike](https://deepstrike.io/blog/web3-security-statistics)
- Chainalysis H1 2025: $2.17B stolen, Bybit ~$1.5B attributed by FBI to DPRK (TraderTraitor); without Bybit H1 2025 ≈ $600M — [The Record](https://therecord.media/chainalysis-crypto-stolen-billions)
- TRM H1 2025: ~$2.1B across 75 hacks, >80% via "infrastructure exploits" (key/seed/front-end) — [Cointelegraph](https://cointelegraph.com/news/seed-phrase-front-end-hacks-drive-2025-record-crypto-loss)
- H1 2026 CertiK: $1.316B across 344 incidents (−47% YoY); Q2 2026 $807.5M (+59% QoQ); KelpDAO + Drift Protocol >70% of Q2 — [Forklog](https://forklog.com/en/certik-says-crypto-hack-losses-hit-1-32b-in-h1-2026/); [Forbes](https://www.forbes.com/sites/boazsobrado/2026/07/17/fewer-but-far-more-surgical-crypto-hacks-hit-13-billion-in-2026/)
- H1 2026 Immunefi: $972M across 207 hacks (record count); damage now from infra failures, private-key compromise, cross-chain config errors, privileged access; flash-loan attacks "a fraction of a percent"; DeFi full-year 2025 $680.3M — [The Block](https://www.theblock.co/news/ecosystems/2026-07-09-crypto-hack-losses-fall-below-1-billion-in-h1-2026-even-as-attack-volume-hits-record-immunefi-407707)
- Drift Protocol (Solana, Apr 2026): ~$285M drained in <12 minutes via compromised admin key + fake token/oracle, no timelocks — [Autheo](https://www.autheo.com/signals/drift-protocol-285m-exploit-april-2026); Oak Security: root cause was a compromised privileged key — [Decrypt](https://decrypt.co/363176/drift-protocol-285-million-exploit-solana-defi-security)
- Balancer (Nov 2025): $128M drained in <30 minutes — [ThreatCluster](https://threatcluster.io/cluster/attackers-drain-128m-from-balancer-pools-in-30-minutes-937e01fd)
- Aftermath Finance (Sui, Jul 2026): ~$1.1M over 11 txs / 36 minutes, then protocol paused — [StartupFortune](https://startupfortune.com/aftermath-finances-sui-exploit-shows-how-fast-a-small-accounting-bug-can-become-a-real-defi-run/)
- ERC-7265 rationale: protocols rarely see >25% sudden drawdown except during a hack — [Blockworks](https://blockworks.co/news/defi-circuit-breaker-stop-hacks)
- Hexagate (per Chainalysis CEO at acquisition): detected "all known hacks" over 2 years, >98% before they happened — vendor claim — [Decrypt](https://decrypt.co/297729/chainalysis-scoops-up-blockchain-security-firm-hexagate-amid-surge-in-crypto-hacks)

### Inferences
- A demo attack that drains over several transactions / blocks (not a single atomic flash-loan tx) is realistic and is the only case where "pause in time" is credible; atomic single-tx exploits cannot be paused reactively.
- Pitch the shift in attack vectors: a multi-block drain by a compromised admin key is both the 2026 pattern and the pausable case.

### Gaps
- No peer-reviewed dataset of "median time from first malicious tx to full drain" or "% of exploits that a pause would have stopped" was found; only anecdotes. Treat "share pausable" as unknown.

## Q2. Existing vendors and their gaps

### Takeaway
The market is crowded at the top (Hypernative 350+ customers / $100B protected; Hexagate inside Chainalysis; OpenZeppelin open-sourcing Monitor/Relayer), but nobody found connects on-chain detection to a DORA classification/report. The gaps are: regulatory output, explainability, false positives of rate limiters, and small protocols that cannot afford enterprise contracts.

### Cited Findings
- Hypernative: 350+ customers, $100B+ protected across 75+ chains, >$3B losses prevented (self-reported) — [Hypernative](https://www.hypernative.io/about); third-party profile says 250+ customers (conflict) — [Web3Connect](https://web3connect.com/partner/hypernative); Transaction Guard pre-screens every tx; customers Morpho, Steakhouse on Robinhood Chain — [Hypernative blog](https://www.hypernative.io/insights/blog/hypernative-brings-real-time-security-to-robinhood-chain)
- Hypernative's own DORA post (9 Jun 2026) targets "financial entities with significant crypto exposure" and CASPs; mentions NO classification or report-prefill feature; ties products to MiCA, not DORA timelines — [Hypernative](https://www.hypernative.io/blog/dora-doesnt-ask-whether-you-had-a-security-incident-it-asks-whether-you-knew-in-time)
- Hexagate acquired by Chainalysis (19 Dec 2024, est. ~$60M, ~20 staff, customers Coinbase, Consensys, >$1B saved claimed) — [Cointelegraph](https://cointelegraph.com/news/chainalysis-acquires-web3-security-firm-hexagate); [Ynet](https://ynetnews.com/business/article/s1yadtlhkx)
- OpenZeppelin: hosted Defender retired 1 Jul 2026; Monitor + Relayer open-sourced (AGPL v3), production-ready, any EVM chain, self-hosted (Redis/Docker) — [OpenZeppelin](https://www.openzeppelin.com/news/doubling-down-on-open-source-and-phasing-out-defender); [FAQ](https://www.openzeppelin.com/news/defender-sunset-faq); [KeeperHub migration guide (competitor)](https://docs.keeperhub.com/guides/defender-migration)
- Rate-limiter false-positive trade-off: "a rate limiter tight enough to stop an attacker … is also tight enough to stop a liquidator" — [Kuna Labs](https://kunalabs.io/blog/exploit-defense-stack/)
- Circle on Drift: urges circuit breakers; attacker bridged $230M to Ethereum — [Whale Alert](https://whale-alert.io/stories/95a40119983a6a/Drift-Protocol-governance-exploit-drains-270285M-attacker-swaps-to-USDC-and-bridges-230M-to-Ethereum-as-Circle-defends-freeze-policy-and-urges-circuit-breakers-and-faster-legislation)

### Inferences
- OpenZeppelin Monitor (open source) is the fastest credible watcher to reuse; alternatively a 50-line viem/ethers poller is enough for a demo.
- "Prefilled DORA report from on-chain evidence" is the white space: vendors sell detection and evidence logs, not the regulator-facing artefact.

### Gaps
- No pricing found for Hypernative/Cyvers/Venn/Forta Firewall; Forta Firewall, Cyvers, Venn, Ironblocks, Spherex, Guardrail, Zircuit, Blocksec Phalcon, Chaos Labs not covered by the searches (budget exhausted) — status/customers unverified.
- ERC-7265 (Circuit Breaker): both eips.ethereum.org and ercs.ethereum.org returned 404; from prior knowledge it is a 2023 Draft (rate-limit on token outflows with grace period) — UNVERIFIED, check github.com/ethereum/ERCs.

## Q3. DORA: criteria, deadlines, scope, tooling, templates

### Takeaway
Classification and timelines are fully specified in law (RTS 2024/1772 Art. 8–9; Del. Reg. 2025/301 Art. 5; ITS 2025/302 templates ≈100+ fields), MiCA-authorised CASPs are in scope, and no tool found fully automates ESA templates "out of the box" — so an AI prefill mapped field-by-field to the official template is defensible if it cites each field's evidence and keeps a human sign-off.

### Cited Findings
- Major incident test (Art. 8 RTS 2024/1772): affects critical services AND (Art. 9(5)(b) data threshold met OR ≥2 other thresholds); recurring incidents ≥2× in 6 months with same root cause aggregate — [Springlex Art. 8](https://www.springlex.eu/en/packages/dora/rts-ic-regulation/article-8/); ESA final report — [EBA PDF](https://eba.europa.eu/sites/default/files/2024-01/4f2654f4-3152-48b6-af01-431215400f9f/JC%202023%2083%20-%20Final%20Report%20on%20draft%20RTS%20on%20classification%20of%20major%20incidents%20and%20significant%20cyber%20threats.pdf)
- Thresholds (Art. 9): clients >10% or >100,000; counterparts >30%; transactions >10% of daily avg number or value; duration >24h or downtime >2h on critical/important functions; ≥2 Member States; data-loss impact or successful malicious unauthorised access; economic impact >EUR 100,000 — [Springlex Art. 9](https://www.springlex.eu/en/packages/dora/rts-ic-regulation/article-9/)
- Deadlines (Del. Reg. 2025/301 Art. 5): initial ≤4h after classification as major and ≤24h after awareness; intermediate ≤72h after initial; final ≤1 month after (latest) intermediate; forms/procedures in Impl. Reg. 2025/302; ESAs issued operational instructions dated 16 Sep 2026 — [Legiscope](https://www.legiscope.com/blog/dora-incident-reporting.html). (sota.io cites "2024/2845" and Latvia cites "2024/2956" — conflicting numbering; Legiscope's 2025/301–302 matches the OJ Feb 2025 publication as far as I know; verify on EUR-Lex.)
- Template size: 100+ data elements across three phases; ~27 mandatory initial fields (LEI, detection/classification timestamps, affected services, client count, financial impact…); no tool scored (PagerDuty, ServiceNow, Xurrent, ilert…) natively fills the ITS templates; most NCAs still require direct submission — [sota.io](https://sota.io/blog/dora-incident-reporting-requirements-automation-tools-2026) (vendor)
- Scope includes MiCA-authorised CASPs; CASPs report to the MiCA-designated national authority, which forwards to ESMA — [Hacken](https://hacken.io/discover/digital-operational-resilience-act/); [LegalNodes](https://legalnodes.com/article/dora-compliance)
- National practice: Latvijas Banka requires XLSX submissions using its templates — [Latvijas Banka](https://www.bank.lv/en/operational-areas/supervision/ict-security-and-cyber-risks/incident-reporting); Dutch AFM publishes a DORA ICT-notification instruction for crypto firms via portaal.afm.nl — [AFM PDF](https://www.afm.nl/~/profmedia/files/doelgroepen/cryptopartijen/2025/instruction-ict-notifications-dora.pdf) (text not extractable)
- Draft template field list (Annex I) in the ESAs' consultation/final reports — [ESMA JC 2023 70](https://www.esma.europa.eu/sites/default/files/2023-12/JC_2023_70_-_CP_on_draft_RTS_and_ITS_on_major_incident_reporting_under_DORA.pdf)
- Tooling claims: "Incident Oracle" MCP server claims classification vs RTS 2024/1772 + report generation — [MCP Market](https://mcpmarket.com/server/incident-oracle); Copla assesses incidents vs thresholds — [Copla](https://copla.com/blog/compliance-regulations/what-is-dora-incident-classification-defining-the-framework-for-ict-disruptions/); manual report workflows take 90–150 min — [D3 Security](https://d3security.com/resources/automating-dora-compliance/); indicative software pricing EUR 5–20k/yr (small PIs) to 30–100k/yr (regional banks) — [Legiscope](https://www.legiscope.com/blog/best-dora-compliance-software.html)
- KPMG: advisory on DORA/MiCA for CASPs (ESMA common supervisory action), no software product found — [KPMG Cyprus](https://kpmg.com/cy/en/insights/risk-and-regulation/esma-s-common-supervisory-action-on-casps.html)

### Inferences
- Credibility with KPMG: show the Art. 8 logic explicitly (critical service + 2 thresholds), compute each threshold from on-chain data (value drained vs daily avg → "transactions >10%", EUR>100k, downtime from pause), cite the article per field, and mark LLM-generated narrative fields as "draft, requires human validation". Never claim it "files" the report.
- Target user to name: a MiCA-licensed CASP or a tokenisation platform running its own contracts (DORA entity), not an anonymous DeFi DAO (not a DORA entity).

### Gaps
- No official ESA XLSX/XBRL download page located; whether a single EU-wide template file exists vs NCA-specific versions is unresolved. No independent review of any DORA auto-classification tool found.

## Q4. Avalanche specifics (Fuji, tooling, Team1, 2026 priorities)

### Takeaway
Fuji is standard EVM (chain 43113, public RPC, ~1s finality), faucet needs a mainnet balance or a Guild coupon, and Avalanche's 2026 story is payments (x402, Payments Collective), institutional tokenisation and AI agents — a "guardian for tokenised-asset contracts" framing fits. Team1 appears to be a Foundation community/grants program, not a venture fund.

### Cited Findings
- Fuji C-Chain: chain ID 43113, RPC https://api.avax-test.network/ext/bc/C/rpc, explorer https://explorer-test.avax.network/c-chain — [Avalanche docs](https://build.avax.network/docs/quick-start/networks/fuji-testnet)
- Faucet: mainnet AVAX balance >0 lets you claim directly, otherwise Guild coupon; up to 2 Fuji AVAX/day, 1 request/2h — [Avalanche docs](https://docs.avax.network/dapps/smart-contract-dev/get-test-funds); [Support](https://support.avax.network/en/articles/6639882-core-web-how-do-i-use-the-test-faucet)
- x402 agent payments on C-Chain, ~1s finality; Helicon upgrade on Fuji 28 Jul 2026 — [Avalanche Academy](https://docs.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/01-why-avalanche); Hack2Build "Payments x402" hackathon — [Avalanche](https://docs.avax.network/events/5ce3a8c2-21db-40fa-b40f-f82ecdde99db)
- Payments Collective (Q2 2026, 28 orgs); Progmat migrated all digital securities (>JPY 452B) to an Avalanche L1 — [Nansen Q2 2026](https://nansen.ai/post/avalanche-q2-2026-report); [Avalanche Japan blog](https://www.avax.network/about/blog/where-tradition-meets-innovation-avalanches-growing-influence-in-japan)
- Team1: Avalanche Foundation community program (450+ members, 40+ countries, 6 chapters), applications opened 27 May 2026 — [Avalanche](https://www.avax.network/about/blog/avalanche-team1-applications-are-now-open); Builder Grants (Mini ≤$10k, Accelerator ≤$30k) launched 1 Jul 2026, $1.15M Foundation grant Dec 2024 — [CryptoBriefing](https://cryptobriefing.com/avalanche-team1-builder-grants-program/) (third-party)
- Avalanche bug bounty up to $10k/critical — [HackenProof](https://hackenproof.com/blog/for-hackers/avalanche-bug-bounty-reward); Summit LATAM hackathon $50k pool, tracks Build a Product / Interoperability / Open Innovation (no security track) — [Avalanche Academy](https://academy.avax.network/hackathon)

### Inferences
- The brief's "Team1 (Avalanche venture fund)" is likely a mislabel; expect a builder/ecosystem jury that rewards something deployable on Avalanche and aligned with payments/tokenisation.

### Gaps
- No Avalanche hackathon security-track winners (2025–2026) found. Snowtrace/Routescan Fuji API not confirmed by the searches (testnet.snowtrace.io exists from prior knowledge — unverified). No WebSocket endpoint listed on the docs page.

## Q5. Feasibility in ~18h and honest verdict

### Takeaway
Technically low-risk: Foundry + OpenZeppelin Pausable + a viem poller + an LLM classifier + a DORA-mapped JSON→report is a one-night build. The novelty is NOT the monitor (Hypernative/Hexagate own that) but the chain "on-chain evidence → Art. 8/9 classification → prefilled 2025/302 template → 4h/72h/1-month countdown → critical-provider map", which no vendor found offers.

### Cited Findings
- OpenZeppelin Monitor/Relayer open source for any EVM chain — [OpenZeppelin](https://www.openzeppelin.com/news/doubling-down-on-open-source-and-phasing-out-defender)
- Multi-block drains of 12–36 min exist (Drift, Balancer, Aftermath) — see Q1 sources
- Rate limiters cause false positives for liquidators — [Kuna Labs](https://kunalabs.io/blog/exploit-defense-stack/)

### Inferences
- Build order: (1) vulnerable Vault.sol with admin-key abuse or multi-tx price-manipulation drain, Pausable + guardian role, deploy on Fuji with Foundry; (2) attacker script draining over 5–10 txs; (3) watcher polls logs/balance every block, rule (outflow >X% of TVL in N blocks) + LLM explanation; (4) auto-pause via guardian key from .env; (5) classifier computes Art. 9 thresholds, outputs initial-notification JSON with ~27 fields + countdown timers; (6) dependency map (RPC provider, oracle, bridge, custodian) as the DORA ICT third-party angle.
- Risks: Fuji faucet gating (get a coupon/mainnet dust before the event); RPC rate limits (use a QuickNode/Alchemy free tier as backup); LLM hallucinating regulatory fields (constrain to the official field list, cite article per field); over-claiming "DORA compliant".
- Jury reality: a crypto-ecosystem jury will see "another monitoring dashboard" as déjà-vu; the differentiator for KPMG/Kryptosphère is the regulatory artefact and the explicit "who is the DORA entity" (CASP/tokenisation platform), plus a live pause on Fuji.

### Gaps
- No source quantifies how many hackathon projects in this niche exist; competitiveness judgment is inference only.
