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

app.get("/", (c) => {
  // `typeof` plutôt qu'un accès direct : sur les Vercel Functions (runtime
  // Node), le global `Bun` n'existe pas.
  const isBun = typeof Bun !== "undefined";
  const response: RootResponse = {
    success: true,
    message: isBun
      ? `Hono API is running on Bun ${Bun.version}`
      : "Hono API is running on Node",
    data: {
      runtime: isBun ? "bun" : "node",
      bunVersion: isBun ? Bun.version : null,
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
