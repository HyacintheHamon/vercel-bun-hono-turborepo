import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { HelloResponse, RootResponse } from "@repo/shared";

const app = new Hono();

app.use(logger());
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "*",
  }),
);

// Le global `Bun` n'existe pas sur les Vercel Functions (runtime Node). On le
// lit via globalThis plutôt que comme global ambiant : le typecheck ne dépend
// alors plus de la présence de bun-types, absent de l'install Vercel.
const bunVersion =
  (globalThis as { Bun?: { version: string } }).Bun?.version ?? null;

app.get("/", (c) => {
  const response: RootResponse = {
    success: true,
    message: bunVersion
      ? `Hono API is running on Bun ${bunVersion}`
      : "Hono API is running on Node",
    data: {
      runtime: bunVersion ? "bun" : "node",
      bunVersion,
    },
  };
  return c.json(response);
});

app.get("/api/hello", (c) => {
  const response: HelloResponse = {
    success: true,
    message: "Hello from Hono on Bun!",
    data: {
      greeting: "Bonjour depuis apps/api 👋",
      timestamp: new Date().toISOString(),
    },
  };
  return c.json(response);
});

export default app;
