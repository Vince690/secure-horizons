# Feuille de route — rails de paiement et agent acheteur autonome

Décidé le 11 octobre 2026 à 03:40, pendant le hackathon. Ce document sert au pitch et au travail d'après.

## Principe invariant

PayGuard **décide et instruit**, un acteur agréé **exécute**, Avalanche **prouve**. PayGuard ne détient jamais les fonds : c'est ce qui le maintient dans le statut de prestataire technique (DSP2 art. 3 j), à vérifier dans l'analyse juridique) et hors de l'agrément de prestataire de services de paiement. Quel que soit le rail, la décision, le mandat, le kill switch, le journal d'audit, l'ancrage du hash sur Avalanche et le dashboard sont les mêmes.

## Trois couches de sécurité (règle pour tous les rails)

1. **Décision contrôlée** : le moteur de règles + le mandat du dirigeant + le second avis sémantique.
2. **Secret jamais exposé à l'agent** : l'agent lit des pages non fiables, il ne voit ni clé de wallet, ni numéro de carte. Un composant PayGuard de confiance paie à sa place ; l'agent ne reçoit qu'un reçu.
3. **Dégâts bornés par le rail** : carte à usage unique plafonnée au montant exact, verrouillée sur un marchand, expiration courte ; ou transfert on-chain du montant exact.

## Rails

| Rail | Statut | Qui est agréé | Où est l'argent | Notes |
|---|---|---|---|---|
| **Avalanche Fuji, AVAX** | ✅ en place (hackathon) | n/a (testnet) | wallet gardien dédié | Contrat `PayGuardLedger` : paiement + ancrage + kill switch on-chain. Reste la **couche de preuve** de tous les autres rails. |
| **Carte virtuelle « connecte ton compte »** (Revolut Business, Qonto, Swan…) | 🎯 **priorité phase 2** | la banque du client | compte bancaire du client | Le client autorise PayGuard via l'API de sa banque. À chaque approbation : carte virtuelle à usage unique, plafond = montant approuvé, catégorie marchand verrouillée, expiration courte. Kill switch = gel de toutes les cartes. Zéro inscription pour le client. **À vérifier dès lundi : création de cartes virtuelles par l'API Revolut Business et son bac à sable.** |
| **Carte virtuelle « on fournit »** (Stripe Issuing via sous-comptes Connect) | phase 2 bis | Stripe | sous-compte Stripe du client | Pour les clients sans banque compatible. Autorisation en temps réel : Stripe appelle PayGuard à chaque débit, le moteur de règles tranche une seconde fois. |
| **EURC** (euro tokenisé de Circle, émis sous MiCA) sur Avalanche | phase 3 | Circle (EMI) | wallet du client ou du gardien | Même mécanique qu'AVAX en ERC-20. Détenir les jetons du client ferait de PayGuard un prestataire MiCA : préférer un wallet du client avec autorisation limitée (allowance). Testnet : EURC de test si Circle le fournit, sinon jeton de test étiqueté. |
| Virement initié (Fintecture, Powens, Bridge) | phase 3 | l'agrégateur (PISP) | compte du client | Jamais autonome : le client confirme dans l'appli de sa banque. Rail naturel pour les HOLD. |

## Agent acheteur autonome

Objectif : « cherche-moi X au meilleur prix et achète-le ». L'agent cherche (recherche web de l'hôte), PayGuard **évalue chaque site** (`check_merchant`) et **classe les offres** (`find_best_offer`) : la meilleure offre parmi les sites de confiance gagne, les sites frauduleux sont écartés avec leurs raisons, le paiement passe par `request_payment` comme aujourd'hui.

Signaux d'un site (en plus des signaux de page déjà en place) : HTTPS, âge du domaine (RDAP), extension à risque, imitation d'une marque connue ou d'un marchand de confiance, mentions légales (RCS / SIREN), cohérence de l'e-mail de contact, prix trop beau pour être vrai par rapport aux autres offres, texte invisible, injection.

Interaction avec les sites réels (Amazon…) : possible via un navigateur piloté (Claude in Chrome, computer use), fragile sur les grands sites (anti-bots, 2FA, CGU). En production : parcours partenaires « payer avec PayGuard » et extension qui injecte la carte à la caisse sans la montrer à l'agent.

## Phases

- **A (avant le pitch)** : `check_merchant` + `find_best_offer` + 3e marchand de démo ; abstraction `PaymentRail` si le temps le permet ; slides « Rails » et « Trois couches ».
- **B (semaine suivante)** : rail carte « connecte ton compte » sur bac à sable Revolut Business ; sinon Stripe Issuing test ; composant de remplissage sécurisé ; réconciliation débit ↔ décision ↔ ancrage.
- **C** : EURC ; Avalanche confirmé comme couche de preuve commune.
- **D (juridique, Vincent)** : qualification prestataire technique, mandats, MiCA si EURC, responsabilité et valeur probante de l'ancrage.
