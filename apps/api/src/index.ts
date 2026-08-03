// Entrée unique, en local comme sur Vercel.
//
// Vercel détecte une app Hono en cherchant un export par défaut dans
// `index|app|server.ts`, à la racine du projet ou sous `src/` : ce fichier est
// donc le point d'entrée de la Function, servi par le runtime Bun (voir
// `bunVersion` dans vercel.json). En local, `bun run --hot src/index.ts` sert
// le même export, sur le port défini par la variable PORT.
import app from "./app";

export default app;
