import Image from "next/image";
import { Bell, CalendarDays, ClipboardList, FolderKanban, Home, LogOut, Settings, ShieldCheck, Users, BarChart3 } from "lucide-react";
import type { Me } from "@/lib/auth";
import { deptStyle } from "@/lib/departments";
import { Avatar } from "@/components/ui/avatar";
import { NavLink } from "./nav-link";

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="label-caps mb-1.5 px-3 text-nav-label">{label}</p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

const icon = "h-5 w-5 shrink-0";

export function Sidebar({ me, unread }: { me: Me; unread: number }) {
  const otherDepts = me.visible.filter((d) => d.id !== me.department?.id);
  return (
    <div className="flex h-full flex-col bg-ink px-3 py-5 text-nav-text">
      <div className="px-3">
        <Image src="/brand/turmeric-logo.png" alt="turmeric" width={150} height={50} priority className="h-auto w-[150px]" />
        <p className="label-caps mt-2 text-nav-label">Work tracker</p>
      </div>

      <Section label="Me">
        <NavLink href="/dashboard"><Home className={icon} aria-hidden />Home</NavLink>
        <NavLink href="/tasks"><ClipboardList className={icon} aria-hidden />Daily tasks</NavLink>
        <NavLink href="/attendance"><CalendarDays className={icon} aria-hidden />Attendance</NavLink>
        <NavLink href="/projects"><FolderKanban className={icon} aria-hidden />Projects</NavLink>
        <NavLink href="/notifications">
          <Bell className={icon} aria-hidden />
          Notifications
          {unread > 0 ? (
            <span className="ml-auto rounded-full bg-gold px-2 text-xs font-bold text-black" aria-label={`${unread} unread`}>
              {unread}
            </span>
          ) : null}
        </NavLink>
      </Section>

      <Section label="My department">
        {me.department ? (
          <NavLink href={`/departments/${me.department.slug}`} dot={deptStyle(me.department.slug).dot}>
            {me.department.name}
          </NavLink>
        ) : (
          <p className="px-3 text-sm text-nav-label">No department yet</p>
        )}
        {!me.isMentor ? (
          <p className="px-3 pt-1 text-xs leading-relaxed text-nav-label">Other departments&apos; logs are private to their teams and mentors.</p>
        ) : null}
      </Section>

      {me.isMentor ? (
        <Section label="Mentor">
          {otherDepts.map((d) => (
            <NavLink key={d.id} href={`/departments/${d.slug}`} dot={deptStyle(d.slug).dot}>
              {d.name}
            </NavLink>
          ))}
          <NavLink href="/mentor" exact><ShieldCheck className={icon} aria-hidden />Mentor view</NavLink>
          <NavLink href="/mentor/people"><Users className={icon} aria-hidden />People &amp; departments</NavLink>
          <NavLink href="/reports"><BarChart3 className={icon} aria-hidden />Reports</NavLink>
        </Section>
      ) : null}

      {me.isAdmin ? (
        <Section label="Admin">
          <NavLink href="/admin/users"><Users className={icon} aria-hidden />Users</NavLink>
          <NavLink href="/admin/mentors"><ShieldCheck className={icon} aria-hidden />Mentors</NavLink>
          <NavLink href="/admin/departments"><FolderKanban className={icon} aria-hidden />Departments</NavLink>
          <NavLink href="/admin/settings"><Settings className={icon} aria-hidden />Settings</NavLink>
        </Section>
      ) : null}

      <div className="mt-auto pt-6">
        <a href="/profile" className="flex min-h-11 items-center gap-3 rounded-[10px] px-3 py-2 hover:bg-[#1A160C]">
          <Avatar name={me.fullName} slug={me.department?.slug} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ivory">{me.fullName}</span>
            <span className="block truncate text-xs text-nav-label">
              {me.isAdmin ? "Admin" : me.isMentor ? "Mentor" : "Member"}
              {me.department ? ` · ${me.department.name}` : ""}
            </span>
          </span>
        </a>
        <form action="/auth/signout" method="post">
          <button type="submit" className="mt-1 flex min-h-11 w-full items-center gap-2.5 rounded-[10px] px-3 text-[15px] text-nav-text hover:bg-[#1A160C]">
            <LogOut className={icon} aria-hidden />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
