import ApiStatus from "@/components/api-status";
import { fetchHello } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const hello = await fetchHello();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold tracking-tight">
        Bun 🥟 + Hono 🔥 + Next.js ▲
      </h1>
      <p className="text-zinc-400">
        Monorepo Turborepo — <code className="text-zinc-200">apps/web</code>{" "}
        appelle <code className="text-zinc-200">apps/api</code>
      </p>

      <ApiStatus />

      <section className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Réponse de /api/hello
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
          <p className="text-sm text-red-400">API injoignable.</p>
        )}
      </section>
    </main>
  );
}
