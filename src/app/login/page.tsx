import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signInAsDemo, signInWithGoogle } from "@/app/actions/auth";
import { getUserId } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  oauth: "Google sign-in didn't finish. Try again.",
  demo: "The demo account isn't available right now. Sign in with Google instead.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next: rawNext, error } = await searchParams;
  const next = rawNext?.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  if (await getUserId()) redirect(next);

  return (
    <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-5xl items-center gap-12 px-4 py-12 sm:px-6 md:grid-cols-2">
      <div>
        <h1 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[0.95]">
          Sign in to sell, save and chat.
        </h1>
        <p className="mt-4 max-w-sm text-[17px] leading-relaxed text-ink-2">
          Browsing is open to everyone. An account lets you post listings, keep a list of saved finds, and message
          sellers.
        </p>
      </div>

      <div className="rounded-3xl bg-surface p-6 shadow-[0_1px_0_var(--color-line),0_20px_40px_-24px_rgb(21_23_28/0.25)] ring-1 ring-line sm:p-8">
        {error && ERRORS[error] && (
          <p role="alert" className="mb-5 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
            {ERRORS[error]}
          </p>
        )}
        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-ink text-[15px] font-semibold text-white transition-colors hover:bg-ink/85"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-ink-3">
          <span className="h-px flex-1 bg-line" />
          or
          <span className="h-px flex-1 bg-line" />
        </div>

        <form action={signInAsDemo}>
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            className="group flex w-full items-center gap-4 rounded-2xl p-4 text-left ring-1 ring-inset ring-line-strong transition-colors hover:bg-paper hover:ring-ink-3"
          >
            <span
              className="sticker shrink-0"
              style={{ "--size": "3rem", "--dot": "#FFE14D", "--tilt": "-8deg", fontSize: "0.85rem" } as React.CSSProperties}
              aria-hidden
            >
              DEMO
            </span>
            <span>
              <span className="block text-[15px] font-semibold">Explore with a demo account</span>
              <span className="block text-sm text-ink-3">
                Sign in as Maya, a Brooklyn seller with listings and conversations already set up.
              </span>
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <span className="grid size-6 place-items-center rounded-full bg-white">
      <svg viewBox="0 0 48 48" className="size-4" aria-hidden>
        <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
      </svg>
    </span>
  );
}
