import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Holidays, SettingsForm } from "@/components/admin/settings-forms";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [s, { data: holidays }] = await Promise.all([getSettings(), supabase.from("holidays").select("day, name").order("day")]);
  return (
    <>
      <PageHeader crumb="Admin" title="Settings" description="Office hours and rules. All times are IST." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Rules" />
          <SettingsForm s={s} />
        </Card>
        <Card>
          <CardHeader title="Holidays" sub="No one is marked absent on these days." />
          <Holidays holidays={holidays ?? []} />
        </Card>
      </div>
    </>
  );
}
