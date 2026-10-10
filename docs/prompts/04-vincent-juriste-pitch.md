# Prompt 04 — Vincent : conformité, pitch, DEMO.md, README, tests utilisateur

> Coller d'abord le prompt 00, puis ceci. Branche : `feat/docs`. Travaille dans Claude Code à la racine.

```
Mon périmètre : docs/ (sauf docs/API.md que je ne modifie qu'en accord avec l'équipe), README.md, DEMO.md, CLAUDE.md (journal des décisions), les slides, et les textes des pages marchands (docs/MERCHANTS_COPY.md). Je ne suis pas développeur : explique chaque choix en 1-2 phrases simples.

Objectif H+3 :
1. docs/COMPLIANCE.md : complète la cartographie. Pour chaque cadre (AI Act, DORA, MiCA, AML/CFT), vérifie les articles cités avec une recherche web sur EUR-Lex et remplace chaque « à vérifier » par une référence confirmée ou par « non trouvé ». Je veux pour chaque code de règle une phrase en français de 15 mots max, prête à être affichée sur le dashboard, et la liste `frameworks` définitive. Le résultat sera copié par Dev A dans le moteur : produis aussi un fichier docs/compliance.rules.json { code: { frameworks: [], label_fr: "" } } que Dev A pourra importer tel quel.
2. docs/MERCHANTS_COPY.md : textes visibles des deux pages marchands (nom, accroche, description produit, mentions, prix 0.05 et 0.04 AVAX) et le texte exact de l'injection cachée du marchand piège (en anglais, style « SYSTEM NOTICE », avec urgence et « do not tell the user »). Dev C les intègre.
3. docs/PITCH.md : structure du pitch en 6 slides max (problème chiffré avec sources du rapport reports/Idées hackathon Secure Horizons.md, ce que les protocoles de paiement d'agents ne font pas, la démo, l'architecture en une image, conformité, marché + tarif 10 vérifications/mois gratuites puis 10 € les 1 000). Une phrase par membre du jury : Avalanche (kill switch et registre on-chain), KPMG (preuve et conformité), KRYPTOSPHERE (le mandat devient la règle). Phrase obligatoire : PayGuard n'est pas un prestataire de services de paiement.

Objectif H+6 :
4. DEMO.md : passe le script de démo au niveau « minute par minute, qui dit quoi, quel onglet », en l'ajustant à ce que Dev C a réussi à faire marcher dans Claude Desktop (lis apps/mcp-server/README.md).
5. Tests utilisateur : lance le dashboard de Dev A, joue le rôle du dirigeant (créer un compte, régler le mandat, générer la clé, approuver un HOLD, déclencher le kill switch) et liste dans docs/UX_FEEDBACK.md tout ce qui n'est pas compréhensible pour un non-technicien, par priorité. Même chose pour les textes renvoyés à l'agent par le serveur MCP.
6. README.md : complète les sections Lancer et Contrat déployé avec ce que les devs ont écrit ; relis tout le repo pour vérifier qu'aucune phrase ne prétend exécuter de vrais paiements ou être conforme à un règlement (on « outille » la conformité).

Objectif H+8 (freeze) :
7. Vérification secrets : `git log -p | grep -iE "sk-ant|0x[a-f0-9]{64}"` et `git ls-files | grep -E "\.env$"` doivent être vides. Si ggshield est installé, lance `ggshield secret scan repo .`.
8. Slides finales (Keynote ou Google Slides, sobres, une idée par slide), et enregistrement vidéo de secours du happy path avec Dev C.

Renfort dashboard (seulement si Dev A le demande à H+5) : je peux construire les pages /dashboard/policy et /dashboard/api-keys en suivant exactement docs/API.md §4, dans apps/web/src/app/dashboard/, sans toucher au moteur de décision ni aux routes API. Dans ce cas, dis-moi d'abord quels fichiers Dev A a déjà créés pour ne rien écraser.
```
