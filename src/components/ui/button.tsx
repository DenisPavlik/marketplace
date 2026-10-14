import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 select-none";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-on-ink hover:bg-ink/85 shadow-[0_1px_0_rgb(255_255_255/0.15)_inset]",
  secondary: "bg-surface text-ink ring-1 ring-inset ring-line-strong hover:ring-ink-3 hover:bg-paper",
  ghost: "text-ink hover:bg-ink/5",
  danger: "bg-surface text-danger ring-1 ring-inset ring-danger/30 hover:bg-danger hover:text-white",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

type StyleProps = { variant?: Variant; size?: Size };

export function buttonClass({ variant = "primary", size = "md" }: StyleProps = {}, className?: string) {
  return clsx(base, variants[variant], sizes[size], className);
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & StyleProps) {
  return <button type={type} className={buttonClass({ variant, size }, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & StyleProps) {
  return <Link className={buttonClass({ variant, size }, className)} {...props} />;
}
