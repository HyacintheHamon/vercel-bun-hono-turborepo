# vercel-bun-hono-turborepo

Monorepo [Turborepo](https://turborepo.com) utilisant [Bun](https://bun.sh) comme package manager, avec :

- **`apps/api`** — API [Hono](https://hono.dev) (dev local sous Bun, déployable sur Vercel via l'adapter `hono/vercel`)
- **`apps/web`** — App [Next.js](https://nextjs.org) (App Router, TypeScript, Tailwind CSS v4)
- **`packages/shared`** — Types TypeScript partagés entre l'API et le front
- **`packages/typescript-config`** — Configurations `tsconfig` communes

## Prérequis

- [Bun](https://bun.sh) ≥ 1.2

## Démarrage

```bash
bun install
bun run dev
```

- Web : http://localhost:3000
- API : http://localhost:3001

## Routes de l'API

| Route              | Réponse                                                        |
| ------------------ | -------------------------------------------------------------- |
| `GET /`            | Statut de l'API, runtime détecté et version de Bun              |
| `GET /api/hello`   | Message d'exemple typé avec `HelloResponse` de `@repo/shared`   |
| `GET /api/example` | Démo des alias d'import (voir plus bas)                         |

```bash
curl http://localhost:3001/
# {"success":true,"message":"Hono API is running on Bun 1.3.11",
#  "data":{"runtime":"bun","bunVersion":"1.3.11"}}
```

> **Note** — Sur Vercel, Bun sert à installer les dépendances, mais les
> Vercel Functions s'exécutent sous le runtime **Node**. La route `/` renvoie
> donc `{"runtime":"node","bunVersion":null}` en production : c'est attendu.

## Scripts

| Commande              | Description                              |
| --------------------- | ---------------------------------------- |
| `bun run dev`         | Lance l'API et le front en parallèle     |
| `bun run build`       | Build toutes les apps                    |
| `bun run check-types` | Vérifie les types de tous les workspaces |

## Déploiement sur Vercel

Crée **deux projets Vercel** pointant vers ce même dépôt GitHub. Vercel détecte `bun.lock` et installe les dépendances avec Bun, et détecte Turborepo automatiquement.

### 1. Projet API (`apps/api`)

- **Root Directory** : `apps/api`
- Toutes les requêtes sont réécrites vers la Vercel Function `api/index.ts` (voir `apps/api/vercel.json`), qui sert l'app Hono.
- Variable d'environnement recommandée :
  - `CORS_ORIGIN` = URL du projet web (ex. `https://mon-front.vercel.app`)

### 2. Projet Web (`apps/web`)

- **Root Directory** : `apps/web`
- Framework préréglé : Next.js (détecté automatiquement)
- Variable d'environnement :
  - `NEXT_PUBLIC_API_URL` = URL du projet API (ex. `https://mon-api.vercel.app`)

## Alias d'import

Fini les `../../lib/foo`. Chaque app expose un alias `@/`, déclaré dans son
`tsconfig.json` (clé `paths`) :

| Alias           | Résout vers      | App        |
| --------------- | ---------------- | ---------- |
| `@/*`           | `apps/api/src/*` | `apps/api` |
| `@/*`           | `apps/web/*`     | `apps/web` |
| `@repo/shared`  | `packages/shared` | partout   |

```ts
// apps/api/src/app.ts
import { bunVersion, runtime } from "@/lib/runtime";
import example from "@/routes/example";

// apps/web/app/page.tsx
import ApiStatus from "@/components/api-status";
import { fetchHello } from "@/lib/api";
```

Fichiers d'exemple fournis, tous branchés pour de vrai (pas de code mort) :

- `apps/api/src/routes/example.ts` — route `GET /api/example`, consomme `@/lib/runtime`
- `apps/api/src/lib/runtime.ts` — détection du runtime
- `apps/web/lib/api.ts` — helpers de fetch typés vers l'API
- `apps/web/components/api-status.tsx` — composant consommant `@/lib/api`

Côté résolution : Bun et Next.js lisent `paths` nativement, et Vercel bundle
les Functions avec esbuild, qui le lit aussi. Le même import fonctionne donc en
dev comme en production.

## Structure

```
apps/
  api/          # Hono — src/app.ts (routes), src/index.ts (dev Bun), api/index.ts (Vercel)
  web/          # Next.js — appelle l'API et affiche la réponse
packages/
  shared/       # Types partagés (ApiResponse, HelloResponse…)
  typescript-config/
```
