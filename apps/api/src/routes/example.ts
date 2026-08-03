// Fichier d'exemple : une route montée dans un sous-dossier.
//
// Les imports locaux sont volontairement relatifs. Vercel construit le lambda
// en traçant les imports, et un traceur ne suit que les chemins relatifs et
// les paquets de node_modules : derrière un alias, ces fichiers ne seraient
// pas embarqués. Les alias `@/` restent réservés à apps/web, que Next.js
// bundle au build.
import { Hono } from "hono";
import type { ApiResponse } from "@repo/shared";

import { bunVersion, runtime } from "../lib/runtime";

interface ExampleData {
  importedFrom: string;
  runtime: string;
  bunVersion: string | null;
}

const example = new Hono();

example.get("/", (c) => {
  const response: ApiResponse<ExampleData> = {
    success: true,
    message: "Cette route est servie par src/routes/example.ts",
    data: {
      importedFrom: "apps/api/src/lib/runtime.ts",
      runtime,
      bunVersion,
    },
  };
  return c.json(response);
});

export default example;
