import type { HelloResponse } from "@repo/shared";

export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function getHello(): Promise<HelloResponse | null> {
  try {
    const res = await fetch(`${API_URL}/api/hello`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as HelloResponse;
  } catch {
    return null;
  }
}

export default async function Home() {
  const hello = await getHello();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold tracking-tight">
        Bun 🥟 + Hono 🔥 + Next.js ▲
      </h1>
      <p className="text-zinc-400">
        Monorepo Turborepo — <code className="text-zinc-200">apps/web</code>{" "}
        appelle <code className="text-zinc-200">apps/api</code>
      </p>

      <section className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Réponse de l&apos;API ({API_URL})
        </h2>
        {hello ? (
          <div className="space-y-2">
            <p className="text-lg font-medium text-emerald-400">
              {hello.data?.greeting}
            </p>
            <p className="text-sm text-zinc-400">{hello.message}</p>
            <p className="text-xs text-zinc-600">{hello.data?.timestamp}</p>
          </div>
        ) : (
          <p className="text-sm text-red-400">
            API injoignable. Lance-la avec <code>bun run dev</code> à la racine
            du monorepo.
          </p>
        )}
      </section>
    </main>
  );
}
