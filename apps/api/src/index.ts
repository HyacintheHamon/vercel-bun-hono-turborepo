// Entrée du serveur de développement : `bun run --hot src/index.ts`, sur le
// port défini par PORT (voir le script `dev`).
//
// Sur Vercel, ce fichier n'est PAS utilisé. La détection Hono cherche un export
// par défaut dans `app|index|server.ts` et retient `src/app.ts` : c'est lui qui
// devient le handler de la Function (vérifiable dans `.vc-config.json` d'un
// `vercel build`). Ce fichier n'est même pas embarqué dans le lambda.
import app from "@/app";

export default app;
