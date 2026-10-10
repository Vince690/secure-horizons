# SME payment fraud in France/EU (CEO fraud, IBAN-change fraud, voice deepfakes, BEC) — state as of Oct 2026

## 1. Problem size (France / EU / US)

### Takeaway
Fraud "by manipulation" (victim tricked into authorising a transfer) is now the #1 payment-fraud category in France (€516M, +34% in 2025); for French companies the fake-supplier scam is the most frequent attempt (42% of targeted firms) and faux ordre de virement is the #3 incident type reported by businesses (+93%). AI-enabled BEC is still a small, under-measured slice of reported losses.

### Cited Findings
- OSMP (Banque de France) 2025 annual report, published 7 Sept 2026: total payment fraud €1.24bn (+3.8%); fraudulent transactions down 8% (7.2M ops); manipulation fraud €516M (+34% from €384M), >40% of total vs 32.1% in 2024 — [Banque de France](https://www.banque-france.fr/fr/publications-et-statistiques/publications/rapport-de-lobservatoire-de-la-securite-des-moyens-de-paiement-2025); [Renseignement Économique](https://renseignementeconomique.fr/la-fraude-par-manipulation-explose-en-2025-516-millions-d-euros-detournes-alerte-de-l-osmp)
- Credit transfers = ~3/4 of manipulation fraud; average fraudulent online transfer €1,457; 182,568 fraudulent instant transfers vs 86,570 classic in 2025 (instant = irrevocable in <10 s) — [MoneyVox, 1 Oct 2026](https://www.moneyvox.fr/banque/actualites/110566/faux-conseillers-bancaires-les-chiffres-chocs-de-explosion-de-la-fraude-par-manipulation)
- H1 2025: transfer fraud €230M (+44% YoY), 76% via online banking (used by both individuals and professionals) — [OSMP H1 2025 note](https://www.banque-france.fr/system/files/2026-01/2026-01-27_OSMP-Note-statistiques-de-fraude-du-S1-2025.pdf)
- Allianz Trade/Odoxa Baromètre Fraude 2026 (16 June 2026, 315 CFOs/CEOs): 60% of PME and 85% of ETI/large firms saw ≥1 attempt in 12 months; 40% of attempts succeeded at least once; among targeted firms: faux fournisseur 42%, faux client 41%, external fraud 88%; 85% of victims had a financial loss, 19% >€10k; only 55% verify bank details, 41% call back on bank-detail change, 40% double-sign payments, 23% use detection tools, 16% have nothing; 76% of execs think AI raises fraud risk — [Allianz Trade](https://www.allianz-trade.fr/actualites/etude-fraude-2026.html)
- Cybermalveillance.gouv.fr 2025 report: 504k assistance requests; for businesses/associations: account hijacking 21%, phishing 16%, faux ordre de virement 13.5% (+93%); for local authorities FOVI +262% — [Cybermalveillance](https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites/rapport-activite-2025); [cyberveille.ch](https://cyberveille.ch/posts/2026-04-05-rapport-d-activite-2025-de-cybermalveillance-gouv-fr-etat-de-la-menace-cyber-en-france)
- FBI IC3 2025: BEC 24,768 complaints, $3.046bn losses (2024: $2.77bn); 22,364 AI-related complaints, $893M; "businesses reported losses over $30 million to BEC scams involving AI" (voice cloning explicitly cited); Financial Fraud Kill Chain froze $679M of $1.16bn (58%) — [IC3 2025 report PDF](https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf)
- Europol IOCTA 2026: fraud is the fastest-growing organised-crime area; BEC among top typologies; AI-assisted impersonation enhances BEC/CEO fraud — [Europol IOCTA 2026](https://www.europol.europa.eu/cms/sites/default/files/documents/IOCTA-2026.pdf)
- Banque de France itself warned in April 2026 about deepfake videos of its governor — [BNP Paribas Entreprises](https://banqueentreprise.bnpparibas/post/anticiper-les-risques/article/deepfake-vocal-quand-lia-reinvente-la-fraude-au-president-ffv53div536eza2reho52jl4)

### Inferences
- The French data counts "manipulation" without a B2B split; the SME signal comes from Allianz Trade + Cybermalveillance, not the OSMP.
- Voice-deepfake losses are real but tiny in official stats ($30M of $3bn BEC in the US); pitching "deepfake detection" as the core problem overstates measured impact — the measured problem is social engineering + unverified bank details.

### Gaps
- No OSMP figure separating company vs consumer transfer fraud for 2025 (only a 2024 note that corporate telematic channels have a 0.0002% fraud rate). No French figure for deepfake-voice CEO fraud volumes.

## 2. Verification of Payee (VoP) since 9 Oct 2025

### Takeaway
VoP checks only "does this name match this IBAN" (match / close match / no match / not possible). It kills the crude "paste a random IBAN" fraud but not mule accounts with matching names, shell companies, payer social-engineering, non-SEPA transfers, or corporate bulk files that opt out — and the payer can override any result at their own liability.

### Cited Findings
- Mandatory for euro-area PSPs from 9 Oct 2025, free, for SCT and SCT Inst, single and bulk; not SDD; non-euro EU PSPs by July 2027 — [Banco de España](https://clientebancario.bde.es/pcb/en/blog/nuevo-servicio-gratuito-de-verificacion-del-beneficiario-a-partir-del-9-de-octubre-de-2025-.html); [Deutsche Bank](https://corporates.db.com/in-focus/Focus-topics/instant-payments-vop/)
- Corporates may opt out for bulk files (file without VoP indicator) but not for single API payments; "a client will be able to initiate the payment" after no-match/close-match and "liability will be on client side" — [Deutsche Bank](https://corporates.db.com/in-focus/Focus-topics/instant-payments-vop/)
- Bulk VoP sits outside the EPC scheme rulebook; "close match" definition unspecified; 2026 consultation proposes a separate time limit for bulk — [EPC consultation 2026](https://www.europeanpaymentscouncil.eu/sites/default/files/kb/file/2026-03/EPC084-26%20VOP%20Scheme%20Rulebook%20-%20Public%20Consultation%20Document%20on%20Change%20Requests%20for%20v2.0.pdf); [EBA bulk analysis](https://www.abe-eba.eu/2025/09/05/implementing-vop-for-bulks-the-nightmare-before-halloween/); [IBAN.com](https://www.iban.com/verification-of-payee)
- Bypasses: mule account in a real person's name → "Match"; shell/dormant company with matching name; fraudster hands the victim the exact registered name; non-SEPA — [MonitorPay](https://monitorpay.ai/how-payment-fraud-bypasses-verification-of-payee-and-what-to-do-about-it/)
- ECB Dec 2025: rollout "smooth", short time-out spikes after 5 Oct 2025 — [ECB/EPC deck](https://www.ecb.europa.eu/paym/groups/shared/docs/43483-ami-pay-2025-12-02-3.1-epc-update-on-payment-schemes-and-vop-deployment.pdf)

### Inferences
- The post-VoP attack surface is exactly "legitimate-looking new supplier/mule + pressure on the human to click through". That is the decision moment, not the IBAN string.
- Context checks (is this change plausible? who asked? through which channel?) are not provided by VoP and are what a hackathon tool can add.

### Gaps
- No published post-launch statistics on corporate opt-out rates or fraud reduction attributable to VoP (Q4-2025 stats were due end Jan 2026; not found).

## 3. Existing solutions and gaps

### Takeaway
The B2B market is dominated by enterprise, ERP-integrated, quote-priced account-verification SaaS (Trustpair, Sis ID) and enterprise email security; the sub-200-person SME without ERP, the phone call itself, and the moment of decision are uncovered.

### Cited Findings
- Trustpair: >600 customers incl. Fortune 500; verifies account ownership at onboarding/change/pre-payment; integrates SAP, Oracle, Coupa, Kyriba; acquired by Basware (agreement 26 Aug 2026, closed 5 Oct 2026, value undisclosed) — [PR Newswire](https://www.prnewswire.com/news-releases/basware-signs-agreement-to-acquire-trustpair-302859775.html); [PYMNTS](https://www.pymnts.com/cybersecurity/fraud-prevention/2026/basware-acquires-trustpair-to-strengthen-fraud-prevention-offerings/). Pricing on quote only (Standard/Pro/Enterprise/Premium), no free trial, positioned ETI/grands groupes — [comparatif-logiciels](https://www.comparatif-logiciels.fr/logiciel/avis-trustpair/); [UGAP](https://www.ugap.fr/editeurs-logiciels/trustpair-f19841). No evidence of a supplier call-back feature (unverified).
- Sis ID (Lyon): community database of ~10k companies, Series A €5M in Jan 2021 (BNP Opera Tech, Bpifrance); no newer round found — [Bpifrance](https://presse.bpifrance.fr/la-fintech-francaise-sis-id-annonce-une-levee-de-fonds-de-5-millions-deuros-en-serie-a)
- Libeo: IBAN↔SIREN check and alert on supplier RIB change — [Libeo](https://libeo.io/blog/factures/securisation-paiements-et-gestion-factures). Pennylane: email alert when supplier IBAN edited, "no full validation workflow yet" (third-party) — [BLC Conseil](https://blc-conseil.com/blog/securite-rib-pennylane-change-la-donne-pour-les-pme/). Qonto: SCA on payments; no payee-name check documented — [Pennylane help](https://help.pennylane.com/fr/articles/18803-payer-les-factures-avec-qonto)
- Voice-deepfake vendors: Pindrop Pulse (live calls, custom pricing), Reality Defender (50 free scans/month, API), GetReal Security (contact sales); enterprise pricing "starts in the thousands per month" (secondary source) — [Reality Defender](https://www.realitydefender.com/); [fast.io](https://fast.io/resources/best-deepfake-detectors-2026/); [KHABY](https://khaby.ai/alternatives/pindrop/)
- Only 23% of French firms use detection/cyber tools; 16% have no measure — [Allianz Trade](https://www.allianz-trade.fr/actualites/etude-fraude-2026.html)

### Inferences
- Trustpair/Sis ID verify the account; email-security vendors (Abnormal, Proofpoint, Darktrace — not researched here, see gaps) verify the email. Nobody verifies the request in context for an SME: urgency, channel, requester, deviation from history, and nobody does the callback for them.
- Basware buying Trustpair confirms "invoice→payment" is the hot gap; a jury will know the name.

### Gaps
- No pricing or SMB tier found for Trustpair, Sis ID, Pindrop, GetReal; Abnormal/Darktrace/Proofpoint/Microsoft not individually verified in this pass (assume enterprise email-only, flag as unverified).

## 4. Reliability of real-time voice-deepfake detection (2026)

### Takeaway
Commercial detectors claim 95–99% on curated English benchmarks; open models trained on ASVspoof 2019 score 48–63%; one open-weights model (pellav2, MIT, ~300M params, HF `Sadanie/pellav2-audio-deepfake-detector`) reaches ~96% but is English-only, untested on telephony, and raises false positives on noisy audio.

### Cited Findings
- Podonos benchmark (29 Sep 2026, 4,524 English clips, ~25 TTS systems): Resemble DETECT-World 99.47% (FPR 0.7%), Whispeak 97.7%, Pindrop 95.05% (FPR 6.2%), Hive 83.5%, Reality Defender FPR 53.7%; pellav2 95.82% (FPR 5.5%, 57 ms); other open models 47.6–62.9%; AST trained on ASVspoof 5: 56.8%; telephony (8 kHz, G.711/GSM/AMR) tracks empty at publication — [Podonos](https://www.podonos.com/blog/audio-deepfake-detection-benchmark); [Resemble](https://www.resemble.ai/resources/audio-deepfake-detection-benchmark-results-how-8-systems-performed-in-2026) (vendor-run; treat with caution)
- pellav2 model card: MIT, EER 1.9% on DFADD but 10.9% on In-The-Wild; "not evaluated on non-English"; noisy audio raises FPs — [Hugging Face](https://huggingface.co/Sadanie/pellav2-audio-deepfake-detector)
- Cross-lingual: RawGAT-ST/Whisper+AASIST "insufficient cross-lingual generalization", though French scored better than English for some models; SSL foundation models generalise better — [SPSC 2025](https://www.isca-archive.org/spsc_2025/marek25_spsc.pdf); [ACM survey](https://dl.acm.org/doi/10.1145/3736765)
- ASVspoof 5 crowdsourced data has label-quality/reproducibility issues — [arXiv 2608.15411](https://arxiv.org/pdf/2608.15411)

### Inferences
- A live-call detector built in 18 h on French, codec-degraded audio will be unreliable and a jury may test it with a real voice; present audio scoring as one weak signal, not the verdict. Reality Defender's free tier (50 scans) is a cheap demo signal.

### Gaps
- No independent field study on live phone calls or French; no latency-validated open model for streaming.

## 5. Realistic customer

### Takeaway
The buyer is the DAF/comptable of a 20–200-person SME (or the expert-comptable firm acting for many of them) who today relies on email, a bank portal, Pennylane/Qonto/Libeo, and an informal "call the supplier" rule.

### Cited Findings
- 55% of firms verify bank details, 41% call back on change, 40% double-validate; TPE 27% insured vs large 74% — [Allianz Trade](https://www.allianz-trade.fr/actualites/etude-fraude-2026.html)
- Recommended SME protocol: call back on the historical number, segregation (creator ≠ approver), thresholds (e.g. €5k), no general legal obligation for double validation — [Hayot Expertise](https://hayot-expertise.fr/blog/fraude-virement-pme-protocole-anti-fraude-2026); [Eur'Net](https://eurenet.fr/double-validation-virement/)
- Loss allocation: Cass. com. 2 Oct 2024 — bank liable for "anomalies apparentes" (7 transfers, €2.12M to Hong Kong); CA Douai 22 Jan 2026 — authentic orders to an EU account: company bears €80.9k — [Kohen Avocats](https://kohenavocats.fr/2026/09/27/intelligence-artificielle-danger-exemple-fraude-faux-dirigeant-deepfake-virements-recours-2026/)

### Inferences
- Since the SME bears the loss when orders are "authentic", the SME (not the bank) has the incentive to buy a pre-authorisation check; the expert-comptable is a plausible multiplier channel.

### Gaps
- No survey on SME willingness to install a new tool; adoption claims would be inference.

## 6. Most defensible, demoable angle

### Takeaway
A "payment-request guardian" agent for SMEs: intercept any new-beneficiary / RIB-change / urgent-transfer request (email, PDF invoice, transcript of a call), score it on context (urgency language, channel, sender domain age, deviation from supplier history, VoP-style name/SIREN check, optional audio-deepfake score), then run a graduated response (hold → automated out-of-band callback on the known number with a challenge → second approver → release) and produce an explainable audit trail.

### Cited Findings
- Hackathon track wording matches: context of unusual transfer, graduated response (step-up, hold, freeze, alert) — (brief, not web-sourced)
- What VoP does not do (status, history, context, non-SEPA) — [MonitorPay](https://monitorpay.ai/how-payment-fraud-bypasses-verification-of-payee-and-what-to-do-about-it/); what Trustpair does (account ownership, ERP) — [PR Newswire](https://www.prnewswire.com/news-releases/basware-signs-agreement-to-acquire-trustpair-302859775.html)
- Fraud attempts concentrate on faux fournisseur (42%) and succeed 40% of the time; only 41% call back — [Allianz Trade](https://www.allianz-trade.fr/actualites/etude-fraude-2026.html)

### Inferences
- Genuinely new vs Trustpair: (a) no ERP, works on an inbox/Drive/Pennylane export; (b) covers the social-engineering layer (request plausibility, urgency, callback execution, voice signal) rather than only the account; (c) red-team demo: generate the attack (cloned-voice call + spoofed RIB-change email) against your own fake SME and show the agent stopping it — fits the "attack and defend agentic systems" theme.
- Not new: pure IBAN/name check (VoP, Libeo), pure email filter, pure deepfake detector.

### Gaps
- No public data on VoP/SIREN API access for non-PSPs; use open data (INSEE Sirene, IBAN structure/BIC checks) and mock bank responses in the demo.

## 7. Barriers to entry

### Takeaway
Legal constraints bite on voice: recording and voice-print extraction need explicit, specific consent (GDPR art. 9 if biometric; CNIL: staying on the line ≠ consent; ~6-month retention cap cited by secondary sources); AI Act art. 50 transparency applies from Aug 2026. Bank integration is unnecessary for a demo but blocks production (PSD2 licence/VoP API access).

### Cited Findings
- Voice print = biometric data; consent must be explicit and specific — [TALKR](https://www.talkr.ai/blog/securite-ethique/donnees-biometriques-vocales-rgpd-article-9-empreinte-vocale-consentement-2026.html); CNIL: remaining online is not consent; 6-month retention (secondary) — [Dialer.fr](https://dialer.fr/recommandations-officielles-de-la-cnil-pour-lenregistrement-des-appels-en-2026/)
- AI Act art. 50 marking of synthetic voice/deepfakes from Aug 2026 — [Nerolia](https://nerolia-ai.fr/blog/agent-vocal-ia-france-rgpd-conformite-legale) (secondary; verify on EUR-Lex)
- VoP is a PSP-side service; single API payments cannot opt out; corporates bear liability on override — [Deutsche Bank](https://corporates.db.com/in-focus/Focus-topics/instant-payments-vop/)

### Inferences
- Design the demo so audio is analysed for "synthetic vs real" without building a voice print (binary classifier, no speaker ID), with on-screen consent, to pre-empt GDPR questions from a KPMG/GitGuardian jury.

### Gaps
- No CNIL guidance specific to deepfake-detection tools found; AI Act classification of anti-fraud voice analysis (likely not "high-risk" but unverified).
