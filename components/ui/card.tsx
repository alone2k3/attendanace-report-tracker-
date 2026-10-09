import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn("rounded-[18px] border border-line bg-card p-5 sm:p-6", className)} {...props} />;
}

export function CardHeader({ title, action, sub }: { title: React.ReactNode; action?: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold text-ink-soft">{title}</h2>
        {sub ? <p className="mt-1 text-sm text-muted">{sub}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-[14px] border border-dashed border-field-line px-4 py-6 text-center text-sm text-muted">{children}</p>;
}
