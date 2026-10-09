"use client";
import { useState, useTransition } from "react";
import { setMentorDepartments } from "@/app/(app)/admin/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { deptStyle } from "@/lib/departments";

export function MentorRow({ mentor, departments, assigned }: { mentor: { id: string; full_name: string; role: string; slug: string | null }; departments: { id: string; slug: string; name: string }[]; assigned: string[] }) {
  const [sel, setSel] = useState<string[]>(assigned);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const dirty = sel.slice().sort().join() !== assigned.slice().sort().join();
  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
      <span className="flex min-w-[220px] items-center gap-3">
        <Avatar name={mentor.full_name} slug={mentor.slug} />
        <span>
          <span className="block font-semibold text-ink-soft">{mentor.full_name}</span>
          <span className="block text-xs text-muted">{mentor.role === "admin" ? "Admin" : "Mentor"}</span>
        </span>
      </span>
      <fieldset className="flex flex-1 flex-wrap gap-2">
        <legend className="sr-only">Departments {mentor.full_name} mentors</legend>
        {departments.map((d) => (
          <label key={d.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-field-line bg-white px-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={sel.includes(d.id)}
              onChange={() => setSel((s) => (s.includes(d.id) ? s.filter((x) => x !== d.id) : [...s, d.id]))}
              className="h-4 w-4 accent-[#14110A]"
            />
            <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: deptStyle(d.slug).fill }} />
            {d.name}
          </label>
        ))}
      </fieldset>
      <span className="flex items-center gap-2">
        {msg ? <span role="status" className="text-sm text-muted">{msg}</span> : null}
        <Button
          variant="dark"
          disabled={pending || !dirty}
          onClick={() =>
            start(async () => {
              const r = await setMentorDepartments(mentor.id, sel);
              setMsg(r.ok ? "Saved." : r.error);
            })
          }
        >
          Save
        </Button>
      </span>
    </li>
  );
}
