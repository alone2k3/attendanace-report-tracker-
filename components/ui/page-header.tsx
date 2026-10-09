export function PageHeader({ crumb, title, description, actions }: { crumb?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {crumb ? <p className="text-[13px] text-muted">{crumb}</p> : null}
        <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.01em] text-ink-soft sm:text-[34px]">{title}</h1>
        {description ? <p className="mt-1 text-[15px] text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
