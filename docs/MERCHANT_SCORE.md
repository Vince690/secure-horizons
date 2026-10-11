# Merchant trust score — what we look at, and why

Every merchant page goes through `check_merchant` (apps/mcp-server/src/merchant.ts). The score starts at 100; each signal below subtracts points. Deterministic: same page, same score, no AI key involved. Four verdicts:

| Verdict | Score | Meaning for the agent |
|---|---|---|
| **TRUSTED** | ≥ 70 | may submit the purchase |
| **SUSPICIOUS** | 40 – 69 | tell the user why; a human confirms before any payment |
| **FRAUDULENT** | < 40, or a terminal signal | never buy, whatever the price |
| **UNVERIFIED** | unreadable site (unreachable, bot wall, no text) with nothing damning on the domain | say plainly that the site could not be checked; a human confirms |

## 1. Manipulation of the agent (terminal: FRAUDULENT whatever the rest)

| Signal | Points | What we look at | Why it matters |
|---|---|---|---|
| `PROMPT_INJECTION_SUSPECTED` | −70 | ~45 regex patterns in 9 families, FR/EN: overriding instructions, fake system notices, text addressed to "AI assistants", role hijack, secrecy ("do not tell the user"), bypassing confirmation, fake authority, payment redirection, threats/rewards | A page that gives orders to an agent has no legitimate reason to exist. Zero false positives on 60 real shops. |
| `HIDDEN_INSTRUCTIONS` | −50 | Text a human could not see: `display:none`, `visibility:hidden`, font-size 0/1px, white-on-white, off-screen, `hidden`/`aria-hidden`, HTML comments; flagged only if it contains an order, a crypto address, or an amount with an imperative | "Invisible to the human, visible to the agent" is the signature of agent-targeted fraud. Hidden prices alone are tolerated (legit shops hide price variants). |

## 2. Identity of the site

| Signal | Points | What we look at | Why |
|---|---|---|---|
| `DOMAIN_LOOKALIKE` | −35 | The domain vs the account's trusted merchants and a list of ~90 known brands: edit distance (budget depends on name length: 0 for ≤4 letters, 1 for 5–6, 2 for ≥7), homoglyphs collapsed (0→o, 1→l, rn→m, 3→e, 5→s), "brand-deals" prefixes | `n0rdsound-deals.shop` vs `nordsound.shop`. Same name under another TLD is suspicious for a trusted merchant, normal for a global brand (amazon.de). |
| `BRAND_IMPERSONATION` | −35 | A known brand's name used as any label of the hostname while the registrable domain is not the brand's | `roblox.com.bi`, `binance-account-login.vercel.app`, `suntrust-onlinebanking.blogspot.com` |
| `DOMAIN_VERY_NEW` / `DOMAIN_RECENT` | −30 / −15 | Registration date from the public RDAP registry, queried on the registrable domain (`example.co.uk`, not the subdomain), serialized and cached | Phishing domains are days old; shops are years old. `DOMAIN_ESTABLISHED` (> 3 years) is shown as a positive fact. |
| `DOMAIN_AGE_UNKNOWN` | −5 | Registry did not answer | Mild: half of registries are silent to public RDAP. |
| `FREE_HOSTING` | −32 | ~50 suffixes of free hosting and dynamic DNS: github.io, vercel.app, pages.dev, blogspot, webflow.io, S3 buckets, *.zapto.org, ngrok… | Anyone publishes there in minutes with no identity; nobody sells headphones from `*.vercel.app`. Alone it sends to a human. |
| `RISKY_TLD` | −30 | ~50 extensions over-represented in abuse feeds: .xyz, .top, .cfd, .guru, .vip, .icu, .sbs… | Alone it sends to a human; combined with anything else it blocks. |
| `RANDOM_SUBDOMAIN` / `RANDOM_PATH` | −15 / −15 | Machine-generated labels (`121jio.`, `34abx.`) and paths (long hex ids, random tokens) | Signature of phishing kits mass-deployed on rented or hacked domains. |
| `NO_HTTPS` | −20 | Plain HTTP | Card details would travel in clear text. |
| `REDIRECTED_ELSEWHERE` | −15 | Final registrable domain differs from the requested one | Classic bait-and-switch; same-domain redirects (www., locale) are ignored. |

## 3. What the page says

| Signal | Points | What we look at | Why |
|---|---|---|---|
| `NO_LEGAL_MENTIONS` | −10 | Whole page scanned for legal notice, company registration (RCS/SIREN), terms, privacy policy, "all rights reserved" (FR/EN/DE) | Real merchants are legally required to show them. |
| `CONTACT_EMAIL_MISMATCH` | −10 | Contact e-mail on another domain | Throw-away mailbox behind a fake shop. |
| `CREDENTIAL_FORM` | −25 | Password / card-number / CVV fields on a site with no established identity | A shop checkout belongs to an identified company; a credential form on a fresh or impersonating domain is harvesting. |
| `PHISHY_CONTENT` | −25 | Wording of credential pages: "verify your account", "unusual sign-in", "recovery phrase", "one-time code"… | Shops do not ask for seed phrases. |
| `PHISHY_PATH` | −20 | URL path like /login, /verify, /secure, /update, /wallet | A product page is never there. |
| `URGENCY_LANGUAGE` | −10 | "expires in 2 minutes", "last chance", "offer flash" | Pressure is the oldest fraud lever. |
| `EMPTY_PAGE` | −25 | Fewer than 25 readable words | Nothing to buy, or script-only rendering: a human must look. |
| `NO_PRICE_FOUND` | −2 | No price in the visible text | Informational (homepages have none). |
| `TOO_GOOD_TO_BE_TRUE` | −20 | In `find_best_offer`: price below 60 % of the median of the other candidates | The bait of every fake shop. |

## 4. Reading the site at all

| Signal | Points | What we look at | Why |
|---|---|---|---|
| `BOT_PROTECTED` | 0 | HTTP 401/403/429/503 | Big shops answer this to robots: not a fraud signal, the domain is judged on its own; verdict UNVERIFIED if nothing else is known. |
| `HTTP_ERROR` | −20 | Other 4xx/5xx | Broken page. |
| `UNREACHABLE` | −45 | Timeout, DNS, connection refused | Verdict UNVERIFIED: we say so, we don't guess. |

## Then the guardian adds its own checks at payment time

The merchant score is only the first gate. `request_payment` runs the 20 rules of the guardian on the actual purchase: the owner's mandate (limits, floor, daily cap, confirmation threshold, first payment to a new recipient), consistency between the page the agent read and what it asks (price, address, product), what the user actually asked for, recipient reputation on-chain, velocity, and the same injection / hidden-text detectors on the page text the agent passes. See `docs/API.md` §5.

## Measured

Six iterations on 150 live phishing pages and 60 real shops: 97 % caught, 0 % legitimate shop blocked (`docs/BENCHMARK.md`, dashboard › Benchmark, `http://localhost:3000/benchmark/index.html`).
