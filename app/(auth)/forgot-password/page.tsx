import Link from "next/link";
import { EmailForm } from "@/components/auth/email-form";

export const metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const resend = sp.mode === "resend";
  return (
    <>
      <h1 className="text-[30px] font-semibold text-ink-soft">{resend ? "Resend confirmation" : "Forgot password"}</h1>
      <p className="mb-6 mt-1 text-muted">
        {resend ? "We'll send the confirmation link to your email again." : "Enter your work email and we'll send you a link to set a new password."}
      </p>
      <EmailForm mode={resend ? "resend" : "reset"} />
      <p className="mt-6 text-sm text-muted">
        <Link href="/login" className="font-semibold text-gold-deep underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
