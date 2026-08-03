// Entrée pour le développement local avec Bun : `bun run --hot src/index.ts`
import app from "./app";

const port = Number(process.env.PORT ?? 3001);

console.log(`🔥 Hono API running at http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
