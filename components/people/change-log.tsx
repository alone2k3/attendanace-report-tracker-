import { formatDateTime } from "@/lib/dates";
import { Empty } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import type { Dept } from "@/lib/departments";

type Change = {
  id: string;
  kind: string;
  note: string | null;
  created_at: string;
  from_department_id: string | null;
  to_department_id: string | null;
  person: unknown;
  by: unknown;
};

const name = (x: unknown) => (x as { full_name?: string } | null)?.full_name ?? "Someone";

export function ChangeLog({ changes, byId, limit }: { changes: Change[]; byId: Map<string, Dept>; limit?: number }) {
  const rows = limit ? changes.slice(0, limit) : changes;
  if (!rows.length) return <Empty>No department changes yet.</Empty>;
  return (
    <ul className="divide-y divide-line-soft">
      {rows.map((c) => {
        const from = c.from_department_id ? byId.get(c.from_department_id)?.name : null;
        const to = c.to_department_id ? byId.get(c.to_department_id)?.name : null;
        const text =
          c.kind === "approved"
            ? `${name(c.person)} approved into ${to}${from && from !== to ? ` (tagged ${from})` : ""}`
            : c.kind === "declined"
              ? `${name(c.person)}'s registration declined`
              : `${name(c.person)} moved from ${from} to ${to}`;
        return (
          <li key={c.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
            <div>
              <p className="font-semibold text-ink-soft">{text}</p>
              <p className="text-sm text-muted">
                by {name(c.by)} · {formatDateTime(c.created_at)}
                {c.note ? ` · “${c.note}”` : ""}
              </p>
            </div>
            <Chip tone={c.kind === "approved" ? "ok" : c.kind === "declined" ? "bad" : "info"}>{c.kind === "moved" ? "Moved" : c.kind === "approved" ? "Approved" : "Declined"}</Chip>
          </li>
        );
      })}
    </ul>
  );
}
