import { requireMentor } from "@/lib/auth";
import { mentorData } from "@/lib/mentor";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { Empty } from "@/components/ui/card";
import { SegmentedLinks } from "@/components/ui/segmented";
import { Overview } from "@/components/mentor/overview";
import { TaskManager, type TMParams } from "@/components/mentor/task-manager";

export const metadata = { title: "Mentor view" };

export default async function MentorPage({ searchParams }: { searchParams: Promise<TMParams & { tab?: string }> }) {
  const me = await requireMentor();
  const sp = await searchParams;
  const settings = await getSettings();
  const d = await mentorData(me, settings.weekly_off);
  const tab = sp.tab === "tasks" ? "tasks" : "overview";
  const deptNames = me.mentored.map((x) => x.name).join(", ");

  return (
    <>
      <PageHeader
        crumb="Mentor"
        title="Mentor view"
        description={deptNames ? `You mentor ${deptNames}.` : undefined}
        actions={
          <SegmentedLinks
            label="Mentor view tabs"
            items={[
              { href: "/mentor", label: "Overview", active: tab === "overview" },
              { href: "/mentor?tab=tasks", label: "Task manager", active: tab === "tasks" },
            ]}
          />
        }
      />
      {!d ? <Empty>You don&apos;t mentor any departments yet. An admin can assign them.</Empty> : tab === "tasks" ? <TaskManager me={me} d={d} p={sp} /> : <Overview me={me} d={d} dept={sp.dept} />}
    </>
  );
}
