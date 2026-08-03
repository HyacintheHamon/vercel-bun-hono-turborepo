import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bun + Hono + Next.js Turborepo",
  description: "Monorepo Turborepo avec une API Hono (Bun) et un front Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
