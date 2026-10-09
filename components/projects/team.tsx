"use client";
import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { addMembers, removeMember } from "@/app/(app)/projects/actions";
import { Avatar } from "@/components/ui/avatar";
import { DeptChip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { MemberPicker, type Person } from "./member-picker";

export function Team({ projectId, members, people, canManage, ownerId }: { projectId: string; members: Person[]; people: Person[]; canManage: boolean; ownerId: string }) {
  const [adding, setAdding] = useState(false);
  const [ids, setIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3">
            <Avatar name={m.full_name} slug={m.dept?.slug} size={32} />
            <span className="flex-1 font-medium text-ink-soft">
              {m.full_name}
              {m.id === ownerId ? <span className="ml-1 text-xs text-muted">owner</span> : null}
            </span>
            {m.dept ? <DeptChip slug={m.dept.slug} name={m.dept.name} /> : null}
            {canManage && m.id !== ownerId ? (
              <button
                type="button"
                aria-label={`Remove ${m.full_name}`}
                className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-muted hover:bg-bad-bg hover:text-bad"
                onClick={() => start(async () => void (await removeMember(projectId, m.id)))}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {canManage ? (
        adding ? (
          <div className="flex flex-col gap-2">
            <MemberPicker people={people} name="add" exclude={members.map((m) => m.id)} onChange={setIds} />
            <div className="flex gap-2">
              <Button
                disabled={pending || ids.length === 0}
                onClick={() =>
                  start(async () => {
                    setError(null);
                    const r = await addMembers(projectId, ids);
                    if (r.ok) setAdding(false);
                    else setError(r.error);
                  })
                }
              >
                Tag {ids.length || ""} {ids.length === 1 ? "person" : "people"}
              </Button>
              <Button variant="secondary" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" className="self-start" onClick={() => setAdding(true)}>
            Tag people
          </Button>
        )
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      ) : null}
    </div>
  );
}
