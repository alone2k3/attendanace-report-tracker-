"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Some Supabase emails (for example the dashboard's "Send password recovery") put the session in the
 * URL fragment (#access_token=...) instead of a ?code. Servers never see fragments, so catch them here
 * and send people to the right page instead of the sign-in screen.
 */
export function EmailLinkHandler() {
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const params = new URLSearchParams(hash);

    if (params.get("error_code") === "otp_expired") {
      window.location.replace("/reset-password");
      return;
    }

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (params.get("type") !== "recovery" || !accessToken || !refreshToken) return;

    const supabase = createClient();
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(() => {
      window.location.replace("/reset-password");
    });
  }, []);
  return null;
}
