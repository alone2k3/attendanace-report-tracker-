import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileMenu } from "@/components/layout/mobile-menu";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireMe();
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", me.id)
    .is("read_at", null);
  const sidebar = <Sidebar me={me} unread={count ?? 0} />;

  return (
    <div className="min-h-dvh lg:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-gold focus:px-3 focus:py-2 focus:text-black">
        Skip to content
      </a>
      <MobileMenu>{sidebar}</MobileMenu>
      <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 overflow-y-auto lg:block">{sidebar}</aside>
      <main id="main" className="min-w-0 flex-1 px-4 pb-16 pt-6 sm:px-8 lg:px-10 lg:pt-8">
        <div className="mx-auto max-w-[1160px]">{children}</div>
      </main>
    </div>
  );
}
