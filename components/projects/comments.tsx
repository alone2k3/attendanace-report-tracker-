"use client";
import { useActionState, useEffect, useRef } from "react";
import { addComment } from "@/app/(app)/projects/actions";
import type { ActionResult } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { FormError, Textarea } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { Empty } from "@/components/ui/card";

type Comment = { id: string; body: string; when: string; author: string; slug: string | null };

export function Comments({ projectId, comments }: { projectId: string; comments: Comment[] }) {
  const [state, action, pending] = useActionState<ActionResult | undefined, FormData>(addComment, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);
  return (
    <div className="flex flex-col gap-4">
      {comments.length ? (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar name={c.author} slug={c.slug} size={32} />
              <div>
                <p className="text-sm">
                  <span className="font-semibold text-ink-soft">{c.author}</span> <span className="text-muted">· {c.when}</span>
                </p>
                <p className="whitespace-pre-line text-[15px]">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No comments yet.</Empty>
      )}
      <form ref={form} action={action} className="flex flex-col gap-2">
        <input type="hidden" name="projectId" value={projectId} />
        <Textarea name="body" required maxLength={2000} rows={3} placeholder="Write a comment" aria-label="Comment" />
        <FormError message={state && !state.ok ? state.error : null} />
        <Button type="submit" variant="dark" disabled={pending} className="self-start">
          Comment
        </Button>
      </form>
    </div>
  );
}
