import Link from "next/link";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeptChip } from "@/components/ui/chip";

export const metadata = { title: "Waiting for your mentor" };

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
}

export default async function PendingPage({ searchParams }: { searchParams: Promise<{ dept?: string }> }) {
  const { dept: slug = "" } = await searchParams;
  const supabase = await createClient();
  const [{ data: dept }, { data: mentors }] = await Promise.all([
    supabase.from("departments").select("slug, name").eq("slug", slug).maybeSingle(),
    supabase.rpc("department_mentor_names", { p_slug: slug }),
  ]);
  const names = (mentors ?? []).map((m) => m.full_name);
  const who = names.length ? joinNames(names) : "A mentor";

  return (
    <div className="rounded-[18px] border border-line bg-card p-6">
      <p className="label-caps text-muted">Registration sent</p>
      <h1 className="mt-2 text-[28px] font-semibold text-ink-soft">Waiting for your mentor</h1>
      {dept ? (
        <p className="mt-4 flex flex-wrap items-center gap-2 text-[15px]">
          Department tag: <DeptChip slug={dept.slug} name={dept.name} />
        </p>
      ) : null}
      <p className="mt-3 text-[15px] leading-relaxed">
        {who} will confirm it before you can sign in. After that, only a mentor can change your department.
      </p>
      <p className="mt-4 flex items-start gap-2 text-sm text-muted">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        If your project asks you to confirm your email, use the link in your inbox too.
      </p>
      <Link href="/login" className="mt-6 inline-flex min-h-11 items-center font-semibold text-gold-deep underline">
        Back to sign in
      </Link>
    </div>
  );
}
