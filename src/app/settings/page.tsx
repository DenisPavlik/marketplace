import type { Metadata } from "next";
import { ProfileForm } from "@/components/settings/profile-form";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { requireUserId } from "@/lib/auth";
import { getProfile } from "@/lib/listings";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const userId = await requireUserId("/settings");
  const profile = await getProfile(userId);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-10 sm:px-6">
      <h1 className="font-display text-[clamp(1.9rem,4vw,2.8rem)] leading-none">Settings</h1>

      <section className="reveal mt-10 rounded-2xl bg-surface p-5 ring-1 ring-line sm:p-6">
        <h2 className="font-display text-xl">Profile</h2>
        <p className="mt-1 text-sm text-ink-3">This is what buyers and sellers see.</p>
        <div className="mt-6">
          <ProfileForm initialName={profile?.display_name ?? ""} initialBio={profile?.bio ?? ""} />
        </div>
      </section>

      <section className="reveal mt-6 rounded-2xl [--i:1] bg-surface p-5 ring-1 ring-line sm:p-6">
        <h2 className="font-display text-xl">Appearance</h2>
        <p className="mt-1 text-sm text-ink-3">System matches your device and switches automatically.</p>
        <ThemeSwitcher className="mt-5 max-w-sm" />
      </section>
    </div>
  );
}
