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

| Alias          | Résout vers       | App        | Déclaré dans              |
| -------------- | ----------------- | ---------- | ------------------------- |
| `@/*`          | `apps/web/*`      | `apps/web` | `tsconfig.json` → `paths` |
| `@repo/shared` | `packages/shared` | partout    | workspaces Bun            |

```ts
// apps/web/app/page.tsx
import ApiStatus from "@/components/api-status";
import { fetchHello } from "@/lib/api";

// apps/api/src/app.ts — imports locaux relatifs, voir ci-dessous
import { bunVersion, runtime } from "./lib/runtime";
import example from "./routes/example";
```

Fichiers d'exemple fournis, tous branchés pour de vrai (pas de code mort) :

- `apps/web/lib/api.ts` — helpers de fetch typés vers l'API
- `apps/web/components/api-status.tsx` — composant consommant `@/lib/api`
- `apps/api/src/lib/runtime.ts` — détection du runtime
- `apps/api/src/routes/example.ts` — route `GET /api/example`

### Pourquoi pas d'alias dans apps/api

Ce n'est pas un oubli : sous ce mode de déploiement, **aucun alias ne peut
fonctionner** côté API.

Vercel construit le lambda en **traçant les imports** depuis le point d'entrée,
et n'embarque que les fichiers ainsi atteints. Un traceur suit deux choses :
les chemins relatifs et les paquets de `node_modules`. Il ne suit ni les
`paths` d'un `tsconfig.json`, ni le champ `imports` d'un `package.json`.

Conséquence : derrière un alias, les fichiers visés ne sont jamais copiés dans
la Function. Elle crashe au démarrage avec un `ResolveMessage` de Bun — non pas
parce que l'alias est mal résolu, mais parce que **le fichier est absent**. Les
deux mécanismes ont été essayés et échouent de façon identique.

`apps/web` n'a pas ce problème : Next.js bundle l'application au build, quand
le tsconfig et tous les fichiers sont là. L'alias est résolu avant le
déploiement, il n'en reste aucune trace à l'exécution.

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
