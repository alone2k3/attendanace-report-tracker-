import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-3xl font-semibold text-ink-soft">Page not found</h1>
      <p className="mt-2 text-muted">It doesn&apos;t exist, or it belongs to a department you can&apos;t see.</p>
      <Link href="/dashboard" className="mt-6 inline-flex min-h-11 items-center font-semibold text-gold-deep underline">
        Go home
      </Link>
    </main>
  );
}
