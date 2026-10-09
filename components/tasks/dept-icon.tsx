import { Clapperboard, Palette, Wallet, Users } from "lucide-react";

export function DeptIcon({ slug, className = "h-6 w-6" }: { slug: string; className?: string }) {
  const Icon = slug === "creative" ? Palette : slug === "production" ? Clapperboard : slug === "finance" ? Wallet : Users;
  return <Icon className={className} aria-hidden />;
}
