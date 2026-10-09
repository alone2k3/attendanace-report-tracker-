"use client";
import Link from "next/link";
import { createColumnHelper, createSortedRowModel, rowSortingFeature, sortFn_alphanumeric, tableFeatures, useTable } from "@tanstack/react-table";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";

export type PersonStat = { id: string; name: string; slug: string; dept: string; tasks: number; done: number; inProgress: number; last: string; href: string; selected: boolean };

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric },
});
const col = createColumnHelper<typeof features, PersonStat>();
const columns = col.columns([
  col.accessor("name", {
    header: "Person",
    cell: (c) => (
      <Link href={c.row.original.href} className="flex min-h-11 items-center gap-2.5 font-semibold text-ink-soft hover:underline" aria-current={c.row.original.selected ? "true" : undefined}>
        <Avatar name={c.getValue()} slug={c.row.original.slug} size={32} />
        <span>
          {c.getValue()}
          <span className="block text-xs font-normal text-muted">{c.row.original.dept}</span>
        </span>
      </Link>
    ),
  }),
  col.accessor("tasks", { header: "Tasks" }),
  col.accessor("done", { header: "Done" }),
  col.accessor("inProgress", { header: "In progress" }),
  col.accessor("last", { header: "Last update", enableSorting: false }),
]);

export function PersonTable({ rows }: { rows: PersonStat[] }) {
  const table = useTable({ features, columns, data: rows, initialState: { sorting: [{ id: "tasks", desc: true }] } });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-line text-muted">
              {hg.headers.map((h) => {
                const sorted = h.column.getIsSorted();
                return (
                  <th key={h.id} scope="col" className={cn("py-2 font-semibold", h.column.id !== "name" && "text-right")} aria-sort={sorted ? (sorted === "desc" ? "descending" : "ascending") : undefined}>
                    {h.column.getCanSort() ? (
                      <button type="button" onClick={h.column.getToggleSortingHandler()} className="min-h-11 font-semibold hover:text-ink-soft">
                        <table.FlexRender header={h} />
                        {sorted === "desc" ? " ↓" : sorted === "asc" ? " ↑" : ""}
                      </button>
                    ) : (
                      <table.FlexRender header={h} />
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((r) => (
            <tr key={r.id} className={cn("border-b border-line-soft", r.original.selected && "bg-selected")}>
              {r.getAllCells().map((c) => (
                <td key={c.id} className={cn("py-1.5", c.column.id !== "name" && "text-right font-display text-base font-semibold text-ink-soft", c.column.id === "last" && "font-sans text-sm font-normal text-muted")}>
                  <table.FlexRender cell={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
