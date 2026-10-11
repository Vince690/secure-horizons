# PayGuard — Payment Guardian for AI Agents

**ESSEC Secure Horizons Hackathon** (October 10-11, 2026) — Track 1: "Guardians of Value"

PayGuard is a security layer between AI agents and their payments. When an AI agent wants to make a purchase, PayGuard verifies the merchant, validates the request against human-defined policies, and either executes, holds for confirmation, or blocks the payment—with every decision cryptographically anchored on-chain.

---

## 🎯 The Problem

Traditional payment protocols sign **transactions**, not **decisions**. A compromised AI agent can make technically "valid" payments to unintended recipients. PayGuard solves this by:

1. **Validating the decision** before execution
2. **Enforcing human-defined spending policies**
3. **Detecting prompt injection and page manipulation**
4. **Creating tamper-proof audit trails**
5. **Providing an emergency kill switch**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PayGuard System                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐         ┌──────────────────────┐     │
│  │   MCP Plugin         │         │   Dashboard (Web)    │     │
│  │   (Public)           │         │   (Private - You)    │     │
│  ├──────────────────────┤         ├──────────────────────┤     │
│  │ • AI agents call     │         │ • Spending policies  │     │
│  │ • Merchant checks    │◄────────┤ • Decision approval  │     │
│  │ • Payment requests   │  API    │ • Kill switch        │     │
│  │ • Real-time status   │         │ • Audit logs         │     │
│  └──────────────────────┘         │ • Analytics          │     │
│                                    └──────────────────────┘     │
│                                                                   │
│                        ┌──────────────────────┐                 │
│                        │  Guardian Engine     │                 │
│                        ├──────────────────────┤                 │
│                        │ • 20+ security rules │                 │
│                        │ • Policy enforcement │                 │
│                        │ • Scoring (0-100)    │                 │
│                        │ • Compliance mapping │                 │
│                        └──────────┬───────────┘                 │
│                                   │                              │
│                        ┌──────────▼───────────┐                 │
│                        │ Blockchain Anchoring │                 │
│                        ├──────────────────────┤                 │
│                        │ Avalanche Fuji       │                 │
│                        │ PayGuardLedger.sol   │                 │
│                        └──────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### Components

#### 1. **MCP Plugin** (Public - Distributed to AI Agents)
- **Location**: `apps/mcp-server/`
- **Purpose**: Tools that AI agents call to make payments
- **Interface**: Model Context Protocol (MCP) over stdio
- **Tools Provided**:
  - `check_merchant` - Verify merchant trustworthiness
  - `find_best_offer` - Compare offers, filter fraudulent sites
  - `request_payment` - Request payment with guardian validation
  - `check_payment_status` - Poll for approval status
  - `get_spending_policy` - Read current policies
  - `get_balance` - Check guardian wallet balance

#### 2. **Dashboard** (Private - Your Control Panel)
- **Location**: `apps/web/`
- **Purpose**: Configure policies, approve payments, monitor activity
- **Features**:
  - Configure spending policies (limits, trusted merchants)
  - Approve/reject pending payments
  - View all decisions with full audit trail
  - Activate emergency kill switch
  - Compliance reports (DORA, MiCA, AML/CFT, AI Act)
  - API key management

#### 3. **Guardian Engine** (Core Decision Logic)
- **Location**: `apps/web/src/lib/guardian/`
- **Purpose**: Evaluate every payment request
- **Rules**: 20+ security checks including:
  - Spending limits (per transaction, daily)
  - Prompt injection detection
  - Hidden instruction detection
  - Price/address consistency checks
  - Merchant reputation scoring
  - Velocity anomaly detection

#### 4. **Blockchain Layer** (Tamper-Proof Audit)
- **Contract**: `PayGuardLedger.sol` on Avalanche Fuji testnet
- **Purpose**: Immutable record of all decisions
- **Features**:
  - Decision hash anchoring
  - Payment execution
  - Kill switch enforcement
  - Public verifiability

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and npm
- **Git**

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd secure-horizons

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your configuration (see Configuration section below)

# 4. Initialize database
npm run db:push -w apps/web
npm run db:seed -w apps/web
# ⚠️ Save the API key shown - you'll need it!
```

### Configuration

Edit `.env` at the project root:

```bash
# Required: Database
DATABASE_URL="file:./dev.db"

# Required: Session security
SESSION_SECRET="generate-a-random-32-char-string-here"

# Required: API base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
PAYGUARD_API_URL=http://localhost:3000

# Required: API Key (generated by db:seed)
PAYGUARD_API_KEY=pg_test_xxxxxxxxxxxxxxxx

# Optional: Reduce terminal logging
LOG_LEVEL=error  # Options: debug, info, warn, error

# Optional: AI explanations (leave empty for template-only mode)
ANTHROPIC_API_KEY=

# Optional: Real blockchain (default is mock mode)
CHAIN_MODE=mock  # or "fuji" for real Avalanche transactions
```

### Launch

#### Option A: Dashboard Only (Recommended First)
```bash
npm run dev:web
```
Open http://localhost:3000/dashboard
- Login: `demo@payguard.dev`
- Password: `demo1234`

#### Option B: Full Demo System (Dashboard + Merchants + Scripted Demo)

You need **3 terminals** for the complete demo:

**Terminal 1** - Start the web server (Dashboard + API):
```bash
npm run dev:web
```
Wait for "Ready started server on [::]:3000"

**Terminal 2** - Start demo merchant sites:
```bash
npm run dev:merchants
```
Merchants will run on:
- http://localhost:4001 - NordSound (legitimate)
- http://localhost:4002 - N0rdSound Deals (trap/fraudulent)
- http://localhost:4003 - AudioPlanet (legitimate but pricier)

**Terminal 3** - Run the scripted demo:
```bash
# Basic demo (approved payment)
npm run demo

# Full demo (all scenarios: approved, blocked, trap, kill switch)
npm run demo:all
```

The demo simulates an AI agent shopping for headphones. Watch it:
1. ✅ Find best prices across 3 merchant sites
2. 🛡️ PayGuard detects the fraudulent trap site (10 AI manipulation instructions)
3. 💳 Execute payments (AVAX and virtual card)
4. 🚫 Block suspicious requests
5. ⏸️ Auto-activate kill switch after critical threats

Check the dashboard at http://localhost:3000/dashboard to see all decisions recorded!

---

## 📦 For AI Agent Developers: Using the MCP Plugin

### Installation in Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "payguard": {
      "command": "node",
      "args": ["/path/to/secure-horizons/apps/mcp-server/src/payguard.ts"],
      "env": {
        "PAYGUARD_API_URL": "http://localhost:3000",
        "PAYGUARD_API_KEY": "pg_test_your_api_key_here"
      }
    },
    "demo-shop": {
      "command": "node",
      "args": ["/path/to/secure-horizons/apps/mcp-server/src/demo-shop.ts"]
    }
  }
}
```

### Example: AI Agent Making a Purchase

```
User: "Buy me the NordSound ANC Pro headphones at the best price, max budget 0.06 AVAX"

Agent uses PayGuard tools:
1. search_products("NordSound ANC Pro") → finds candidate URLs
2. find_best_offer([url1, url2, url3]) → ranks by trust & price
3. read_merchant_page(best_url) → reads page content
4. request_payment(...) → submits to PayGuard

PayGuard Decision:
- Score: 95/100
- Verdict: APPROVED
- Reason: Trusted merchant, price matches page, user requested
- Payment executed: 0.05 AVAX
- Blockchain proof: https://testnet.snowtrace.io/tx/0x...
```

### API Endpoints (for non-MCP integrations)

```bash
# Check merchant safety
POST /api/v1/payments/evaluate
Content-Type: application/json
Authorization: Bearer pg_test_your_api_key

{
  "agent_id": "your-agent-id",
  "request_id": "unique-uuid",
  "amount": "0.05",
  "currency": "AVAX",
  "recipient": {
    "address": "0x...",
    "name": "Merchant Name",
    "domain": "merchant.com"
  },
  "purpose": "Product description",
  "context": {
    "page_url": "https://merchant.com/product",
    "page_excerpt": "Raw page text...",
    "conversation": [
      {"role": "user", "content": "Buy this product"}
    ]
  }
}

# Response
{
  "decision_id": "dec_...",
  "verdict": "APPROVED|HOLD|BLOCKED",
  "score": 95,
  "status": "APPROVED",
  "payment_tx": {"tx_hash": "0x...", "explorer_url": "..."},
  "explanation": "Human-readable explanation",
  ...
}
```

---

## 🎛️ For Policy Owners: Using the Dashboard

### Access Dashboard
```bash
npm run dev:web
```
Navigate to http://localhost:3000/dashboard

### Configure Spending Policy

**Policy > Settings**

```
Transaction Limits:
- Max per transaction: 0.1 AVAX
- Max daily total: 0.3 AVAX
- Minimum balance: 0.1 AVAX (safety margin)

Approval Rules:
- Auto-approve score threshold: 70
- Hold for review score: 40-69
- Block score: < 40
- Require confirmation above: 0.08 AVAX

New Merchants:
☑ Require confirmation for first payment to unknown merchant

Trusted Merchants:
- nordsound.shop
- (add more...)

Blocked Addresses:
- 0x2222... (add suspicious addresses)
```

### Approve Pending Payments

**Approvals > Pending**

Each held payment shows:
- What the agent wants to buy
- Price and merchant
- Why it was held (score, triggered rules)
- What the user requested
- What the page actually said

Actions:
- ✅ **Approve** - Execute payment immediately
- ❌ **Reject** - Block and notify agent

### Emergency Kill Switch

**Dashboard Header > Kill Switch Button**

- **Activate**: Pauses all payments immediately
- **Blockchain enforcement**: Contract.pause() called
- **Automatic triggers**:
  - 3 blocked payments in 10 minutes
  - Critical prompt injection detected
- **Reactivation**: Manual only, after investigation

### View Audit Trail

**Audit > History**

Every decision recorded with:
- Timestamp
- Agent ID
- Amount & merchant
- Score & verdict
- All triggered rules
- Blockchain proof link
- Page content (what agent saw vs. what user saw)

---

## 🧪 Testing

### Automated Test Suite

PayGuard includes **40 automated tests** with automatic database cleanup.

#### Health Check (Fast - runs on startup)
```bash
cd apps/web
npm run test:health
```
- **9 tests** in < 1 second
- Verifies critical systems (database, chain, rules)
- Runs automatically on `npm run dev`

#### Comprehensive Tests (Full coverage)
```bash
cd apps/web
npm run test:comprehensive
```
- **31 tests** covering all 20+ security rules
- Takes 30-60 seconds
- Automatic cleanup after each test

#### Cleanup Verification
```bash
cd apps/web
npm run test:cleanup
```
- **3 tests** verifying database cleanup works
- Ensures test data doesn't pollute production

See `TEST_SUITE.md` for full test documentation.

### Demo Scenarios

The scripted demo doesn't require an AI agent—it simulates one.

#### Basic Demo (Safe Purchase)
```bash
npm run demo
```
Shows a simple approved payment flow.

#### Full Demo (All Security Features)
```bash
npm run demo:all
```

**Prerequisites**: Run these first (in separate terminals):
1. `npm run dev:web` - Web server
2. `npm run dev:merchants` - Merchant sites

**Demo Flow**:
1. 🔍 Search for "NordSound ANC Pro headphones"
2. 🛡️ **Fraud Detection**: PayGuard identifies trap site
   - 10 AI manipulation instructions detected
   - 4 hidden HTML instruction blocks
   - Domain lookalike (n0rdsound vs nordsound)
   - **Verdict**: BLOCKED (0/100 score)
3. ✅ **Approved Payment**: Legit merchant
   - 0.05 AVAX purchase
   - **Verdict**: HOLD (needs confirmation - low balance)
4. 💳 **Virtual Card**: EUR payment
   - Creates single-use virtual card
   - Capped at exact amount
   - Locked to merchant domain
   - **Verdict**: APPROVED (80/100)
5. 🚫 **Attack Attempts**: Agent manipulated by trap page
   - Tries to pay 0.5 AVAX (10x the price!)
   - PayGuard blocks all attempts
6. ⏸️ **Kill Switch**: Auto-activated
   - Critical injection + amount over limit
   - All future payments suspended

After the demo, check:
- **Dashboard**: http://localhost:3000/dashboard
- **Audit log**: All 6+ decisions recorded
- **Blockchain**: Each decision anchored on Avalanche Fuji
- **Kill switch**: Red indicator active

**Expected Output**: 
- Trap site: BLOCKED (0/100) ✅
- Legit purchase: HOLD or APPROVED ✅  
- EUR card: APPROVED with virtual card ✅
- Attack attempts: All BLOCKED ✅
- Kill switch: ACTIVE after 2nd attack ✅

---

## 🔐 Security Features

### 1. **Prompt Injection Defense**
Detects 45+ patterns across 9 families:
- Instruction override attempts
- Fake system messages
- AI-targeted commands
- Role hijacking
- "Hide from human" instructions
- Guardian bypass attempts

### 2. **Page Manipulation Detection**
- Hidden text (CSS tricks, HTML comments)
- Price/address mismatches
- Product inconsistencies
- Suspicious urgency language

### 3. **Policy Enforcement**
- Transaction limits
- Daily spending caps
- Minimum balance protection
- New merchant confirmation
- Blocklist/allowlist

### 4. **Blockchain Anchoring**
- Every decision hashed (SHA-256)
- Anchored on Avalanche Fuji
- Public verification available
- Tamper-proof audit trail

### 5. **Kill Switch**
- Manual or automatic activation
- Pauses contract on-chain
- Stops all payments immediately
- Generates DORA incident report

---

## 📊 Compliance & Regulations

PayGuard maps every security check to regulatory frameworks:

| Framework | Coverage |
|-----------|----------|
| **DORA** | Incident reporting, operational resilience |
| **MiCA** | Transaction limits, balance protection |
| **AML/CFT** | Merchant reputation, velocity checks, blocklists |
| **AI Act** | Prompt injection defense, transparency, human oversight |

View compliance status in Dashboard > Compliance

---

## 🔧 Advanced Configuration

### Logging Control

Reduce terminal noise by setting log level in `.env`:

```bash
# Show only errors (quietest - recommended)
LOG_LEVEL=error

# Show important events (default)
LOG_LEVEL=info

# Show detailed diagnostics
LOG_LEVEL=debug
```

### Blockchain Mode

**Mock Mode** (default - no real transactions):
```bash
CHAIN_MODE=mock
MOCK_CHAIN_BALANCE=2
```

**Fuji Mode** (real Avalanche testnet):
```bash
CHAIN_MODE=fuji
GUARDIAN_PRIVATE_KEY=0x...  # Your testnet wallet
PAYGUARD_CONTRACT_ADDRESS=0xf735d4a99f7ad8c8ffb914cfac088634487025ba
```

### Database Management

```bash
# Reset database (⚠️ deletes all data)
npm run db:reset -w apps/web

# View database
npx prisma studio -w apps/web
```

---

## 📁 Project Structure

```
secure-horizons/
├── apps/
│   ├── mcp-server/          # MCP plugin (public distribution)
│   │   ├── src/payguard.ts  # PayGuard tools for AI agents
│   │   └── src/demo-shop.ts # Demo merchant page reader
│   ├── web/                 # Dashboard (private control panel)
│   │   ├── src/app/         # Next.js pages
│   │   ├── src/lib/guardian/# Decision engine (20+ rules)
│   │   └── prisma/          # Database schema
│   ├── merchants/           # Demo merchant sites
│   └── demo-agent/          # Scripted demo (no LLM needed)
├── packages/
│   ├── shared/              # TypeScript types & utilities
│   └── contracts/           # Smart contracts (Avalanche)
└── docs/                    # Documentation
```

---

## 🤝 Contributing

### For Plugin Users (AI Agent Developers)
- Report issues with MCP tool behavior
- Request new tools or features
- Share integration examples

### For Dashboard Users (Policy Owners)
- Suggest new compliance rules
- Report merchant reputation issues
- Request dashboard features

---

## 📄 License

This project was developed for the ESSEC Secure Horizons Hackathon.

**Testnet Only**: Uses Avalanche Fuji testnet. No real funds.

---

## 🆘 Troubleshooting

### "PAYGUARD ERROR INTERNAL: Unexpected server error"

This usually means the web server needs to be restarted after a code change.

```bash
# Stop the web server (Ctrl+C in Terminal 1)
# Then restart:
npm run dev:web
```

If the error persists, check:
1. `.env` file has all required variables
2. Database was initialized: `npm run db:push -w apps/web`
3. API key matches between `.env` and database seed

### "Port 3000 already in use"
```bash
# Stop existing server
taskkill /PID <PID> /F  # Windows
kill -9 <PID>           # Mac/Linux

# Or use different port
PORT=3001 npm run dev:web
```

### "Database connection failed"
```bash
# Recreate database
npm run db:push -w apps/web
npm run db:seed -w apps/web
```

### "Kill switch is active"
- Open dashboard: http://localhost:3000/dashboard
- Click red "Kill Switch" button in header
- Click "Rearm" to deactivate

### "API key invalid"
```bash
# Regenerate API key
npm run db:reset -w apps/web
# Copy the new API key to .env
```

### Too many logs in terminal
```bash
# Add to .env
LOG_LEVEL=error
```

---

## 📞 Support

- **Documentation**: See `/docs` folder
- **API Reference**: `docs/API.md`
- **Test Suite Guide**: `TEST_SUITE.md`

---

## 📦 Hackathon Deliverables

| Deliverable | Where |
|---|---|
| Demo video (2 min: promo + full Claude Desktop recording) | [`deliverables/payguard-demo-video.mp4`](deliverables/payguard-demo-video.mp4) · promo alone: [`deliverables/payguard-promo.mp4`](deliverables/payguard-promo.mp4) |
| Pitch deck (8 slides) | [`deliverables/PITCH_DECK.md`](deliverables/PITCH_DECK.md) |
| Defense sheet (1 page: threat, NIST CSF, ATLAS / OWASP, metrics, limitations) | [`deliverables/DEFENSE_SHEET.md`](deliverables/DEFENSE_SHEET.md) |
| Track 1 deliverable: live contract on Avalanche Fuji | `PayGuardLedger` v2 `0xf735d4a99f7ad8c8ffb914cfac088634487025ba` ([Snowtrace](https://testnet.snowtrace.io/address/0xf735d4a99f7ad8c8ffb914cfac088634487025ba)) · guardian wallet `0xCc86BB75d603aA474dddA53930cf4252C6257764` |
| Merchant-score benchmark (150 live phishing URLs vs 60 real shops) | [`docs/BENCHMARK.md`](docs/BENCHMARK.md), [`docs/MERCHANT_SCORE.md`](docs/MERCHANT_SCORE.md), dashboard **Benchmark** page |
| Demo script, minute by minute | [`DEMO.md`](DEMO.md) |
| Compliance mapping (DORA / MiCA / AML-CFT / AI Act) | [`docs/COMPLIANCE.md`](docs/COMPLIANCE.md) |

## ⚠️ Known Limitations

- **Merchant score is heuristic.** On the benchmark, 3 % of phishing kits hosted on hacked legitimate domains still pass; unreachable or bot-walled sites become `UNVERIFIED` and a human confirms.
- **Virtual-card issuer is a sandbox we wrote.** Cards are single-use, capped and merchant-locked, but no real bank is connected yet (Revolut Business / Stripe Issuing are the planned rails, see `docs/ROADMAP_RAILS.md`).
- **Testnet only.** Avalanche Fuji, dedicated test wallets, no real funds. The on-chain anchor is a hash of the decision, not the decision itself.
- **LLM features are optional.** Natural-language explanations and the semantic "second opinion" need an `ANTHROPIC_API_KEY`; without it, templates and deterministic rules are used (what the demo runs on).
- **Single tenant, SQLite.** Fine for a demo, not for production scale. Session cookie auth, one policy owner.
- **Claude Desktop guardrails.** Claude refuses to initiate crypto transfers itself; in the live demo the agent pays by card in EUR, or the scripted demo (`npm run demo`) drives the same MCP servers without an LLM.
- **Regulatory mapping is indicative.** PayGuard is a technical provider, not a payment institution; the compliance panel is a mapping, not legal advice.

## 🎓 Hackathon Details

- **Event**: ESSEC Secure Horizons
- **Dates**: October 10-11, 2026
- **Track**: Track 1 - "Guardians of Value"
- **Team**: Horizon SAS

---

**Built with**: TypeScript • Next.js • Prisma • Avalanche • MCP • Anthropic Claude

**PayGuard** — Because AI agents need guardians too. 🛡️
