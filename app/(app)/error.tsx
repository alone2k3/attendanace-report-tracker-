"use client";
import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="rounded-[18px] border border-line bg-card p-6">
      <h1 className="text-2xl font-semibold text-ink-soft">Something went wrong</h1>
      <p className="mt-2 text-muted">We couldn&apos;t load this page. Try again, and if it keeps happening, tell your admin.</p>
      <Button className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
