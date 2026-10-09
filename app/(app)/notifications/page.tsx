import Link from "next/link";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { Card, Empty } from "@/components/ui/card";
import { MarkAllRead, MarkOneRead } from "@/components/notifications/mark-read";
import { cn } from "@/lib/cn";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const me = await requireMe();
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("id, title, body, link, read_at, created_at").eq("user_id", me.id).order("created_at", { ascending: false }).limit(100);
  const unread = (data ?? []).filter((n) => !n.read_at).length;
  return (
    <>
      <PageHeader crumb="Me" title="Notifications" description={unread ? `${unread} unread` : "You're all caught up."} actions={<MarkAllRead disabled={unread === 0} />} />
      <Card>
        {data?.length ? (
          <ul className="divide-y divide-line-soft">
            {data.map((n) => (
              <li key={n.id} className={cn("flex flex-wrap items-start justify-between gap-2 py-3", !n.read_at && "-mx-2 rounded-[12px] bg-selected px-2")}>
                <div className="min-w-0">
                  {n.link ? (
                    <Link href={n.link} className="font-semibold text-ink-soft underline-offset-2 hover:underline">
                      {n.title}
                    </Link>
                  ) : (
                    <p className="font-semibold text-ink-soft">{n.title}</p>
                  )}
                  {n.body ? <p className="text-sm text-text">{n.body}</p> : null}
                  <p className="text-xs text-muted">{formatDateTime(n.created_at)}</p>
                </div>
                {!n.read_at ? <MarkOneRead id={n.id} /> : null}
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No notifications yet.</Empty>
        )}
      </Card>
    </>
  );
}
