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

Les deux apps utilisent la même convention, déclarée dans les `paths` de leur
`tsconfig.json` :

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

> **Requis côté API** — le projet Vercel de `apps/api` doit avoir la variable
> d'environnement `VERCEL_EXPERIMENTAL_BACKENDS=1`
> ([changelog](https://vercel.com/changelog/experimental-build-mode-hono-express)).
> Sans elle, la Function démarre sur un `ResolveMessage` de Bun.

### Pourquoi cette variable est nécessaire

Un alias n'est pas un chemin : il faut un outil pour le traduire, et tout se
joue sur le moment où cette traduction a lieu.

`apps/web` est bundlé par Next.js au build, quand le tsconfig et les fichiers
sont là. L'alias est résolu avant le déploiement, il n'en reste rien à
l'exécution.

`apps/api` est déployé sans bundling : Vercel transpile chaque fichier
séparément et choisit quoi embarquer en **traçant les imports**. Un traceur ne
suit que les chemins relatifs et les paquets de `node_modules` — pas les alias.
Les fichiers visés ne sont donc jamais copiés, et la Function crashe au
démarrage sur un fichier absent (et non sur un alias mal résolu).

Le mode expérimental corrige ça à la source : il **réécrit les alias en chemins
relatifs pendant le build**, si bien que le traceur n'a plus rien à deviner.
Constaté en comparant la Function produite par `vercel build --prod` :

| Build                       | Fichiers embarqués                                     |
| --------------------------- | ------------------------------------------------------ |
| sans la variable            | `app.js` seul — crash                                   |
| avec la variable            | `app.mjs`, `lib/runtime.mjs`, `routes/example.mjs`      |

Dans le second cas, le fichier déployé contient `from "./lib/runtime.mjs"` : la
traduction a bien eu lieu au build.

> **Statut** — cette fonctionnalité est expérimentale et peut évoluer. Si un
> déploiement casse dessus, le repli est de revenir à des imports relatifs dans
> `apps/api` (`./lib/runtime`) et de retirer les `paths` de son `tsconfig.json` ;
> les alias de `apps/web` ne sont pas concernés.

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
  export par défaut dans `app|index|server.ts`, à la racine du projet ou sous
  `src/`, et retient **`src/app.ts`** — ni dossier `api/`, ni rewrites, ni
  adapter `hono/vercel`. `src/index.ts` ne sert qu'au dev local et n'est pas
  déployé.

- Variables d'environnement (Project Settings → Environment Variables) :
  - `VERCEL_EXPERIMENTAL_BACKENDS` = `1` — **requis**, sinon les alias `@/`
    ne sont pas résolus et la Function crashe au démarrage. Ce réglage ne peut
    pas vivre dans `vercel.json` : le champ `build.env` n'est pas pris en
    compte pour ce drapeau (vérifié).
  - `CORS_ORIGIN` = URL du projet web (ex. `https://mon-front.vercel.app`)

Pour inspecter ce qui part réellement dans la Function :

```bash
cd apps/api && bunx vercel build --output /tmp/out
cat /tmp/out/functions/index.func/.vc-config.json      # handler + runtime
find /tmp/out/functions/index.func -name '*.js' -not -path '*node_modules*'
```

### 2. Projet Web (`apps/web`)

- **Root Directory** : `apps/web`
- Framework préréglé : Next.js (détecté automatiquement)
- Variable d'environnement :
  - `NEXT_PUBLIC_API_URL` = URL du projet API (ex. `https://mon-api.vercel.app`)

## Structure

```
apps/
  api/          # Hono
    src/app.ts       # routes — handler de la Function sur Vercel
    src/index.ts     # entrée du serveur de dev uniquement
    src/lib/         # @/lib/*
    src/routes/      # @/routes/*
  web/          # Next.js — appelle l'API et affiche la réponse
packages/
  shared/       # Types partagés (ApiResponse, HelloResponse…)
  typescript-config/
```
