// Fichier d'exemple : importé dans app/page.tsx via `@/components/api-status`.
import { API_URL, fetchStatus } from "@/lib/api";

export default async function ApiStatus() {
  const status = await fetchStatus();

  return (
    <section className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Statut de l&apos;API ({API_URL})
      </h2>
      {status ? (
        <div className="space-y-1">
          <p className="text-lg font-medium text-emerald-400">
            {status.message}
          </p>
          <p className="text-sm text-zinc-400">
            runtime : <code>{status.data?.runtime}</code> — version Bun :{" "}
            <code>{status.data?.bunVersion ?? "n/a"}</code>
          </p>
        </div>
      ) : (
        <p className="text-sm text-red-400">
          API injoignable. Lance-la avec <code>bun run dev</code> à la racine du
          monorepo.
        </p>
      )}
    </section>
  );
}
