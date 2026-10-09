import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <div className="flex flex-col justify-between bg-ink px-6 py-8 md:w-[42%] md:px-12 md:py-14">
        <div>
          <Image src="/brand/turmeric-logo.png" alt="turmeric" width={240} height={80} priority className="h-auto w-[170px] md:w-[240px]" />
          <p className="label-caps mt-3 text-nav-label">Work tracker</p>
        </div>
        <p className="mt-6 hidden max-w-sm text-[15px] leading-relaxed text-nav-text md:block">
          Check in, log your day and keep projects moving, for Finance, Production and Creative.
        </p>
      </div>
      <main className="flex flex-1 items-start justify-center px-4 py-8 md:items-center md:px-10">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>
    </div>
  );
}
