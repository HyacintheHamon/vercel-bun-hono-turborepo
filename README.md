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

| Alias          | Résout vers       | App        | Déclaré dans                 |
| -------------- | ----------------- | ---------- | ---------------------------- |
| `#*`           | `apps/api/src/*`  | `apps/api` | `package.json` → `imports`   |
| `@/*`          | `apps/web/*`      | `apps/web` | `tsconfig.json` → `paths`    |
| `@repo/shared` | `packages/shared` | partout    | workspaces Bun               |

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

### Comment les alias tiennent côté API

`apps/web` est simple : Next.js bundle au build, quand le tsconfig et tous les
fichiers sont là. L'alias est résolu avant le déploiement, il n'en reste rien à
l'exécution.

`apps/api` est déployé **sans bundling** : Vercel transpile chaque fichier
séparément et décide quoi embarquer en **traçant les imports**. Or un traceur ne
suit que les chemins relatifs et les paquets de `node_modules` — jamais un
alias. Faire tenir des alias demande donc trois pièces qui se complètent :

**1. Déclarer l'alias là où le runtime le lira** — le `package.json`, embarqué
dans la Function, et non le `tsconfig.json`, qui ne l'est pas :

```jsonc
"imports": {
  "#*": {
    "source": "./src/*.ts",    // dev : Bun sert les sources TypeScript
    "default": "./src/*.js"    // Vercel : sources transpilées en .js
  }
}
```

**2. Activer la condition `source` en dev**, sinon Bun cherche des `.js` qui
n'existent pas localement :

```jsonc
"dev": "PORT=3001 bun --conditions=source run --hot src/index.ts"
```

**3. Faire voir les fichiers au traceur.** `src/_tracing.ts` réimporte en
relatif tous les modules atteints par alias, ce qui suffit à les embarquer. Il
est **généré à chaque build** par `scripts/gen-tracing.ts` : ajouter un fichier
sous `src/` suffit, il n'y a rien à tenir à jour.

> Sans la pièce 3, la Function crashe au démarrage sur un `ResolveMessage` de
> Bun — non pas parce que l'alias est mal résolu, mais parce que le fichier est
> absent du lambda. `includeFiles` dans `vercel.json` ne rattrape pas le coup :
> sur une app détectée par framework, il est ignoré.

Vérifiable en comparant le contenu de la Function produite par `vercel build` :

| Configuration                | Fichiers embarqués                                          |
| ---------------------------- | ----------------------------------------------------------- |
| imports relatifs             | `app.js`, `lib/runtime.js`, `routes/example.js`              |
| alias seuls                  | `app.js` seul — crash                                        |
| alias + `_tracing.ts`        | `app.js`, `_tracing.js`, `lib/runtime.js`, `routes/example.js` |

Si cette mécanique paraît trop coûteuse pour le gain, revenir à des imports
relatifs dans `apps/api` est parfaitement viable : supprimer le champ
`imports`, `scripts/gen-tracing.ts`, `src/_tracing.ts` et les `--conditions`.

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

- Variable d'environnement recommandée :
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
    src/lib/         # #lib/*
    src/routes/      # #routes/*
    src/_tracing.ts  # généré — voir « Alias d'import »
    scripts/gen-tracing.ts
  web/          # Next.js — appelle l'API et affiche la réponse
packages/
  shared/       # Types partagés (ApiResponse, HelloResponse…)
  typescript-config/
```
