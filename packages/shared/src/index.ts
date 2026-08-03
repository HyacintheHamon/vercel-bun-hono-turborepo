/**
 * Types partagés entre l'API Hono (apps/api) et le front Next.js (apps/web).
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface HelloData {
  greeting: string;
  timestamp: string;
}

export type HelloResponse = ApiResponse<HelloData>;
