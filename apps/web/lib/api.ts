// Fichier d'exemple : accessible depuis n'importe où via l'alias `@/lib/api`
// (voir `paths` dans apps/web/tsconfig.json), sans chemin relatif.
import type { HelloResponse, RootResponse } from "@repo/shared";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Renvoie `null` plutôt que de jeter : l'API peut être éteinte en local. */
async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function fetchStatus(): Promise<RootResponse | null> {
  return getJson<RootResponse>("/");
}

export function fetchHello(): Promise<HelloResponse | null> {
  return getJson<HelloResponse>("/api/hello");
}
