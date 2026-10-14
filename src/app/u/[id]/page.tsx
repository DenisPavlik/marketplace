import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { ListingCard, ListingGrid } from "@/components/listing-card";
import { EmptyState } from "@/components/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { formatMemberSince } from "@/lib/format";
import { getProfile, getSavedIds, getSellerListings } from "@/lib/listings";
import { getUserId } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getProfile((await params).id);
  return { title: profile ? `${profile.display_name} on Stoop` : "Profile not found" };
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;
  const [profile, userId] = await Promise.all([getProfile(id), getUserId()]);
  if (!profile) notFound();

  const isSelf = userId === profile.id;
  const listings = await getSellerListings(profile.id, { includeSold: true });
  const saved = await getSavedIds(userId, listings.map((l) => l.id));
  const available = listings.filter((l) => l.status !== "sold");
  const soldCount = listings.length - available.length;

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-10 sm:px-6">
      <header className="flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-center">
        <Avatar name={profile.display_name} src={profile.avatar_url} size={88} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[clamp(1.9rem,4vw,2.8rem)] leading-none">{profile.display_name}</h1>
          <p className="mt-2 text-[15px] text-ink-2">
            On Stoop since {formatMemberSince(profile.created_at)} · {available.length} for sale
            {soldCount > 0 && ` · ${soldCount} sold`}
          </p>
          {profile.bio && <p className="mt-3 max-w-xl text-[15px] leading-relaxed">{profile.bio}</p>}
        </div>
        {isSelf && (
          <ButtonLink href="/selling" variant="secondary">
            Manage listings
          </ButtonLink>
        )}
      </header>

      <div className="mt-8">
        {listings.length === 0 ? (
          <EmptyState
            title={isSelf ? "You haven't listed anything yet" : "Nothing listed right now"}
            action={isSelf ? <ButtonLink href="/sell">List something</ButtonLink> : undefined}
          >
            {isSelf ? "Your listings will show up here for buyers to browse." : "Check back later."}
          </EmptyState>
        ) : (
          <ListingGrid>
            {listings.map((l, i) => (
              <ListingCard
                key={l.id}
                listing={l}
                saved={saved.has(l.id)}
                signedIn={Boolean(userId)}
                showFavorite={!isSelf}
                priority={i < 4}
                index={i}
              />
            ))}
          </ListingGrid>
        )}
      </div>
    </div>
  );
}
