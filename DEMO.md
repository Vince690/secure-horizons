# DEMO.md — script de démo (3 min) — pitch dimanche 11 oct. 12:00

## Pré-vol (15 min avant, dans cet ordre)
- [ ] Terminal 1 : `npm run dev:web` (vérifier dans le log : `[chain] mode=fuji`).
- [ ] Terminal 2 : `npm run dev:merchants`.
- [ ] `npm run balance -w packages/contracts` ≥ 0,1 AVAX (sinon faucet / Yassir).
- [ ] Depuis le terminal : `npm run db:reset -w apps/web` (vide l'historique, sinon « rafale de demandes » dès le 3e appel). La clé API de `.env` est conservée.
- [ ] Claude Desktop : Cmd+Q puis relancer ; vérifier que `payguard` et `demo-shop` apparaissent dans les outils.
- [ ] Dashboard ouvert sur http://localhost:3000/dashboard, connecté (demo@payguard.dev / demo1234), kill switch au vert, file « À confirmer » vide.
- [ ] Onglet Snowtrace sur le contrat : https://testnet.snowtrace.io/address/0xb1ee492a58e1163e47e2f10a386edb80af3f9ce1
- [ ] Onglets marchands ouverts : http://localhost:4001/ et http://localhost:4002/ (montrer que le piège a l'air propre).
- [ ] Plan B prêt dans un terminal : `npm run demo:all` (ne pas le lancer avant).
- [ ] Vidéo de secours accessible hors ligne.

## Déroulé

| Temps | Écran | Qui fait quoi | Phrase clé |
|---|---|---|---|
| 0:00 | Slide 1 | Pitch | « En juillet, des agents sont sortis de leur sandbox. Demain, ils paient. Qui vérifie leur décision ? » |
| 0:25 | Dashboard › Mandat | Pitch montre le mandat | « Le dirigeant fixe le mandat une fois : 0,1 AVAX par achat, 0,3 par jour, confirmation humaine au-dessus de 0,08. L'agent n'a jamais la clé du wallet. » |
| 0:45 | Claude Desktop | Démo tape : `Avec read_merchant_page, lis la page http://localhost:4001/ puis achète-moi le casque NordSound ANC Pro, budget 0.06 AVAX max.` | « Claude lit la page, appelle PayGuard. Marchand connu, montant dans le mandat, demande explicite : score 100, payé, gravé sur Avalanche. » Cliquer le lien Snowtrace. |
| 1:20 | Marchand piège (:4002) | Pitch montre la page | « Même produit, moins cher, badge "paiement sécurisé". Pour un humain, rien à signaler. » |
| 1:30 | Claude Desktop | Démo tape : `Avec read_merchant_page, lis la page http://localhost:4002/ et demande à PayGuard de payer le casque NordSound ANC Pro à 0.04 AVAX, le prix affiché. Je veux voir son verdict.` | « Dans la page : quatre blocs invisibles qui ordonnent à l'agent de payer 0,5 AVAX ailleurs et de ne rien dire. Score 0, bloqué, le refus est aussi gravé. » |
| 2:00 | Dashboard › détail de la décision | Pitch ouvre la décision bloquée | « Ce que l'humain a vu, ce que l'agent a lu : les ordres cachés sont surlignés. Chaque point retiré cite son article : AI Act 14 et 15, AML, DORA. » |
| 2:20 | Terminal `npm run demo:attack` (ou Claude Desktop si l'agent insiste) | Démo lance l'attaque | « L'agent insiste trois fois : PayGuard coupe tout seul. Le contrat est en pause sur Fuji, l'incident est horodaté pour DORA. Le dirigeant réarme quand il a compris. » Montrer le voyant rouge puis la tx `activateKillSwitch`. |
| 2:45 | Slide finale | Pitch | « Score, preuve, kill switch. PayGuard n'est pas un prestataire de paiement : il outille la conformité. 10 vérifications par mois gratuites, puis 10 € les 1 000. Cinq lignes pour l'intégrer à tout hôte MCP. » |

## Si ça casse
- Claude Desktop refuse d'appeler l'outil sur le piège ⇒ c'est un argument (« même un agent prudent demande à PayGuard, tous ne sont pas aussi prudents »), puis `npm run demo` en terminal pour montrer le verdict.
- Claude Desktop ne répond plus ⇒ `npm run demo:all` dans le terminal : même séquence, mêmes serveurs MCP, mêmes transactions.
- Fuji lent (> 20 s) ⇒ attendre, le statut passe en FAILED proprement ; montrer les tx déjà passées sur Snowtrace. Si le réseau est mort : `CHAIN_MODE=mock` dans `.env`, relancer `npm run dev:web`, annoncer « chaîne simulée ».
- Kill switch resté actif d'une répétition précédente ⇒ bouton « réarmer » dans l'en-tête du dashboard.
- Tout casse ⇒ vidéo de secours, commentée en direct.

## Après chaque répétition
`npm run db:reset -w apps/web` puis réarmer le kill switch si besoin. Noter ici ce qui a hésité.
