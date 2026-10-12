import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["recovery", "signup", "email", "invite", "magiclink", "email_change"];

/**
 * Email links land here with a one-time token hash (see the email templates in README).
 * Unlike the code-exchange route, this works in any browser or device and does not depend on
 * Supabase's Redirect URLs list, so the link can't fall back to the sign-in page.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (!tokenHash || !type || !OTP_TYPES.includes(type)) {
    return NextResponse.redirect(new URL(type === "recovery" ? "/reset-password" : "/login", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (type === "recovery") {
    // On failure /reset-password shows "Link expired" with a way to ask for a new one.
    return NextResponse.redirect(new URL("/reset-password", request.url));
  }

  // Sign-up confirmation: the account still needs approval, so never keep the session.
  if (!error) await supabase.auth.signOut();
  return NextResponse.redirect(new URL(error ? "/login" : "/login?confirmed=1", request.url));
}
