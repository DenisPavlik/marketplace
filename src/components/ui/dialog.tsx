"use client";

import { X } from "lucide-react";
import clsx from "clsx";
import { useEffect, useRef, type ReactNode } from "react";

/** Native <dialog> modal: focus trap, Escape and backdrop come from the platform. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className={clsx(
        "m-auto max-h-[92dvh] w-[min(560px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl bg-surface p-0 text-ink shadow-2xl backdrop:bg-ink/40 backdrop:backdrop-blur-[2px] open:animate-fade-up max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none",
        className,
      )}
    >
      <div className="flex max-h-[92dvh] flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="font-display text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full hover:bg-ink/5"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line px-5 py-3.5">{footer}</div>}
      </div>
    </dialog>
  );
}
