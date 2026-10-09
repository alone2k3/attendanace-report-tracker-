"use client";
import { useActionState, useRef, useState, useTransition } from "react";
import { Download, ExternalLink, Link2, Trash2, Upload } from "lucide-react";
import { addLink, deleteFile, fileUrl, recordFile } from "@/app/(app)/projects/actions";
import { createClient } from "@/lib/supabase/client";
import type { ActionResult } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { FormError, Input } from "@/components/ui/field";
import { Empty } from "@/components/ui/card";

type FileRow = { id: string; file_name: string; size_bytes: number | null; external_url: string | null; uploaded_by: string; uploader: string };

const MAX = 25 * 1024 * 1024;
const ACCEPT = "image/*,application/pdf,application/zip,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx";

function size(n: number | null) {
  if (!n) return "";
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`;
}

export function Files({ projectId, files, canUpload, meId }: { projectId: string; files: FileRow[]; canUpload: boolean; meId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const [linkState, linkAction, linkPending] = useActionState<ActionResult | undefined, FormData>(addLink, undefined);

  async function upload(file: File) {
    setError(null);
    if (file.size > MAX) return setError("Files can be up to 25 MB. Add big videos as a Drive, Frame.io or YouTube link.");
    setBusy(true);
    try {
      const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-120);
      const path = `${projectId}/${crypto.randomUUID()}-${safe}`;
      const supabase = createClient();
      const { error: upErr } = await supabase.storage.from("project-files").upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (upErr) return setError("Upload failed. Check the file type (images, PDF, Office, ZIP) and that you're on the project team.");
      const r = await recordFile(projectId, path, file.name, file.type, file.size);
      if (!r.ok) setError(r.error);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const open = (id: string) =>
    start(async () => {
      const r = await fileUrl(id);
      if (r.ok && r.data) window.open(r.data, "_blank", "noopener,noreferrer");
      else if (!r.ok) setError(r.error);
    });

  return (
    <div className="flex flex-col gap-4">
      {files.length ? (
        <ul className="divide-y divide-line-soft">
          {files.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-3 py-2">
              {f.external_url ? <Link2 className="h-5 w-5 text-muted" aria-hidden /> : <Download className="h-5 w-5 text-muted" aria-hidden />}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink-soft">{f.file_name}</span>
                <span className="block text-xs text-muted">
                  {f.external_url ? "Link" : size(f.size_bytes)} · {f.uploader}
                </span>
              </span>
              <Button variant="secondary" size="sm" onClick={() => open(f.id)}>
                {f.external_url ? <ExternalLink className="h-4 w-4" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
                Open
              </Button>
              {f.uploaded_by === meId ? (
                <button type="button" aria-label={`Remove ${f.file_name}`} onClick={() => start(async () => void (await deleteFile(projectId, f.id)))} className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-muted hover:bg-bad-bg hover:text-bad">
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No files yet.</Empty>
      )}
      {canUpload ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-ink-soft">Upload a file</p>
            <p className="text-xs text-muted">Up to 25 MB. Images, PDF, Office files or ZIP.</p>
            <input ref={input} id="file-upload" type="file" accept={ACCEPT} className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            <Button variant="dark" disabled={busy} className="self-start" onClick={() => input.current?.click()}>
              <Upload className="h-4 w-4" aria-hidden />
              {busy ? "Uploading…" : "Choose file"}
            </Button>
          </div>
          <form action={linkAction} className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-ink-soft">Add a link for big videos</p>
            <input type="hidden" name="projectId" value={projectId} />
            <Input name="name" required maxLength={200} placeholder="Final cut v3" aria-label="Link name" />
            <Input name="url" type="url" required placeholder="https://drive.google.com/…" aria-label="Link URL" />
            <FormError message={linkState && !linkState.ok ? linkState.error : null} />
            <Button type="submit" variant="secondary" disabled={linkPending} className="self-start">
              Add link
            </Button>
          </form>
        </div>
      ) : (
        <p className="text-sm text-muted">Only the project team can add files.</p>
      )}
      <FormError message={error} />
    </div>
  );
}
