# Prompts de démarrage

Chacun ouvre Claude Code à la racine du repo et colle **00 + son numéro** dans le premier message.

| Fichier | Pour qui | Quand |
|---|---|---|
| `00-shared-context.md` | tout le monde | en tête de chaque prompt |
| `01-dev-a-backend-api.md` | Dev A | H+0 (après le squelette) |
| `02-dev-b-blockchain.md` | Dev B | H+0 |
| `03-dev-c-mcp-merchants-demo.md` | Dev C | H+0 |
| `04-vincent-dashboard-pitch.md` | Vincent | H+0, **le premier** : il crée le squelette Next.js |
| `05-integration-freeze.md` | tout le monde | H+6, puis au freeze |

Conseils :
- Laisse Claude te présenter son plan et dis « go » seulement s'il correspond à `docs/PLAN.md`.
- Un commit dès qu'une étape marche. Une PR vers `main` à chaque jalon (Dev A merge).
- Si Claude veut modifier `packages/shared` ou `docs/API.md`, préviens le groupe avant.
