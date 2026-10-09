import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addDays, formatDay, monthDays, monthLabel, todayIST, weekdayShort } from "@/lib/dates";
import { isWeeklyOff, monthTotals, STATUS_LABEL, STATUS_LETTER, type AttendanceStatus } from "@/lib/attendance";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { ATTENDANCE_TONE } from "@/components/ui/chip";
import { MonthTotalsRow } from "@/components/attendance/month-strip";
import { LeaveForm, UpcomingLeave } from "@/components/attendance/leave-form";
import { cn } from "@/lib/cn";

export const metadata = { title: "Attendance" };

const TONE: Record<string, string> = {
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  info: "bg-info-bg text-info",
  neutral: "bg-neutral-bg text-neutral",
  bad: "bg-bad-bg text-bad",
};

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const me = await requireMe();
  const today = todayIST();
  const sp = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(sp.month ?? "") ? `${sp.month}-01` : `${today.slice(0, 7)}-01`;
  const days = monthDays(month);
  const prev = addDays(days[0], -1).slice(0, 7);
  const next = addDays(days[days.length - 1], 1).slice(0, 7);

  const supabase = await createClient();
  const [{ data: rows }, { data: holidays }, { data: upcoming }, settings] = await Promise.all([
    supabase.from("attendance").select("work_date, status, check_in_at, check_out_at, worked_minutes").eq("user_id", me.id).gte("work_date", days[0]).lte("work_date", days[days.length - 1]),
    supabase.from("holidays").select("day, name").gte("day", days[0]).lte("day", days[days.length - 1]),
    supabase.from("attendance").select("work_date, note").eq("user_id", me.id).eq("status", "leave").gte("work_date", today).order("work_date").limit(20),
    getSettings(),
  ]);
  const byDay = new Map((rows ?? []).map((r) => [r.work_date, r]));
  const hol = new Map((holidays ?? []).map((h) => [h.day, h.name]));
  const totals = monthTotals(rows ?? []);
  const leading = (new Date(`${days[0]}T12:00:00Z`).getUTCDay() + 6) % 7;

  return (
    <>
      <PageHeader crumb="Me" title="Attendance" description="Your month at a glance. Times are in IST." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold text-ink-soft">{monthLabel(month)}</h2>
            <div className="flex gap-1">
              <Link href={`/attendance?month=${prev}`} aria-label="Previous month" className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-field-line bg-white">
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </Link>
              <Link href={`/attendance?month=${next}`} aria-label="Next month" className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-field-line bg-white">
                <ChevronRight className="h-5 w-5" aria-hidden />
              </Link>
            </div>
          </div>
          <MonthTotalsRow totals={totals} />
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted" aria-hidden>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <ol className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: leading }, (_, i) => (
              <li key={`pad-${i}`} aria-hidden />
            ))}
            {days.map((d) => {
              const r = byDay.get(d);
              const holiday = hol.get(d);
              const off = isWeeklyOff(d, settings.weekly_off);
              const status: AttendanceStatus | null = r?.status ?? (holiday ? "holiday" : null);
              const tone = status ? ATTENDANCE_TONE[status] : null;
              const label = status ? STATUS_LABEL[status] : off ? "Weekly off" : d > today ? "Upcoming" : "No record";
              return (
                <li
                  key={d}
                  title={holiday ?? label}
                  aria-label={`${formatDay(d)}: ${holiday ?? label}`}
                  className={cn(
                    "flex aspect-square min-h-11 flex-col items-center justify-center rounded-[10px] text-xs font-semibold sm:text-sm",
                    tone ? TONE[tone] : off ? "bg-[#F5F0E2] text-[#8E8366]" : "border border-line-soft bg-white text-muted",
                    d === today && "ring-2 ring-ink-soft",
                  )}
                >
                  <span>{Number(d.slice(8))}</span>
                  <span className="text-[10px] sm:text-xs">{status ? STATUS_LETTER[status] : off ? "off" : ""}</span>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-xs text-muted">
            P present · L late · W work from home · H half day · LV leave · HO holiday · A absent. {weekdayShort(today)} is today.
          </p>
        </Card>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Mark leave" sub="For today or a day ahead, before you check in." />
            <LeaveForm today={today} />
          </Card>
          <Card>
            <CardHeader title="Upcoming leave" />
            <UpcomingLeave days={upcoming ?? []} />
          </Card>
        </div>
      </div>
    </>
  );
}
