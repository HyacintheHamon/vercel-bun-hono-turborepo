// Fichier d'exemple : une route montée dans un sous-dossier, qui consomme
// l'alias `#lib/runtime` (déclaré dans le champ `imports` du package.json).
import { Hono } from "hono";
import type { ApiResponse } from "@repo/shared";

import { bunVersion, runtime } from "#lib/runtime";

interface ExampleData {
  alias: string;
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
      alias: "#lib/runtime",
      importedFrom: "apps/api/src/lib/runtime.ts",
      runtime,
      bunVersion,
    },
  };
  return c.json(response);
});

export default example;
