import Image from "next/image";
import clsx from "clsx";

const TINTS = ["#FFB547", "#8F9BFF", "#FF8AC2", "#4FE0A5", "#C49BFF", "#5BC2FF", "#FF7A5C"];

export function Avatar({
  name,
  src,
  size = 36,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const tint = TINTS[(name.charCodeAt(0) || 0) % TINTS.length];
  return (
    <span
      className={clsx(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-bold text-ink ring-1 ring-black/5",
        className,
      )}
      style={{ width: size, height: size, background: tint, fontSize: size * 0.42 }}
    >
      {src ? (
        <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <span aria-hidden>{initial}</span>
      )}
    </span>
  );
}
