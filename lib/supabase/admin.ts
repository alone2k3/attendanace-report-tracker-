import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { supabaseUrl } from "./env";

/**
 * Service-role client. Bypasses RLS, so it is used ONLY by cron routes and to look up
 * recipient email addresses for outgoing mail (lib/email.ts). Never in request
 * handlers acting for a user, never in browser code.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient<Database>(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
