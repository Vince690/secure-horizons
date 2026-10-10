# PayGuard — cartographie réglementaire (à compléter par le juriste)

> Objectif : chaque règle du moteur (`docs/API.md` §5) cite le texte qu'elle sert. Le dashboard
> affiche ces références ; le pitch les reprend. **Vérifier chaque article sur EUR-Lex avant de
> l'afficher.** Les lignes marquées « à vérifier » sont des hypothèses de départ, pas des faits.

## 1. Cadres et ce qu'ils attendent d'un gardien de paiement agentique

| Cadre | Texte | Ce qui nous concerne | Où PayGuard répond |
|---|---|---|---|
| **AI Act** | Règl. (UE) 2024/1689 | Art. 12 : journalisation automatique des événements (traçabilité). Art. 14 : contrôle humain effectif, possibilité d'interrompre le système (« bouton d'arrêt »). Art. 9 : gestion des risques. | Audit log chaîné + ancrage on-chain (Art. 12) ; HOLD + confirmation dashboard + kill switch (Art. 14) ; score et règles documentées (Art. 9) |
| **DORA** | Règl. (UE) 2022/2554 | Art. 17 : processus de gestion des incidents TIC. Art. 19 : notification des incidents majeurs (délais 4 h / 24 h / 72 h / 1 mois, à vérifier dans le RTS). Art. 9 : protection et prévention. | Kill switch automatique horodaté = incident détecté ; panneau DORA avec horodatage de l'incident et compte à rebours de notification |
| **MiCA** | Règl. (UE) 2023/1114 | Obligations des prestataires de services sur crypto-actifs : sauvegarde des fonds des clients, tenue de registres, contrôle des risques (articles exacts **à vérifier**, Titre V). | Solde plancher (`min_balance`), plafonds par transaction / jour, registre on-chain des mouvements |
| **AML/CFT** | Directive (UE) 2015/849 (AMLD5), Règl. (UE) 2024/1624 (AMLR), Règl. (UE) 2023/1113 (transferts de fonds / travel rule crypto) | Connaissance du bénéficiaire, vigilance renforcée en cas d'anomalie, conservation des données de transaction, signalement d'opérations suspectes. | Registre de bénéficiaires de confiance, détection domaine imitant / changement de destinataire, vélocité, trace complète par décision |

Mention obligatoire dans le pitch : **PayGuard n'est pas un prestataire de services de paiement**. Il contrôle et exécute sur testnet pour la démo ; en production il recommande et l'exécution reste chez l'entité agréée. Ne jamais prétendre être conforme : on *outille* la conformité.

## 2. Règle → cadre (reprise dans `Reason.frameworks`)

| Code règle | Cadres | Justification courte (pour le dashboard, FR, 1 phrase) |
|---|---|---|
| `KILL_SWITCH_ACTIVE` | AI_ACT, DORA | Contrôle humain et arrêt d'urgence (AI Act art. 14) ; incident TIC en cours (DORA art. 17). |
| `RECIPIENT_BLOCKLISTED` | AML_CFT | Bénéficiaire interdit par le titulaire du compte. |
| `MIN_BALANCE_BREACH` | MiCA | Préservation des fonds du client (à vérifier : MiCA Titre V). |
| `AMOUNT_OVER_TX_LIMIT` | MiCA, AML_CFT | Dépassement du mandat ; seuil de vigilance. |
| `DAILY_LIMIT_EXCEEDED` | AML_CFT | Fractionnement / cumul anormal sur 24 h. |
| `PROMPT_INJECTION_SUSPECTED` | AI_ACT, DORA | Manipulation de la décision de l'agent : risque de sécurité du système d'IA (AI Act art. 15, à vérifier) et incident TIC. |
| `PURPOSE_NOT_REQUESTED_BY_USER` | AI_ACT | L'agent sort du mandat humain : contrôle humain (art. 14). |
| `RECIPIENT_CHANGED_MID_CONVERSATION` | AML_CFT | Schéma classique de fraude au changement de coordonnées. |
| `DOMAIN_LOOKALIKE` | AML_CFT | Usurpation d'identité d'un marchand connu. |
| `RECIPIENT_UNKNOWN` | AML_CFT | Bénéficiaire non identifié : vigilance. |
| `VELOCITY_ANOMALY` | AML_CFT, DORA | Rafale de demandes : comportement anormal de l'agent. |
| `PRICE_ANOMALY` | MiCA | Montant incohérent avec l'historique ou le budget énoncé. |
| `URGENCY_LANGUAGE` | AML_CFT | Signal faible de pression sociale. |

## 3. Score de confiance : lecture pour le jury

- 100 → 70 : **APPROVED**, exécuté, tracé.
- 69 → 40 : **HOLD**, un humain tranche, traçé.
- < 40 : **BLOCKED**, tracé, et compte pour le kill switch automatique.
- Le score n'est pas une boîte noire : chaque point retiré a un code, une phrase et un texte de référence.

## 4. Questions ouvertes (à trancher avant le pitch)

- [ ] Articles MiCA exacts pour la sauvegarde des fonds et la tenue de registres.
- [ ] Délais DORA de notification : confirmer dans le RTS d'exécution (numéro à vérifier sur EUR-Lex).
- [ ] L'exemption « service technique » de DSP2/DSP3 pour une couche de contrôle qui n'initie pas en production.
- [ ] Qualification juridique de la décision hachée on-chain comme commencement de preuve (art. 1366 Code civil, à vérifier).
