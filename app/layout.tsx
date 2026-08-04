import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "IG Content Planner",
  description: "Plan, generate, and track Instagram content.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
                  IG
                </div>
                <span className="text-lg font-semibold">Content Planner</span>
              </div>
              <nav className="flex gap-1 rounded-lg bg-gray-100 p-1 text-sm font-medium">
                <Link
                  href="/timeline"
                  className="rounded-md px-3 py-1.5 hover:bg-white hover:shadow-sm"
                >
                  Timeline
                </Link>
                <Link
                  href="/new"
                  className="rounded-md px-3 py-1.5 hover:bg-white hover:shadow-sm"
                >
                  + New Post
                </Link>
                <Link
                  href="/plan"
                  className="rounded-md px-3 py-1.5 hover:bg-white hover:shadow-sm"
                >
                  Weekly Plan
                </Link>
                <Link
                  href="/settings"
                  className="rounded-md px-3 py-1.5 hover:bg-white hover:shadow-sm"
                >
                  Brand Settings
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
