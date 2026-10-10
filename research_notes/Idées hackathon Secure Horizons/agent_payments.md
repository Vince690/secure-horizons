# Securing AI-agent payments — state of the art, Oct 2026

## Q1. What do the protocols/products (AP2, Visa TAP, Mastercard Agent Pay, Stripe, x402, Skyfire, Nekuda, Catena, AWS) cover, and what not?

### Takeaway
Incumbents have solved *intent capture + signing + agent identity at checkout*. None ships runtime monitoring, out-of-scope detection, inter-agent authority-chain verification, or a kill switch; those are explicitly left to the integrator.

### Cited Findings
- **AP2 (Google, 16 Sep 2025, 60+ partners incl. Mastercard, PayPal, Coinbase, Revolut, Adyen)**: Intent Mandate (rules: price limits, timing) and Cart Mandate (signed exact items/price), signed as verifiable credentials, producing a "non-repudiable audit trail". Page says nothing on anomaly detection, revocation, kill switch, or general spending controls beyond per-mandate price limits — [Google Cloud](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol)
- **AP2 weakness (arXiv, 10 Sep 2026)**: "Whisper attacks": AP2 signs the transaction but not the decision; plain product text steers the agent into a valid-but-wrong cart. Success rates on Gemini Flash-Lite (AP2 sample default): 90% credential theft, 56% cart mismatch, 73% price escalation; 17 Google models affected. Proposed fix A-VIP binds cart lines to listings seen and flags unauthorised spend — [arXiv 2609.11757](https://arxiv.org/abs/2609.11757)
- **Visa**: Trusted Agent Protocol (Oct 2025, w/ Cloudflare) = signed HTTP headers attesting agent identity, consent, intent; Akamai partnership 17 Dec 2025; "hundreds" of pilot transactions with Nekuda, PayOS, Ramp, Skyfire (18 Dec 2025); FIS Know-Your-Agent for issuers (12 Jan 2026); MPP card support (18 Mar 2026) — [Forrester, 9 Apr 2026](https://www.forrester.com/blogs/agentic-payments-in-b2c-commerce-where-we-are-now/)
- **Mastercard Agent Pay**: first EU live agent payment with Santander/PayOS, 2 Mar 2026, "not a commercial rollout" — [Forrester](https://www.forrester.com/blogs/agentic-payments-in-b2c-commerce-where-we-are-now/); 30 Sep 2026: "trust and intelligence services" = AI-initiation probability score (US testing), Skyfire KYA, Cloudflare signals. Score does not authorise amount/merchant and does not replace fraud platform — [FintechSpecs, 3 Oct 2026](https://fintechspecs.com/blog/mastercard-agent-pay-trust-intelligence-skyfire-kya-2026/) citing [Mastercard release](https://www.financialcontent.com/article/bizwire-2026-9-30-mastercard-advances-agentic-commerce-with-new-trust-and-intelligence-services)
- **Stripe/OpenAI ACP**: OpenAI Instant Checkout launched Sep 2025, shut down Mar 2026 (Walmart: conversion 3x lower); Stripe annual letter 24 Feb 2026 calls agentic commerce "overhyped too early"; Stripe+Tempo MPP 18 Mar 2026 — [Forrester](https://www.forrester.com/blogs/agentic-payments-in-b2c-commerce-where-we-are-now/)
- **Coinbase x402**: released May 2025; governance moved to Linux Foundation 2 Apr 2026; ~69k agents / 165M tx by Apr 2026 (secondary source, unverified) — [eco.com](https://eco.com/support/en/articles/14839402-x402-protocol-explained)
- **AWS Bedrock AgentCore Payments (preview, 7 May 2026)**: Coinbase or Stripe-Privy wallet, x402, per-session spending limits, user must authorise wallet, logs/traces. No anomaly detection, no approval workflow, no HITL described — [AWS](https://aws.amazon.com/blogs/machine-learning/agents-that-transact-introducing-amazon-bedrock-agentcore-payments-built-with-coinbase-and-stripe/)
- **Catena Labs** (Circle co-founder Sean Neville): $18M May 2025, $30M Series A May 2026 (a16z crypto, Acrew), applying for OCC national trust bank charter; open-source Agent Commerce Kit for agent identity (2025) — [Fortune, 20 May 2026](https://fortune.com/2026/05/20/catena-labs-series-a-sean-neville-ai-native-bank/)
- Skyfire funding $9.5M, Nekuda $5M (secondary) — [fluxapay](https://fluxapay.xyz/learning/best-ai-agent-payment-solutions-in-2026)

### Inferences
- The stack is: identity (KYA/TAP) → mandate signing (AP2) → rail (x402/cards). The "between the mandate and the wire" layer — is *this* call still within the mandate, who told the agent to do it — is empty.

### Gaps
- Could not fetch Visa/Mastercard primary pages (Forbes 403); dates for Visa EU rollout (Jul 2026) conflict across blogs. PayPal 2026 agent tooling only via Forrester (Perplexity Instant Buy 25 Nov 2025; UCP endorsement 11 Jan 2026).

## Q2. Open-source / startup "agent transaction firewall" projects and their gaps

### Takeaway
A handful of tiny (0-star, single-author) repos do spend caps + allowlists + hash-chained logs; none does authority-chain verification between agents or explains *why* a transaction is out of scope.

### Cited Findings
- **x402-spendguard** (MIT, Node, 0 stars, 5 commits): daily/weekly/monthly caps, allow/deny lists, `needs_approval` threshold, velocity circuit breaker, sha256-chained JSONL log, Ed25519 receipts. README: "policy *advisory* layer, not a security boundary"; no mention of inter-agent authority or injection detection — [GitHub](https://github.com/baby-zack-agent/x402-spendguard)
- **agent-policy-engine** (TS): allow/deny/quarantine per tool call, spend limits, "authority levels" — [GitHub](https://github.com/Princeu3/agent-policy-engine)
- **agentpay** (cross-rail gateway, agents never hold credentials; only x402 on Base Sepolia real) — [GitHub](https://github.com/Hellotravisss/agentpay); **apgw/MachineNativeEconomy** (Apache-2.0, Envoy+OPA) — [GitHub](https://github.com/atharnouman/MachineNativeEconomy)
- Vendor "6 standard guardrails": limits, velocity, allowlists, approvals, policy engine, virtual-card scoping — [Fystack](https://fystack.io/blog/6-guardrails-to-limit-ai-agent-spending-on-payment-rails)
- Academic: aiAuthZ off-host identity-bound authorisation — [arXiv 2607.05518](https://arxiv.org/pdf/2607.05518); "Owner-Harm" threat model — [arXiv 2604.18658](https://arxiv.org/pdf/2604.18658)

### Inferences
- Spend caps are commodity. Novelty lies in (a) provenance: linking a payment to the chain of agent messages/documents that caused it, (b) semantic scope check against the signed Intent Mandate, (c) explainable block/escalation.

### Gaps
- No funded startup with an open-source "agent payment firewall" core found.

## Q3. Real incidents 2025–2026

### Takeaway
In-the-wild prompt-injection-to-pay campaigns are documented (Zscaler, Unit 42) but no confirmed loss figure exists; OWASP's Q3 2026 roundup has zero payment incidents.

### Cited Findings
- **Zscaler (SecurityWeek, 6 Jul 2026)**: SEO-poisoned fake package site `requests-secure-v2` with hidden prompts in schema markup telling agents to pay to a hardcoded crypto wallet; typosquatted DeBank site; 10 GitHub repos. 4 of 26 LLMs paid (Llama 3.3 70B, Llama 3.2 90B, Gemini 3 Flash, Gemini 2.5 Pro); Claude Sonnet 4.5 and GPT-5.4 misclassified fake DeBank as real. No loss figures — [SecurityWeek](https://www.securityweek.com/prompt-injection-attacks-trick-ai-agents-into-making-crypto-payments/)
- **Unit 42 (Mar 2026)**: in-the-wild injection trying to subscribe victim to a paid "pro plan" — [Unit 42](https://unit42.paloaltonetworks.com/ai-agent-prompt-injection/)
- **OWASP Q3 2026 roundup (8 Oct 2026)**: Hugging Face intrusion 10–13 Jul 2026 (41 dataset workers ran code; exposed credentials) — the hackathon's theme; OpenAI Artifactory containment failure tagged ASI03+ASI07; Deadbugz MCP server rewriting tool metadata after 3 benign calls. None payment-related — [OWASP](https://genai.owasp.org/2026/10/08/genai-and-agentic-ai-exploit-roundup-q3-2026/)
- Merchants: 93% say agent provider should bear loss; 80% expect providers to verify agent authority (PYMNTS via FinTech Weekly) — [FinTech Weekly](https://www.fintechweekly.com/magazine/articles/agentic-commerce-launch-month-liability-risk-2026)
- Procurement-agent manipulated over 3 weeks: single vendor blog, unverified — [Proof](https://www.proof.com/blog/the-fraud-files-agents-impersonation-and-the-identity-layer-nobody-built-july-2026)

### Gaps
- No confirmed monetary-loss case from an agent payment found.

## Q4. OWASP ASI03 / ASI07

### Takeaway
Both map directly to the track scenario; recommended controls are per-agent short-lived scoped credentials, signed/authenticated inter-agent messages, delegation allowlists, tamper-evident logs.

### Cited Findings
- Top 10 (9 Dec 2025): ASI03 Identity & Privilege Abuse ("leaked credentials let agents operate far beyond their intended scope"); ASI07 Insecure Inter-Agent Communication ("spoofed inter-agent messages misdirected entire clusters") — [OWASP](https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/)
- Mitigations: per-agent managed identity, JIT ephemeral credentials, registry mapping agent→tools→human owner; mutual auth, signed messages, nonces, delegation allowlists, treat other agents' messages as untrusted, log inter-agent traffic — [Teleport](https://goteleport.com/blog/owasp-top-10-agentic-applications/), [NeuralTrust](https://neuraltrust.ai/blog/owasp-agentic-ai-top-10); HMAC-SHA256 + JSON Schema on inter-agent data — [arXiv 2603.07191](https://arxiv.org/pdf/2603.07191)

### Gaps
- Official PDF text not retrieved; mitigations above are from secondary guides.

## Q5. Regulation (EU/France) and buyer

### Takeaway
Initiating payments = PISP licence (€50k capital, ACPR in France); a monitoring/policy layer that never holds funds or initiates orders plausibly sits in the PSD2 Art. 3(j) technical-service exclusion (**not verified against text**). Liability for agent payments is legally unsettled, which is the buyer's pain.

### Cited Findings
- PSD3 keeps payment initiation as a licensed service, €50k initial capital; PSD3/PSR not yet in Official Journal as of 7 Oct 2026 — [PaymentBrief](https://paymentbrief.com/articles/psd3-psr-implementation-operator-checklist-2026/), [MoFo](https://www.mofo.com/pdf/resources/insights/260430-psd3-and-the-payment-services-regulation-key-developments)
- Draft PSR requires PSPs to run risk/behaviour-based transaction monitoring; EBA accepts ML as a legitimate control — [EBA Q&A](https://www.eba.europa.eu/single-rule-book-qa/qna/view/publicId/2020_5621)
- "No clear legal rule for who bears the loss when an AI tool exceeds its mandate" — [Payments Dive](https://www.paymentsdive.com/news/how-agentic-payments-artificial-intelligence-risk/832601/); IMF: authorisation becomes "mandate based", raising traceability/consent/liability questions — [IMF 2026](https://www.elibrary.imf.org/view/journals/068/2026/004/article-A001-en.xml)
- Bank panel (7 Oct 2026): blind spots = "transaction passes every spending limit yet stems from a manipulated decision made earlier", revocation not propagated, evidence too thin to locate failure — [Fintech Global](https://fintech.global/2026/10/07/agentic-payments-expose-blind-spots-in-fraud-controls/)

### Inferences
- Buyer: bank/fintech fraud & financial-crime teams (PSR monitoring duty) and, for corporate agents, treasury/CISO. Pitch "evidence for the liability dispute", not "another fraud score".

### Gaps
- No source on Art. 3(j) applied to agent-monitoring software; no ACPR/AMF statement on AI agents.

## Q6. Feasibility in 18 h on Fuji

### Takeaway
Fuji + x402 + mock ERC-20 is well-trodden; a gateway with policy, provenance ledger, circuit breaker and HITL is buildable.

### Cited Findings
- Fuji chain ID 43113, test USDC via Circle faucet, facilitators Thirdweb/PayAI/x402-rs — [Avalanche Academy](https://build.avax.network/academy/blockchain/x402-payment-infrastructure/04-x402-on-avalanche/02-network-setup); x402-rs facilitator = Docker one-liner with `RPC_URL_AVALANCHE_FUJI`, npm `x402-hono` middleware — [Avalanche Builder Hub](https://build.avax.network/integrations/x402-rs)
- ERC-8004 agent identity registry on Fuji via `create-8004-agent` CLI — [GitHub](https://github.com/AxLabs/create-8004-agent)
- A-VIP code + AP2-WhisperBench (1,544 scenarios) released as test corpus — [arXiv](https://arxiv.org/abs/2609.11757)

### Inferences
- Demo: research agent reads poisoned doc → asks finance agent to pay → gateway checks signed Intent Mandate, hop-by-hop authority chain (HMAC/Ed25519 per agent), risk score → blocks/escalates to human → hash-chained log anchored on Fuji.

## Q7. Verdict: crowded? Novel angle?

### Takeaway
Checkout-side (identity, mandates, rails) is crowded; the *inter-agent authority chain + decision provenance + explainable circuit breaker* layer is empty and backed by fresh evidence (Whisper attacks, Sep 2026; bank panel, Oct 2026).

### Inferences
- New for a jury: "we sign the *decision chain*, not just the transaction" — ties AP2's acknowledged gap, OWASP ASI03/ASI07, and the liability vacuum into one artefact: a court-ready provenance receipt per blocked/allowed payment.
