import type { RootData } from "@repo/shared";

// Le global `Bun` n'existe pas sur les Vercel Functions (runtime Node). On le
// lit via globalThis plutôt que comme global ambiant : le typecheck ne dépend
// alors plus de la présence de bun-types, absent de l'install Vercel.
const bun = (globalThis as { Bun?: { version: string } }).Bun;

/** Version de Bun, `null` quand l'API ne tourne pas sous Bun. */
export const bunVersion: string | null = bun?.version ?? null;

/** Runtime détecté : `bun` en local, `node` sur les Vercel Functions. */
export const runtime: RootData["runtime"] = bun ? "bun" : "node";
