import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { HelloResponse, RootResponse } from "@repo/shared";

import { bunVersion, runtime } from "#lib/runtime";
import example from "#routes/example";

const app = new Hono();

app.use(logger());
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "*",
  }),
);

app.get("/", (c) => {
  const response: RootResponse = {
    success: true,
    message: bunVersion
      ? `Hono API is running on Bun ${bunVersion}`
      : "Hono API is running on Node",
    data: {
      runtime,
      bunVersion,
    },
  };
  return c.json(response);
});

app.get("/api/hello", (c) => {
  const response: HelloResponse = {
    success: true,
    message: "Hello from Hono!",
    data: {
      greeting: "Bonjour depuis apps/api 👋",
      timestamp: new Date().toISOString(),
    },
  };
  return c.json(response);
});

app.route("/api/example", example);

export default app;
