# DEMO.md — script de démo (3 min) — à affiner après chaque répétition

## Pré-vol (15 min avant)
- [ ] `.env` rempli, `npm run dev:web`, `npm run dev:merchants`, Claude Desktop relancé avec les 2 serveurs MCP.
- [ ] Wallet gardien ≥ 1 AVAX test. Kill switch désactivé. File HOLD vide.
- [ ] Onglets ouverts : dashboard, Snowtrace sur l'adresse du contrat, pages marchands.
- [ ] Vidéo de secours accessible hors ligne.
- [ ] Explications LLM déjà en cache (lancer le happy path une fois).

## Déroulé

| Temps | Qui | Action | Phrase clé |
|---|---|---|---|
| 0:00 | Pitch | Slide 1 | « En juillet, des agents sont sortis de leur sandbox. Demain, ils paient. Qui vérifie leur décision ? » |
| 0:25 | Démo | Dashboard : mandat et clé API | « Le dirigeant fixe le mandat une fois. L'agent n'a jamais la clé. » |
| 0:45 | Démo | Claude Desktop : achat légitime | « Marchand connu, montant dans le mandat, demande explicite : approuvé, exécuté, gravé sur Fuji. » |
| 1:25 | Démo | Claude Desktop : marchand piège | « Même produit, moins cher… domaine imitant, instruction cachée, wallet inconnu : bloqué. Le refus aussi est une preuve. » |
| 2:05 | Démo | Dashboard : kill switch auto + conformité | « Trois blocages : le contrat se met en pause tout seul. Incident horodaté pour DORA. » |
| 2:35 | Pitch | Slide finale | « Score, preuve, kill switch. 10 vérifications gratuites par mois, puis 10 € les 1 000. 5 lignes pour l'intégrer. » |

## Si ça casse
- Claude Desktop bloque ⇒ `npm run demo -w apps/demo-agent` (même séquence en terminal).
- Fuji ne répond pas ⇒ montrer les tx déjà passées sur Snowtrace + vidéo.
- Tout casse ⇒ vidéo de secours, et on commente par-dessus.
