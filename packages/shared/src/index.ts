/**
 * Types partagés entre l'API Hono (apps/api) et le front Next.js (apps/web).
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface RootData {
  /** L'API tourne sous Bun en local, sous Node sur les Vercel Functions. */
  runtime: "bun" | "node";
  /** Version de Bun, `null` quand l'API ne tourne pas sous Bun. */
  bunVersion: string | null;
}

export type RootResponse = ApiResponse<RootData>;

export interface HelloData {
  greeting: string;
  timestamp: string;
}

export type HelloResponse = ApiResponse<HelloData>;
