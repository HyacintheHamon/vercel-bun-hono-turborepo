// Fichier d'exemple : montre comment consommer les alias d'import.
//   `#lib/runtime`  → apps/api/src/lib/runtime.ts  (voir `imports` du package.json)
//   `@repo/shared`  → packages/shared              (workspace Bun)
// Aucun chemin relatif du type `../lib/runtime` n'est nécessaire.
import { Hono } from "hono";
import type { ApiResponse } from "@repo/shared";

import { bunVersion, runtime } from "#lib/runtime";

interface ExampleData {
  alias: string;
  resolvedFrom: string;
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
      resolvedFrom: "apps/api/src/lib/runtime.ts",
      runtime,
      bunVersion,
    },
  };
  return c.json(response);
});

export default example;
