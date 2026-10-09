import { cn } from "@/lib/cn";

const control = "w-full rounded-[12px] border border-field-line bg-field px-3.5 py-2.5 text-[15px] text-ink-soft min-h-11 placeholder:text-[#8E8366] focus:border-gold-deep focus:outline-none";

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink-soft">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-24", className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(control, "pr-8", className)} {...props} />;
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-[12px] bg-bad-bg px-3.5 py-2.5 text-sm font-medium text-bad">
      {message}
    </p>
  );
}

export function FormNotice({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="status" className="rounded-[12px] bg-ok-bg px-3.5 py-2.5 text-sm font-medium text-ok">
      {message}
    </p>
  );
}
