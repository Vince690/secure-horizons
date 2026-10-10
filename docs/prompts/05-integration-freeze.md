# Prompt 05 — à partir de H+6 : intégration, puis freeze (pour tous)

> À coller (après le prompt 00) quand sa brique est terminée et qu'on assemble.

```
Nous entrons en phase d'intégration. Mon périmètre reste le même, mais je dois maintenant faire marcher la chaîne complète : Claude Desktop → serveur MCP → API → moteur → contrat Fuji → dashboard.

1. Lance tout en local (npm run dev:web, npm run dev:merchants, Claude Desktop) et rejoue le scénario de docs/PLAN.md « Démo cible » dans l'ordre : légitime (APPROVED), piège (BLOCKED), un HOLD approuvé à la main, kill switch auto après 3 piégés.
2. À chaque échec, trouve la brique responsable à partir des logs, et si elle n'est pas dans mon périmètre, écris-moi un message prêt à coller dans le groupe : « [brique] : symptôme, cause probable, correction proposée ». Ne corrige pas le code des autres.
3. Dans mon périmètre : corrige, teste, commit.
4. Vérifie que les explications LLM du scénario de démo sont en cache (deux exécutions identiques ne doivent pas rappeler l'API).

À partir du moment où je dis « freeze » : plus AUCUNE nouvelle fonctionnalité, même petite. Uniquement : corrections de bugs du scénario de démo, messages d'erreur propres, README et DEMO.md à jour, suppression du code mort, vérification zéro secret. Si je te demande une feature après « freeze », rappelle-moi la règle et demande confirmation.
```
