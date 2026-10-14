import type { ReactNode } from "react";

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
      <div className="relative mb-6 h-20 w-28" aria-hidden>
        <span className="sticker absolute left-0 top-2" style={{ "--size": "3.5rem", "--dot": "#FFE14D", "--tilt": "-12deg", fontSize: "1.1rem" } as React.CSSProperties}>?</span>
        <span className="sticker absolute right-0 top-0" style={{ "--size": "4.25rem", "--dot": "#D5D9E0", "--tilt": "9deg", fontSize: "1rem" } as React.CSSProperties}>…</span>
      </div>
      <h2 className="font-display text-xl">{title}</h2>
      {children && <div className="mt-2 text-[15px] leading-relaxed text-ink-2">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
