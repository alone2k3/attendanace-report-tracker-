"use client";
import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { REPORT_COLUMNS, type PersonReport } from "@/lib/reports";

export function ExportButtons({ rows, title }: { rows: PersonReport[]; title: string }) {
  const [busy, setBusy] = useState(false);
  const header = REPORT_COLUMNS.map((c) => c.label);
  const body = rows.map((r) => REPORT_COLUMNS.map((c) => r[c.key]));
  const file = title.replace(/[^\w-]+/g, "-").toLowerCase();

  async function excel() {
    setBusy(true);
    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `${file}.xlsx`);
    } finally {
      setBusy(false);
    }
  }

  async function pdf() {
    setBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const { autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(14);
      doc.text(title, 14, 16);
      autoTable(doc, {
        head: [header],
        body: body.map((r) => r.map(String)),
        startY: 22,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [20, 17, 10], textColor: [250, 246, 236] },
        alternateRowStyles: { fillColor: [250, 246, 236] },
      });
      doc.save(`${file}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="secondary" disabled={busy || !rows.length} onClick={excel}>
        <FileSpreadsheet className="h-5 w-5" aria-hidden />
        Excel
      </Button>
      <Button disabled={busy || !rows.length} onClick={pdf}>
        <FileText className="h-5 w-5" aria-hidden />
        PDF
      </Button>
    </div>
  );
}
