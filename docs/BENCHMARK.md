# Merchant trust score — benchmark

How reliable is `check_merchant` on real sites? Measured on public datasets, read-only (pages are fetched and scored, never executed or submitted).

## Datasets

| Class | Source | Size | Notes |
|---|---|---|---|
| Scam | [OpenPhish](https://openphish.com/feed.txt) live feed, snapshot of 11 Oct 2026 | 150 URLs (de-duplicated) | Active phishing pages: fake logins, wallets, parcels, banks. Some die within hours (unreachable). |
| Legit | 60 well-known e-commerce sites (FR/EU/US), 59 of them ranked in the [Tranco](https://tranco-list.eu) top list | 60 homepages | Many answer 403/429 to a non-browser reader (bot protection). |

Lists: `apps/mcp-server/benchmark/`. Runner: `apps/mcp-server/src/benchmark.ts`. Results: `apps/web/public/benchmark/*.json`, shown live on the dashboard page **Benchmark**.

Definitions: **caught** = scam rated FRAUDULENT or SUSPICIOUS (a human confirms before paying); **fooled** = scam rated TRUSTED (we would have paid); **legit blocked** = legitimate site rated FRAUDULENT; **legit held** = legitimate site sent to a human.

## Runs

| Run | What changed | Scams caught | Fooled | Legit blocked | Legit held |
|---|---|---|---|---|---|
| v1 | initial score (page signals + HTTPS, TLD, RDAP age, legal mentions, lookalike) | 54 % | 46 % | 10 % | 52 % |
| v2 | RDAP queried on the registrable domain, serialized; hidden prices no longer "hidden instructions"; same name under another TLD not a lookalike for brands | 59 % | 41 % | 8 % | 48 % |
| v3 | **free hosting / dynamic DNS** (github.io, vercel.app, pages.dev, blogspot, *.zapto.org…) −25 ; **brand impersonation in hostname** (roblox.com.bi, binance-account-login.vercel.app) −35 ; **credential / card forms** on sites with no identity −25 ; 403/429/503 treated as bot protection (0) instead of a broken page ; legal mentions searched on the whole page ; unreachable −45 | **80 %** | **20 %** | **2 %** | 22 % |
| **v4** | short brand names need an exact match (etsy ≠ ebay, ikea ≠ nike) ; amazon.de is Amazon ; redirects inside the same registrable domain ignored ; free hosting −32 (alone ⇒ human confirms) | **83 %** | **17 %** | **0 %** | **10 %** |

| v5 | empty pages (nothing to buy) ⇒ human ; login / verification paths ; credential-harvesting wording (verify your account, seed phrase…) ; machine-generated subdomains ; more risky TLDs ; no HTTPS −20 | 93 % | 7 % | 0 % | 15 % |
| **v6** | risky TLD alone ⇒ human ; machine-generated paths (long hex ids, random tokens) | **97 %** | **3 %** | **0 %** | **13 %** |

| v7 | fourth verdict **UNVERIFIED** (unreachable, bot wall, empty page): reported as « could not be checked », agent tells the user, a human confirms | 97 % | 3 % | 0 % | 5 % held + 10 % unverified |

v6 in one sentence: **97 % of live phishing pages are caught, no legitimate shop is blocked, 13 % of shops are sent to a human** (half of them simply unreachable from our network at that moment, the rest script-only homepages with no readable text). The 3 % still passing are legitimate-looking domains that were hacked to host a phishing kit in a sub-path: the next signal is reputation of the registrable domain over time.

v4 in one sentence: **83 % of live phishing pages are caught, no legitimate shop is blocked, 1 in 10 is sent to a human** (3 of those 6 were simply unreachable from our network at that moment). The 17 % that still pass are mostly bare parked pages with no text at all: nothing to buy there, so no payment would follow anyway.

## What the failures taught us

- **Domain age is the strongest anti-phishing signal and the hardest to get**: public RDAP answers for ~half of the domains only. Where it answers, "registered < 30 days" catches most scams on their own domain. Production: a commercial WHOIS/RDAP provider with caching.
- **Phishing lives on free hosting**: a third of the feed is on GitHub Pages, Vercel, Cloudflare Pages, Blogspot or dynamic-DNS names. Nobody sells headphones from `*.vercel.app`: penalising it costs nothing on legitimate merchants.
- **The brand is in the hostname, not the domain**: `roblox.com.bi`, `spotify.assetdeploy.com`, `suntrust-onlinebanking.blogspot.com`. Looking at every label of the hostname, with homoglyphs collapsed, catches them.
- **Big shops look hostile to robots**: 403/429 answers, no readable price on the homepage, legal mentions deep in the footer. Those were false alarms, not fraud signals.
- **Short brand names collide**: with 2 edits allowed, `etsy` matched `ebay` and `ikea` matched `nike`. The edit budget now depends on the name length.

## Honest limits

- The scam set is phishing (credential theft), not fake shops: the closest public dataset we could fetch in a hackathon night. Fake-shop lists exist (e.g. consumer-protection registries) and are the next step.
- Homepages, not product pages: price and product checks of the guardian are not exercised here.
- One snapshot, one morning. Numbers move with the feed.
