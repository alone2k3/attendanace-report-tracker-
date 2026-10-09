"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavLink({ href, children, exact, dot }: { href: string; children: React.ReactNode; exact?: boolean; dot?: string }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-2.5 rounded-[10px] px-3 text-[15px] font-medium",
        active ? "bg-nav-active text-gold-light" : "text-nav-text hover:bg-[#1A160C]",
      )}
    >
      {dot ? <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: dot }} /> : null}
      {children}
    </Link>
  );
}
