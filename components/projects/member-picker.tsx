"use client";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/field";
import { DeptChip } from "@/components/ui/chip";

export type Person = { id: string; full_name: string; dept: { slug: string; name: string } | null };

/** Checkbox list of people from every department, with a search box. Submits as name="members". */
export function MemberPicker({ people, name = "members", exclude = [], onChange }: { people: Person[]; name?: string; exclude?: string[]; onChange?: (ids: string[]) => void }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const list = useMemo(() => people.filter((p) => !exclude.includes(p.id) && p.full_name.toLowerCase().includes(q.trim().toLowerCase())), [people, q, exclude]);
  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    setSelected(next);
    onChange?.(next);
  };
  return (
    <div className="flex flex-col gap-2">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people" aria-label="Search people to tag" />
      <ul className="max-h-64 overflow-y-auto rounded-[12px] border border-line">
        {list.map((p) => (
          <li key={p.id} className="border-b border-line-soft last:border-0">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-field">
              <input type="checkbox" name={name} value={p.id} checked={selected.includes(p.id)} onChange={() => toggle(p.id)} className="h-5 w-5 accent-[#14110A]" />
              <span className="flex-1 font-medium text-ink-soft">{p.full_name}</span>
              {p.dept ? <DeptChip slug={p.dept.slug} name={p.dept.name} /> : null}
            </label>
          </li>
        ))}
        {list.length === 0 ? <li className="px-3 py-3 text-sm text-muted">No one matches.</li> : null}
      </ul>
      <p className="text-xs text-muted">{selected.length} selected. Tagged people get a notification.</p>
    </div>
  );
}
