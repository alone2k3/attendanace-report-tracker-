import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { FormNotice } from "@/components/ui/field";

export const metadata = { title: "Sign in" };

const STATE: Record<string, string> = {
  pending: "Your registration is waiting for a mentor to confirm your department.",
  disabled: "This account isn't active. Talk to your mentor.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="text-[30px] font-semibold text-ink-soft">Sign in</h1>
      <p className="mb-6 mt-1 text-muted">Use your work email and password.</p>
      {sp.confirmed ? (
        <div className="mb-4">
          <FormNotice message="Email confirmed. You can sign in once a mentor approves your department." />
        </div>
      ) : null}
      {sp.reset ? (
        <div className="mb-4">
          <FormNotice message="Password changed. Sign in with your new password." />
        </div>
      ) : null}
      <LoginForm next={sp.next} initialError={sp.state ? STATE[sp.state] : undefined} />
      <p className="mt-4 text-sm">
        <Link href="/forgot-password" className="font-semibold text-gold-deep underline">
          Forgot password?
        </Link>
        <span className="mx-2 text-muted">·</span>
        <Link href="/forgot-password?mode=resend" className="font-semibold text-gold-deep underline">
          Resend confirmation email
        </Link>
      </p>
      <p className="mt-6 text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="font-semibold text-gold-deep underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
