"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Menu, X } from "lucide-react";

/** Phone header with a slide-in sheet holding the sidebar. */
export function MobileMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // Close the sheet after navigating.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between bg-ink px-4 py-3">
        <Image src="/brand/turmeric-logo.png" alt="turmeric" width={110} height={36} className="h-auto w-[110px]" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-nav-text hover:bg-nav-active"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" aria-hidden />
        </button>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Menu">
          <div id="mobile-nav" className="relative h-full w-[85%] max-w-[300px] overflow-y-auto">
            {children}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-2 top-3 inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-nav-text hover:bg-nav-active"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" aria-hidden />
            </button>
          </div>
          <button type="button" aria-label="Close menu" className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
