"use client";
import { useState, useTransition } from "react";
import { setRole, setStatus } from "@/app/(app)/admin/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip, DeptChip } from "@/components/ui/chip";
import { Select } from "@/components/ui/field";

export function UserRow({ u, isMe }: { u: { id: string; full_name: string; email: string; role: string; status: string; dept: { slug: string; name: string } | null }; isMe: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Something went wrong.");
    });
  return (
    <tr className="border-b border-line-soft align-middle">
      <td className="py-2">
        <span className="flex items-center gap-2.5">
          <Avatar name={u.full_name} slug={u.dept?.slug} size={32} />
          <span>
            <span className="block font-semibold text-ink-soft">
              {u.full_name}
              {isMe ? <span className="ml-1 text-xs text-muted">(you)</span> : null}
            </span>
            <span className="block text-xs text-muted">{u.email}</span>
          </span>
        </span>
        {error ? (
          <span role="alert" className="mt-1 block text-xs text-bad">
            {error}
          </span>
        ) : null}
      </td>
      <td className="py-2">{u.dept ? <DeptChip slug={u.dept.slug} name={u.dept.name} /> : <span className="text-muted">—</span>}</td>
      <td className="py-2">
        <Select value={u.role} disabled={pending || isMe} onChange={(e) => run(() => setRole(u.id, e.target.value))} aria-label={`Role for ${u.full_name}`} className="min-w-[120px]">
          <option value="member">Member</option>
          <option value="mentor">Mentor</option>
          <option value="admin">Admin</option>
        </Select>
      </td>
      <td className="py-2">
        <Chip tone={u.status === "active" ? "ok" : u.status === "pending" ? "warn" : "bad"}>{u.status === "active" ? "Active" : u.status === "pending" ? "Pending" : "Disabled"}</Chip>
      </td>
      <td className="py-2 text-right">
        {isMe || u.status === "pending" ? null : u.status === "active" ? (
          <Button variant="danger" size="sm" disabled={pending} onClick={() => run(() => setStatus(u.id, "disabled"))}>
            Disable
          </Button>
        ) : (
          <Button variant="secondary" size="sm" disabled={pending} onClick={() => run(() => setStatus(u.id, "active"))}>
            Enable
          </Button>
        )}
      </td>
    </tr>
  );
}
