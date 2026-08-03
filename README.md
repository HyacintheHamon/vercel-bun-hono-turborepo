# vercel-bun-hono-turborepo

Monorepo [Turborepo](https://turborepo.com) tournant sous [Bun](https://bun.sh) —
package manager en local, **runtime des Functions** sur Vercel :

- **`apps/api`** — API [Hono](https://hono.dev), servie par le runtime Bun de Vercel
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

| Route              | Réponse                                                       |
| ------------------ | ------------------------------------------------------------- |
| `GET /`            | Statut de l'API, runtime détecté et version de Bun             |
| `GET /api/hello`   | Message d'exemple typé avec `HelloResponse` de `@repo/shared`  |
| `GET /api/example` | Démo des alias d'import (voir plus bas)                        |

```bash
curl http://localhost:3001/
# {"success":true,"message":"Hono API is running on Bun 1.3.11",
#  "data":{"runtime":"bun","bunVersion":"1.3.11"}}
```

Le runtime Bun étant activé sur Vercel, cette réponse est la même en production.

## Scripts

| Commande              | Description                              |
| --------------------- | ---------------------------------------- |
| `bun run dev`         | Lance l'API et le front en parallèle     |
| `bun run build`       | Build toutes les apps                    |
| `bun run check-types` | Vérifie les types de tous les workspaces |

## Alias d'import

Fini les `../../lib/foo`. Chaque app expose un alias `@/`, déclaré dans les
`paths` de son `tsconfig.json` :

| Alias          | Résout vers       | App        |
| -------------- | ----------------- | ---------- |
| `@/*`          | `apps/api/src/*`  | `apps/api` |
| `@/*`          | `apps/web/*`      | `apps/web` |
| `@repo/shared` | `packages/shared` | partout    |

```ts
// apps/api/src/app.ts
import { bunVersion, runtime } from "@/lib/runtime";
import example from "@/routes/example";

// apps/web/app/page.tsx
import ApiStatus from "@/components/api-status";
import { fetchHello } from "@/lib/api";
```

Fichiers d'exemple fournis, tous branchés pour de vrai (pas de code mort) :

- `apps/api/src/lib/runtime.ts` — détection du runtime
- `apps/api/src/routes/example.ts` — route `GET /api/example`, consomme `@/lib/runtime`
- `apps/web/lib/api.ts` — helpers de fetch typés vers l'API
- `apps/web/components/api-status.tsx` — composant consommant `@/lib/api`

> **À savoir** — Les `paths` du `tsconfig.json` n'existent qu'à la compilation :
> seul un outil qui les lit peut les appliquer. Ici Next.js les applique au build
> côté web, et **Bun les lit à l'exécution** côté API. C'est précisément pour ça
> que l'API a besoin du runtime Bun : sous le runtime Node, Vercel transpile
> fichier par fichier sans bundler, et Node échoue sur `@/app` avec
> `ERR_MODULE_NOT_FOUND` — il ne connaît que les *subpath imports* préfixés `#`.

## Déploiement sur Vercel

Crée **deux projets Vercel** pointant vers ce même dépôt GitHub. Vercel détecte
`bun.lock` et installe avec Bun, et détecte Turborepo automatiquement.

### 1. Projet API (`apps/api`)

- **Root Directory** : `apps/api`
- Le runtime Bun est activé par `apps/api/vercel.json` :

  ```json
  { "bunVersion": "1.x" }
  ```

- Aucune configuration de build : Vercel détecte l'app Hono en cherchant un
  export par défaut dans `index|app|server.ts`, à la racine du projet ou sous
  `src/`. C'est `apps/api/src/index.ts` qui joue ce rôle — ni dossier `api/`,
  ni rewrites, ni adapter `hono/vercel`.
- Variable d'environnement recommandée :
  - `CORS_ORIGIN` = URL du projet web (ex. `https://mon-front.vercel.app`)

### 2. Projet Web (`apps/web`)

- **Root Directory** : `apps/web`
- Framework préréglé : Next.js (détecté automatiquement)
- Variable d'environnement :
  - `NEXT_PUBLIC_API_URL` = URL du projet API (ex. `https://mon-api.vercel.app`)

## Structure

```
apps/
  api/          # Hono
    src/index.ts    # export default app — entrée Vercel et dev local
    src/app.ts      # routes
    src/lib/        # @/lib/*
    src/routes/     # @/routes/*
  web/          # Next.js — appelle l'API et affiche la réponse
packages/
  shared/       # Types partagés (ApiResponse, HelloResponse…)
  typescript-config/
```
