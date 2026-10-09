import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = { title: "Register" };

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("departments").select("slug, name").order("name");
  return (
    <>
      <h1 className="text-[30px] font-semibold text-ink-soft">Create your account</h1>
      <p className="mb-6 mt-1 text-muted">Pick the department you work in. A mentor confirms it before you can sign in.</p>
      <RegisterForm departments={data ?? []} />
      <p className="mt-6 text-sm text-muted">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-gold-deep underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
