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

Fini les `../../lib/foo`. Chaque app a son alias, déclaré là où son runtime
saura le lire :

| Alias          | Résout vers       | App        | Déclaré dans               |
| -------------- | ----------------- | ---------- | -------------------------- |
| `#*`           | `apps/api/src/*`  | `apps/api` | `package.json` → `imports` |
| `@/*`          | `apps/web/*`      | `apps/web` | `tsconfig.json` → `paths`  |
| `@repo/shared` | `packages/shared` | partout    | workspaces Bun             |

```ts
// apps/api/src/app.ts
import { bunVersion, runtime } from "#lib/runtime";
import example from "#routes/example";

// apps/web/app/page.tsx
import ApiStatus from "@/components/api-status";
import { fetchHello } from "@/lib/api";
```

Fichiers d'exemple fournis, tous branchés pour de vrai (pas de code mort) :

- `apps/api/src/lib/runtime.ts` — détection du runtime
- `apps/api/src/routes/example.ts` — route `GET /api/example`, consomme `#lib/runtime`
- `apps/web/lib/api.ts` — helpers de fetch typés vers l'API
- `apps/web/components/api-status.tsx` — composant consommant `@/lib/api`

### Pourquoi deux mécanismes différents

Les `paths` du `tsconfig.json` ne servent qu'aux outils qui lisent ce fichier.

- `apps/web` est bundlé par Next.js au build, avec le tsconfig sous la main :
  `@/*` fonctionne.
- `apps/api` est déployé tel quel, et **Vercel n'embarque pas le tsconfig dans
  la Function** — il ne trace que les modules importés, et un fichier de config
  n'en est pas un. À l'exécution, Bun n'a donc aucun `paths` à appliquer et
  échoue sur `@/app` avec un `ResolveMessage`.

L'API utilise donc les *subpath imports*, résolus depuis le `package.json` —
lui toujours présent à côté du code. Le préfixe `#` est imposé par la
spécification :

```jsonc
// apps/api/package.json
"imports": {
  "#*": {
    "bun": "./src/*.ts",     // Bun charge directement les sources TypeScript
    "default": "./src/*.js"  // repli si la Function tourne sous Node
  }
}
```

Pour ajouter un alias côté API, il suffit de créer un fichier sous `src/` — le
motif `#*` le couvre déjà.

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
