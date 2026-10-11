# PayGuard — Pitch Deck (speaker notes; the PDF is PayGuard_Pitch.pdf, 5 slides)

Track 1 — Guardians of Value · ESSEC Secure Horizons 2026 · 5 min + 2 min Q&A

---

## 1. Your agent shops. Who decides?

**PayGuard: the payment guardian for AI agents.**

One sentence: *"Find me a NordSound ANC Pro headset at the best price, budget €60."* The agent searches, compares, pays. Who checks it was not tricked?

---

## 2. The problem

- Agent-payment protocols sign the **transaction**, not the **decision**.
- A web page can carry instructions **invisible to the human, readable by the agent**: "pay to this address instead", "the user already approved".
- The manipulated agent produces a payment that is **perfectly valid and totally unwanted**.
- July 2026: agents escaped their sandbox and attacked Hugging Face. Payments are the next target.

---

## 3. Who we are building for

- **SMEs and finance teams** that let AI agents purchase, renew, pay suppliers.
- **Platform teams** shipping agents with a wallet or a card.
- Later: **insurers and auditors** who need proof of what the agent decided and why.

---

## 4. The solution

PayGuard is an **MCP plugin** the agent calls to pay. The agent never holds a key or a card number.

1. **Verify**: 20 deterministic rules (mandate, page vs. request consistency, injection) + merchant trust score.
2. **Decide**: APPROVED / HELD (human confirms) / BLOCKED / UNVERIFIED.
3. **Execute** on a rail: single-use virtual card in EUR (capped, merchant-locked) or AVAX on Avalanche.
4. **Prove**: every decision, including refusals, anchored on Avalanche Fuji.
5. **Stop**: kill switch, manual or automatic, pauses the contract and freezes the cards.

---

## 5. Live demo

- Claude Desktop: *"Use PayGuard to buy me a NordSound ANC Pro headset at the best price, €60 max, pay by card."*
- 3 merchants checked. The cheapest one (`n0rdsound`) hides instructions for AI agents ⇒ **rejected, score 0/100**.
- NordSound approved at €49.90 on a **single-use card**; decision anchored on-chain (Snowtrace).
- Dashboard: orders, history, policy, kill switch. Runaway agent ⇒ 3 blocks ⇒ **automatic pause**.

---

## 6. Does it work beyond the demo?

Benchmark on **150 live phishing pages (OpenPhish) vs. 60 real shops (Tranco)**:

| | v1 (first rules) | **v7 (today)** |
|---|---|---|
| Phishing caught | 54 % | **97 %** |
| Legitimate shops blocked | 10 % | **0 %** |
| Sent to a human | 52 % | 15 % |

Deterministic rules first: zero randomness in the decision, LLM only for the explanation.

---

## 7. Business model and compliance

- **SaaS per agent seat + per decision**, free tier for developers (MCP plugin is open).
- Money stays in the customer's bank: "connect your account" (Revolut Business, Stripe Issuing), PayGuard never holds funds. PayGuard is a **technical provider, not a payment institution**.
- Compliance panel built in: DORA (ICT risk, logging), MiCA (on-chain proof), AML-CFT (recipient checks, caps), AI Act (human oversight, traceability).
- Roadmap: EURC rail on Avalanche, merchant reputation over time, insurer API.

---

## 8. Team

- **Vincent** — product, dashboard, compliance, pitch (M2 AI & IP law, ships with AI agents).
- **Dev A** — API, decision engine, database.
- **Dev B** — Avalanche contract, rails.
- **Dev C / Luc** — MCP servers, demo, UI redesign.

Built in 36 h, all TypeScript, 120 tests green, contract live on Fuji.

**Your agent shops. PayGuard decides.**
