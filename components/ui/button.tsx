import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[12px] text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 min-h-11 px-4 whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-gold text-black font-bold hover:bg-[#B8922F]",
        secondary: "bg-white text-ink-soft border border-field-line hover:bg-field",
        dark: "bg-ink-soft text-ivory hover:bg-black",
        danger: "bg-white text-bad border border-[#E8C4BF] hover:bg-bad-bg",
        ghost: "text-ink-soft hover:bg-segmented",
      },
      size: { md: "", lg: "min-h-12 px-5 text-base", sm: "min-h-11 px-3 text-sm", icon: "w-11 px-0" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export function ButtonLink({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
