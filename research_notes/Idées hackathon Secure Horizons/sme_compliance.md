# Defensive AI-cyber products for SMEs/citizens + AI Act/NIS2 "continuous compliance" (as of 2026-10-10)

## (a) Shadow AI discovery for 10–200-person companies: real, large, gap?

### Takeaway
The problem is well documented (mostly by vendor telemetry) but the whole market is enterprise-priced, quote-only and browser/proxy-agent based; no self-serve product for a 10–200-person company exists in the sources found. Novelty is low in 2026 (Bpifrance counts "Shadow AI control" as an established sub-segment).

### Cited Findings
- Netskope 2026 Cloud & Threat Report: 47% of employees using AI at work do so via personal accounts; ~223 genAI data-policy violations/month per org; source code 42%, regulated data 32%, IP 16% of leaked data — [Netskope via newsworthy.ai](https://www.newsworthy.ai/news/202603182250/shadow-ai-dominates-workplace-netskope-2026-report-reveals-alarming-trends)
- LayerX (2025): 77% of enterprise AI users paste data into prompts; ~14 pastes/day into non-corporate accounts, ≥3 with sensitive data — [stats compilation](https://dope.security/post/shadow-ai-statistics)
- Harmonic Security: 73.8% of ChatGPT enterprise usage on personal accounts — [same compilation](https://dope.security/post/shadow-ai-statistics); Harmonic prices per user/month, sales-only, 3 tiers (Explore/Guide/Command), no SMB tier — [Harmonic product page](https://harmonic.security/product), [pricing listing checked 2026-09-25](https://ethicalhacking.ai/pricing/harmonic-security-pricing)
- Reco AI starts ~$25k/yr (estimate) — [comparison](https://tech-insider.org/?p=19088)
- Verizon DBIR 2026 (via Kiteworks): 45% of employees regular AI users on corporate devices (15% prior year); 67% reach public AI from non-corporate accounts — [Kiteworks](https://www.kiteworks.com/cybersecurity-risk-management/shadow-ai-data-leakage-governance/) (secondary, unverified against DBIR text)
- CSA warns these figures come primarily from vendor telemetry/sponsored research — [CSA note 2026-05-30](https://labs.cloudsecurityalliance.org/research/csa-research-note-shadow-ai-apps-enterprise-20260530-csa-sty/)
- Bpifrance/Wavestone Radar 2026 lists "contrôle du Shadow AI" as one of 5 sub-themes of the 22-company "sécurisation de l'IA" segment — [Bpifrance press](https://presse.bpifrance.fr/radar-des-startups-cybersecurite-francaises-2026-avec-234-startups-et-43-scale-ups-lecosysteme-francais-connait-une-effervescence-de-creation-remarquable-malgre-des-difficultes-de-croissance/?lang=fra)

### Inferences
- Gap = price/self-serve, not technology. An 18-h demo (browser extension flagging pasted PII/secrets into ChatGPT, plain-language weekly report) is feasible but will look like a Harmonic/LayerX clone to a jury; differentiate only via SME price point or Workspace/M365 OAuth-log analysis (no agent to install).

### Gaps
- No independent SME-specific shadow-AI statistics found; no public Netskope/Zscaler/Nightfall/Purview price list for <200 seats (Purview requires M365 E5-class licences — not verified here).

## (b) Mini-SOC for SMEs on M365/Google Workspace: competitors and gap

### Takeaway
Account hijacking is the #1 threat to French SMEs (21%, +52%) and the market already has cheap MSP-channel products (Huntress ITDR $4.80/identity/month, Guardz ~$7–11/user); the residual gap is direct-to-SME, French-language, no-MSP, plus the public-sector free tier (17Cyber/MonExpertCyber) that stops at diagnosis.

### Cited Findings
- Cybermalveillance.gouv.fr 2025 top-10 for businesses/associations: account hijacking 21% (+52%), phishing 16% (+29%), transfer fraud 13.5% (+93%), ransomware 8.1%, data breach 6.6% (+40%), intrusions 6% (+112%) — [Cybermalveillance](https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites/top10-cybermalveillances-professionnels-2025); >500,000 assistance requests in 2025 (+20%) — [ITforBusiness](https://www.itforbusiness.fr/cybermalveillance-gouv-fr-plus-de-504-000-demandes-dassistance-en-2025-101931)
- Baromètre maturité TPE-PME 2025 (OpinionWay, n=588): 16% had an incident in 12 months; phishing 43% of incidents (24% in 2024); 78% have IT budget <€5,000/yr — [Cybermalveillance](https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites/etude-maturite-cyber-tpe-pme-2025)
- Hiscox 2025 (≈6,000 SMEs, 7 countries incl. France): 59% attacked in last year; 57% say attack linked to AI vulnerabilities; 94% plan to raise spend — [Hiscox](https://www.hiscoxgroup.com/node/53166)
- Huntress: Managed EDR $8.99/endpoint/mo direct, 50-agent minimum; Managed ITDR $4.80/M365 identity/mo — [UnderDefense pricing guide](https://underdefense.com/blog/huntress-pricing-guide/); Guardz quote-only, ~$7–11/user/mo via MSPs — [comparison](https://aitooladvi.com/2026/07/10/guardz-vs-huntress-in-2026-which-ai-powered-security-platform-is-right-for-your-small-business/); Microsoft Defender for Business $3/user/mo — same source
- Public tools: 17Cyber (guided diagnosis), MonExpertCyber, SensCyber, SenCy-Crise — [Cybermalveillance](https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites/top10-cybermalveillances-professionnels-2025); Bpifrance Diag Cybersécurité €8,800 HT, 50% subsidised (Plan Cyber PME / France 2030) — [les-aides.fr](https://les-aides.fr/aide/aVIv3w/bpifrance/diag-cybersecurite.html) (aggregator; not confirmed on bpifrance.fr)
- NIS2: France has not completed transposition; Loi Résilience passed Senate March 2025, final passage expected 2026; ~15–18k entities; ANSSI "ReCyF" framework March 2026 — [Legiscope](https://www.legiscope.com/blog/transposition-nis2-france.html), [Copla](https://copla.com/blog/compliance-regulations/nis2-directive-regulations-and-implementation-in-france/) (consultancy blogs; the "30 June 2026 audit" date is unsupported)

### Inferences
- Demoable in 18 h: Graph API / Workspace audit-log polling for new inbox forwarding rules, impossible-travel logins, risky OAuth grants, MFA-push storms, with an LLM writing French plain-language alerts and a "what to do now" step. Coro pricing not found.
- Jury risk: "Huntress for France" is credible as a business but weak on innovation unless combined with AI-specific signals (OAuth grants to AI apps, agentic mailbox access).

### Gaps
- No Coro, Blumira, Cynet or French-MSSP SME price points found; no data on how many French SMEs are on M365 vs Workspace.

## (c) Scam/deepfake detection for citizens: Trustee (2025 winner) and 2026 products

### Takeaway
Trustee (2025 ESSEC winner) was a Chrome extension scoring eBay listings and seller chats, since incubated at ESSEC; the consumer space is now crowded by Norton Genie, McAfee Scam Detector, Bitdefender Scamio and on-device Gemini Nano call screening, so a generic "scam checker" would look derivative.

### Cited Findings
- Trustee won first place overall at the Utopia × KRYPTOSPHERE "LLM to Agentic AI" 36-h hackathon at ESSEC (April 2025, cyber category); extension evaluates text, price, images and conversation, shows trust score, alerts, suggested replies; incubated at ESSEC Entrepreneurship & Innovation — [TSE news](https://www.tse-fr.eu/fr/actualites/anais-boughanem-etudiante-master-d3s-remporte-premier-prix-dun-hackathon-lia); event context (4–5 April 2025, €10k prizes, Ledger/Mistral/Google Cloud partners) — [ESSEC](https://www.essec.edu/en/news/essec-students-tackling-artificial-intelligence/)
- Norton deepfake protection (July 2025): audio+video analysis, English YouTube only, Norton 360 mobile in US/UK/AU/NZ — [Norton support](https://support.norton.com/sp/en/us/home/current/solutions/v20250722122612120), [press](https://www.nasdaq.com/press-release/norton-adds-audio-and-visual-deepfake-protection-mobile-2025-07-31)
- McAfee Scam Detector (Jan 2025), claims 96% deepfake accuracy (vendor claim); Deepfake Detector limited to Lenovo AI PCs — [BusinessWire](https://www.businesswire.com/news/home/20250106974410/en/McAfee-Launches-AI-Powered-Scam-Detector-to-Stop-Scams-Before-They-Strike), [eSecurityPlanet](https://www.esecurityplanet.com/cybersecurity/best-ai-deepfake-detection-tools/)
- Bitdefender Scamio: free chatbot for text/URLs, no image forensics; paid Pro tier — [eSecurityPlanet](https://www.esecurityplanet.com/cybersecurity/best-ai-deepfake-detection-tools/); KSL field test: McAfee most reliable, Genie second — [KSL](https://www.ksl.com/article/news/ksl-investigates/we-tested4popularscamdetection-apps-hereswhatactually-worked/51589869)
- Google on-device Gemini Nano Scam Detection for calls, extended to Galaxy S26 (US/English first) — [Android Authority](https://androidauthority.com/google-gemini-nano-scam-call-alerts-3442675), [PhoneArena](https://www.phonearena.com/news/scam-detection-on-android-is-getting-an-upgrade-thanks-to-gemini_id158311)
- ENISA ETL 2025: threat actors use AI for vishing, deepfake impersonation, WormGPT/FraudGPT-style tools — [DIGITAL SME summary](https://www.digitalsme.eu/enisa-cybersecurity-threat-landscape-report-2025-key-takeaways-for-smes/)

### Inferences
- Remaining gap: B2B-side scam protection for SMEs (vendor-impersonation / fake-transfer-order = +93% in France), not another consumer checker.

### Gaps
- Whether Trustee became a registered company or raised money: not found. No source confirming Google call-scam detection in French, nor Orange/Free/SFR AI filters.

## (d) EU AI Act continuous compliance / evidence pack

### Takeaway
The Digital Omnibus (Reg. (EU) 2026/1744) pushed Annex III high-risk obligations to 2 Dec 2027 and Annex I to 2 Aug 2028, but Art. 12 logging, Art. 15 robustness/cybersecurity and Annex IV documentation themselves were not amended; vendors (Naaia, Saidot, trail, Credo, Holistic) do registries/documentation, while test-tooling (Giskard) is separate — a tamper-evident "robustness test ledger per model version mapped to Art. 15 / ISO 42001" is a plausible wedge, with a 14-month runway for deployers to build evidence.

### Cited Findings
- Omnibus: Council final approval 29 June 2026, OJ 24 July 2026, in force 27 July 2026; Annex III → 2 Dec 2027; Annex I → 2 Aug 2028; public authorities → 2 Aug 2030; new Art. 5 bans (nudifier/CSAM) from 2 Dec 2026; Art. 50(2) grace to 2 Dec 2026 for pre-existing systems; new "small mid-cap" category (<750 staff, ≤€150M turnover) with simplified technical documentation templates notified bodies must accept — [Orrick](https://www.orrick.com/en/Insights/2026/07/EU-AI-Act-Update-Digital-Omnibus-Finalizes-8-Compliance-Changes), [CSA](https://labs.cloudsecurityalliance.org/research/csa-research-note-eu-ai-act-omnibus-vii-deadline-delay-20260/), [Gibson Dunn](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/), [EUR-Lex 2026/1744](https://eur-lex.europa.eu/eli/reg/2026/1744/oj); fixed dates replaced the Commission's standards-conditioned trigger — Gibson Dunn
- Art. 12 (automatic logging over lifetime, traceability), Art. 15 (accuracy, robustness, cybersecurity incl. data poisoning, adversarial examples, model flaws), Annex IV (technical documentation incl. metrics, testing, versions) — [Art. 12](https://artificialintelligenceact.eu/article/12/), [Art. 15](https://artificialintelligenceact.eu/article/15/), [Annex IV](https://artificialintelligenceact.eu/annex/4/) (standard references; texts not re-fetched in this session)
- Naaia (FR, ISO 42001-based AIMS): Series A July 2026 ~$6.5M led by Ventech (another source says $6.8M) — [Seedtable](https://seedtable.com/companies/naaia/funding-rounds/series-a-2026-07), [Signalbase](https://www.trysignalbase.com/news/funding/naaiaai-raises-6)
- Saidot: €1.75M seed (Oct 2023), classification assistant in preview July 2026 — [Saidot](https://www.saidot.ai/insights/saidot-raises-seed-round-to-grow-its-ai-governance-platform); trail (Munich): €1.45M pre-seed July 2024, AI registry + auto documentation + ISO 42001 — [Startbase](https://www.startbase.com/news/pre-seed-finanzierung-145-millionen-euro-fuer-trail/)
- Giskard (FR): €1.5M seed (Elaia, Bessemer, 2022) + €3M Bpifrance/EIC grant (2023), open-source LLM testing; bets AI Act makes testing a legal duty — [startups.center](https://startups.center/w/giskard-2025-ai-act-testing-bet)
- Consolidation: Palo Alto bought Protect AI (closed 22 July 2025, reported $500–700M); Check Point bought Lakera (closed 22 Oct 2025, ~$201.8M per 20-F) — [SecurityWeek](https://www.securityweek.com/palo-alto-networks-to-acquire-ai-security-firm-protect-ai/), [SecurityWeek](https://www.securityweek.com/check-point-to-acquire-ai-security-firm-lakera/amp/)
- Insurers now ask for AI inventory, GenAI monitoring, incident logging (representative questions) and Cowbell scores "AI Assurance" from telemetry (July 2026) — [Shadowlock tracker](https://shadowlock.io/resources/cyber-insurance-ai-tracker)

### Inferences
- Demo in 18 h: pipeline runs Giskard/Promptfoo-style tests on a toy model, hashes results into a Merkle/append-only log (optionally anchored on Avalanche testnet — Track 1 jury), renders an Annex IV/Art. 15 evidence PDF. Buyer: deployer SMEs/small mid-caps (HR, credit scoring), their insurers/brokers, and DPO/consultancies.
- Barrier: GRC incumbents (Vanta/Drata) add AI Act frameworks cheaply; the defensible part is continuous technical evidence, not checklists.

### Gaps
- Did not verify Vanta/Drata/Credo/Holistic AI 2026 AI-Act module pricing; no source showing any vendor doing version-pinned tamper-evident robustness logs (absence of evidence, not proof of gap).

## (e) Cyber-insurance angle: AI exclusions and a buyer for "proof AI controls work"

### Takeaway
Confirmed: W.R. Berkley's "absolute" AI exclusion (D&O/E&O/fiduciary, reported form PC 51380) and ISO CGL AI exclusions effective 1 Jan 2026; no named cyber-line AI exclusion form found, but 42% of security leaders say their cyber policy already has AI-misuse exclusions and underwriters ask AI-control questions — so an evidence product has a real, if early, buyer.

### Cited Findings
- Berkley first "Absolute" AI exclusion, D&O/E&O/fiduciary; Armilla + Lloyd's affirmative AI cover — [Hunton, 28 May 2025](https://www.hunton.com/hunton-insurance-recovery-blog/the-continued-proliferation-of-ai-exclusions)
- CGL forms CG 40 47/40 48/35 08 effective 1 Jan 2026 (confirmed); AIG, Great American, Hamilton, Philadelphia filings (reported); AIG said no current plan to use them; Delinea survey (Forbes, June 2026): 42% say cyber policies include AI exclusions; Verisk: exclusions for systemic model events / autonomous agents "being discussed" (Reuters Aug 2026) — [Shadowlock tracker](https://shadowlock.io/resources/cyber-insurance-ai-tracker)
- Affirmative: Coalition AI Security Event endorsement (2024, in base policy 2025) and Deepfake Response (Dec 2025); AXA XL genAI endorsement incl. EU AI Act violations (Oct 2024); Munich Re aiSure + Mosaic up to $15M; Armilla/Chaucer AI liability $25M+ — same tracker; CSIS warns insurer retreat may slow AI adoption — [CSIS](https://www.csis.org/analysis/insurance-industrys-retreat-ai-threatens-slow-innovation-and-adoption)

### Inferences
- "Proof of AI controls" fits insurers' new questionnaires (AI inventory, employee GenAI monitoring, incident logs) — a shared backbone with (d).

### Gaps
- No premium credits for AI controls published; Lloyd's has no AI exclusion mandate found; European carrier (AXA, Hiscox FR, Stoïk) stance not researched.

## (f) Other under-served 2026 problems

### Takeaway
Shadow MCP servers on developer machines and AI-generated fake receipts/invoices are the two freshest, best-evidenced problems with almost no SME-grade tooling.

### Cited Findings
- Microsoft (2026): shadow MCP = servers spun up for demos, never registered, "cannot govern, patch or revoke what you cannot see" — [Microsoft Security blog](https://techcommunity.microsoft.com/blog/microsoft-security-blog/the-state-of-mcp-security-in-2026/4531327); 38% of 500+ scanned MCP servers had no auth; Trend Micro found 492 internet-exposed MCP servers with zero auth; postmark-mcp npm package BCC'd all outgoing mail — [Stacklok](https://stacklok.com/resources/shadow-mcp-how-to-find-rogue-mcp-servers-before-they-find-you/), [UpGuard](https://www.upguard.com/blog/mcp-security-incidents)
- AppZen: AI-generated share of flagged fraudulent receipts 0% (Mar 2025) → 70.8% (May 2026); Emburse survey: 40% of US / 29% of UK workers admit AI-faking a receipt — [letsdatascience](https://letsdatascience.com/news/ai-generated-receipts-drive-majority-of-expense-fraud-af43c62a), [Ohio CPA](https://ohiocpa.com/for-the-public/news/2026/06/26/use-of-ai-generated-receipts-in-expense-fraud-soars)
- Group-IB: 8,065 biometric injection attempts on one lender's KYC Jan–Aug 2025; $15 darknet KYC-bypass kits — [Joinble](https://joinble.io/blog/deepfakes-banking-onboarding-2026) (vendor); INTERPOL March 2026 flags AI synthetic-identity rise — same source
- DBIR 2026: attackers used GenAI across median 15 techniques; third-party breaches 48% (+60%); mobile-entry phishing 40% higher click rate — [Verizon SMB infographic](https://www.verizon.com/business/resources/infographics/2026-dbir-bis-smb-revenue-losses.pdf)

### Inferences
- "Shadow MCP scanner" (local scan of ~/.claude, Cursor, VS Code configs → inventory, auth check, tool-description poisoning check) is 18-h-feasible, novel for a jury, and on-theme (agents escaping sandboxes).
- AI-fake-invoice detection for SMEs ties directly to France's +93% transfer-fraud trend; demo with synthetic invoices is easy but vendors (AppZen, Medius) exist for enterprises.

### Gaps
- No real-world agentic-browser or AI-phone-agent social-engineering incident affecting an SME found; invoice-agent attacks are illustrative only.

## Bpifrance signals

### Takeaway
Bpifrance/Wavestone Radar 2026 shows 234 cyber startups (105 new, driven by GenAI), €304M raised in 36 rounds, 70% embed AI, and names "securing AI" (agents, shadow AI, model security, deepfakes) as the growing front — a startup positioned there, with a path to export, matches their stated priorities.

### Cited Findings
- 234 startups / 43 scale-ups; 105 new vs 44; €304M (289) over 36 rounds (19); 8–9 acquisitions; 22 "sécurisation de l'IA" companies (15 in 2025, 11 in 2024); 52% of startups <5 staff; Zama unicorn; Fournier: "soutenir cet écosystème stratégique" — [Bpifrance press](https://presse.bpifrance.fr/radar-des-startups-cybersecurite-francaises-2026-avec-234-startups-et-43-scale-ups-lecosysteme-francais-connait-une-effervescence-de-creation-remarquable-malgre-des-difficultes-de-croissance/?lang=fra), [Le Monde Informatique](https://www.lemondeinformatique.fr/actualites/lire-la-dynamique-des-start-ups-en-cybersecurite-s-accelere-en-france-en-2026-100555.html)

### Inferences
- Ranking for a one-night MVP + credible startup story: (1) AI-Act/insurance evidence ledger (d+e) — regulatory tailwind, few technical-evidence players, strong pitch for law+AI founder; (2) Shadow-MCP scanner (f) — most novel, most on-theme, weakest "who pays" story; (3) French M365/Workspace mini-SOC (b) — biggest market, least novel; (4) Shadow AI (a) and consumer scam checker (c) — crowded.

### Gaps
- No Bpifrance/French Tech 2030 document specifically on AI-cyber priorities located beyond the Radar; France 2030 "€2.5bn AI" figure seen only on a non-official site.
