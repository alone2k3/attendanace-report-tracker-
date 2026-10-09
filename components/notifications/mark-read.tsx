"use client";
import { useTransition } from "react";
import { markRead } from "@/app/(app)/notifications/actions";
import { Button } from "@/components/ui/button";

export function MarkAllRead({ disabled }: { disabled: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="secondary" disabled={disabled || pending} onClick={() => start(() => markRead())}>
      Mark all as read
    </Button>
  );
}

export function MarkOneRead({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="ghost" size="sm" disabled={pending} onClick={() => start(() => markRead(id))}>
      Mark read
    </Button>
  );
}
