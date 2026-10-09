"use server";
import { revalidatePath } from "next/cache";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/validations";

export async function markRead(id?: string) {
  const me = await requireMe();
  const supabase = await createClient();
  // Only read_at is writable on notifications (column grant).
  let q = supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", me.id).is("read_at", null);
  if (id) {
    if (!uuid.safeParse(id).success) return;
    q = q.eq("id", id);
  }
  await q;
  revalidatePath("/", "layout");
}
