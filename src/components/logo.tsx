import Link from "next/link";
import clsx from "clsx";

/** Wordmark: the two o's are price stickers. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="Stoop — home" className={clsx("group inline-flex items-center", className)}>
      <span aria-hidden className="font-display flex items-center text-[26px] leading-none tracking-[-0.04em]">
        st
        <span className="mx-[0.02em] mt-[0.12em] inline-block size-[0.56em] rounded-full bg-[#FF6B4A] shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)] transition-transform duration-300 group-hover:-rotate-12 group-hover:-translate-y-0.5" />
        <span className="mx-[0.02em] mt-[0.12em] inline-block size-[0.56em] rounded-full bg-[#FFE14D] shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)] transition-transform delay-75 duration-300 group-hover:rotate-12 group-hover:-translate-y-0.5" />
        p
      </span>
    </Link>
  );
}
