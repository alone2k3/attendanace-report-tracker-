import Link from "next/link";
import { NewPasswordForm } from "@/components/auth/new-password-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Set a new password" };

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return (
      <>
        <h1 className="text-[30px] font-semibold text-ink-soft">Link expired</h1>
        <p className="mb-6 mt-1 text-muted">This reset link has expired or was already used. Ask for a new one.</p>
        <Link href="/forgot-password" className="font-semibold text-gold-deep underline">
          Send a new link
        </Link>
      </>
    );
  }
  return (
    <>
      <h1 className="text-[30px] font-semibold text-ink-soft">Set a new password</h1>
      <p className="mb-6 mt-1 text-muted">Choose a password you will remember.</p>
      <NewPasswordForm />
    </>
  );
}
