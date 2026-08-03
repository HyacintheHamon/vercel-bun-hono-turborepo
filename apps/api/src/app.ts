import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { ApiResponse, HelloResponse } from "@repo/shared";

const app = new Hono();

app.use(logger());
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "*",
  }),
);

app.get("/", (c) => {
  const response: ApiResponse = {
    success: true,
    message: "Hono API is running",
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
