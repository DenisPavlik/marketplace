"use client";

import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { CategoryDot, PriceDot } from "@/components/price-dot";
import { ListingImage } from "@/components/listing-image";
import { ImageUploader, type UploadItem } from "@/components/sell/image-uploader";
import { LocationField, type PickedLocation } from "@/components/sell/location-field";
import { createListing, updateListing } from "@/app/actions/listings";
import { CATEGORIES, CONDITIONS } from "@/lib/categories";
import { DEFAULT_LOCATION } from "@/lib/filters";
import type { ListingImage as ListingImageData } from "@/lib/listing";
import { DRAFT_EVENT, DRAFT_STORAGE_KEY, type ListingDraft } from "@/lib/assistant/types";

export type ListingFormValues = {
  title: string;
  description: string;
  price: string;
  category: string;
  condition: string | null;
  location: PickedLocation | null;
  images: ListingImageData[];
};

const EMPTY: ListingFormValues = {
  title: "",
  description: "",
  price: "",
  category: "",
  condition: null,
  location: null,
  images: [],
};

type Errors = Partial<Record<"title" | "description" | "price" | "category" | "condition" | "images" | "location", string>>;

export function ListingForm({
  listingId,
  initial = EMPTY,
}: {
  /** Present when editing an existing listing. */
  listingId?: string;
  initial?: ListingFormValues;
}) {
  const router = useRouter();
  const editing = Boolean(listingId);
  const [values, setValues] = useState(initial);
  const [uploads, setUploads] = useState<UploadItem[]>(() =>
    initial.images.map((image) => ({ key: image.fileId, status: "done", image })),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // Drafts written by Dot, the assistant: sent live on this page, or left in storage
  // when the visitor started from another page.
  useEffect(() => {
    if (editing) return;
    const apply = (draft: ListingDraft) => {
      setValues((v) => ({
        ...v,
        title: draft.title.slice(0, 100),
        description: draft.description.slice(0, 5000),
        category: CATEGORIES.some((c) => c.slug === draft.category) ? draft.category : v.category,
        condition: CONDITIONS.some((c) => c.value === draft.condition) ? (draft.condition ?? null) : v.condition,
        price: draft.price != null ? String(draft.price) : v.price,
      }));
      setErrors({});
      toast.success("Draft filled in", { description: "Check the details, then add photos and a pickup area." });
    };
    const onDraft = (e: Event) => apply((e as CustomEvent<ListingDraft>).detail);
    window.addEventListener(DRAFT_EVENT, onDraft);
    try {
      const stored = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (stored) {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        apply(JSON.parse(stored) as ListingDraft);
      }
    } catch {
      // Unreadable draft: start with an empty form.
    }
    return () => window.removeEventListener(DRAFT_EVENT, onDraft);
  }, [editing]);

  const doneImages = uploads.flatMap((u) => (u.status === "done" ? [u.image] : []));
  const uploading = uploads.some((u) => u.status === "uploading");
  const priceNumber = values.price.trim() === "" ? null : Number(values.price);

  function validate(): Errors {
    const e: Errors = {};
    if (doneImages.length === 0) e.images = "Add at least one photo.";
    if (values.title.trim().length < 3) e.title = "Give it a title of at least 3 characters.";
    if (priceNumber == null || !Number.isFinite(priceNumber) || priceNumber < 0)
      e.price = "Enter a price, or 0 if it's free.";
    if (!values.category) e.category = "Pick a category.";
    if (!values.location) e.location = "Set a pickup area on the map.";
    return e;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validate();
    if (Object.values(found).some(Boolean)) {
      setErrors(found);
      toast.error("A few things are missing.");
      return;
    }

    const input = {
      title: values.title,
      description: values.description,
      price: priceNumber!,
      category: values.category as never,
      condition: values.condition,
      lat: values.location!.lat,
      lng: values.location!.lng,
      locationName: values.location!.name.trim() || null,
      images: doneImages,
    };

    startTransition(async () => {
      const res = editing
        ? { ...(await updateListing(listingId!, input)), id: listingId! }
        : await createListing(input).then((r) => (r.ok ? { ...r, id: r.data.id } : r));
      if (!res.ok) {
        const fe = res.fieldErrors ?? {};
        setErrors({
          title: fe.title?.[0],
          description: fe.description?.[0],
          price: fe.price?.[0],
          category: fe.category?.[0],
          images: fe.images?.[0],
          location: fe.lat?.[0] ?? fe.lng?.[0] ?? fe.locationName?.[0],
        });
        toast.error(res.error);
        return;
      }
      toast.success(editing ? "Changes saved" : "Listing published");
      router.push(`/listings/${res.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-8">
        <Section title="Photos" hint="The first photo is the cover. Bright, uncluttered shots sell faster.">
          <ImageUploader items={uploads} onChange={setUploads} error={errors.images} />
        </Section>

        <Section title="Details">
          <div className="flex flex-col gap-5">
            <Field label="Title" htmlFor="title" error={errors.title}>
              <Input
                id="title"
                value={values.title}
                maxLength={100}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Mid-century walnut armchair"
                aria-invalid={Boolean(errors.title)}
              />
            </Field>

            <Field label="Price" htmlFor="price" error={errors.price} hint="Enter 0 to give it away.">
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3">$</span>
                <Input
                  id="price"
                  inputMode="decimal"
                  value={values.price}
                  onChange={(e) => set("price", e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="0"
                  className="pl-7"
                  aria-invalid={Boolean(errors.price)}
                />
              </div>
            </Field>

            <fieldset>
              <legend className="text-[13px] font-semibold">Category</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CATEGORIES.map((c) => (
                  <label
                    key={c.slug}
                    className={clsx(
                      "flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium ring-1 ring-inset transition-colors has-focus-visible:outline-2 has-focus-visible:outline-ink",
                      values.category === c.slug ? "bg-ink text-on-ink ring-ink" : "bg-surface ring-line-strong hover:ring-ink-3",
                    )}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={c.slug}
                      checked={values.category === c.slug}
                      onChange={() => set("category", c.slug)}
                      className="sr-only"
                    />
                    <CategoryDot category={c.slug} />
                    {c.label}
                  </label>
                ))}
              </div>
              {errors.category && <p className="mt-1.5 text-[13px] text-danger">{errors.category}</p>}
            </fieldset>

            <fieldset>
              <legend className="text-[13px] font-semibold">
                Condition <span className="font-normal text-ink-3">(optional)</span>
              </legend>
              <div className="mt-2 inline-flex flex-wrap gap-1 rounded-full bg-surface p-1 ring-1 ring-inset ring-line-strong">
                {CONDITIONS.map((c) => (
                  <label
                    key={c.value}
                    className={clsx(
                      "cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-ink",
                      values.condition === c.value ? "bg-ink text-on-ink" : "hover:bg-paper",
                    )}
                  >
                    <input
                      type="radio"
                      name="condition"
                      value={c.value}
                      checked={values.condition === c.value}
                      onChange={() => set("condition", c.value)}
                      onClick={() => values.condition === c.value && set("condition", null)}
                      className="sr-only"
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <Field
              label="Description"
              htmlFor="description"
              error={errors.description}
              hint={`${values.description.length} / 5,000 · Size, age, flaws, pickup times`}
            >
              <Textarea
                id="description"
                value={values.description}
                maxLength={5000}
                onChange={(e) => set("description", e.target.value)}
                placeholder="What should a buyer know?"
                rows={6}
              />
            </Field>
          </div>
        </Section>

        <Section title="Pickup area">
          <LocationField
            value={values.location}
            onChange={(loc) => set("location", loc)}
            fallbackCenter={DEFAULT_LOCATION}
            error={errors.location}
          />
        </Section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-3">Preview</h2>
        <div className="mt-3 rounded-2xl bg-surface p-3 ring-1 ring-line">
          <div className="relative">
            <div className="relative aspect-square overflow-hidden rounded-card bg-line">
              {doneImages[0] ? (
                <ListingImage
                  src={doneImages[0].path}
                  alt=""
                  fill
                  sizes="320px"
                  transformation={[{ aspectRatio: "1-1", focus: "auto" }]}
                  className="object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-sm text-ink-3">Your cover photo</div>
              )}
            </div>
            {priceNumber != null && Number.isFinite(priceNumber) && (
              <PriceDot
                key={values.category}
                price={priceNumber}
                category={values.category || "misc"}
                seed={listingId ?? values.title ?? "new"}
                size="lg"
                animate
                className="absolute -bottom-6 right-3"
              />
            )}
          </div>
          <p className="mt-3 line-clamp-2 pr-20 text-[15px] font-semibold">{values.title || "Your title"}</p>
          <p className="mt-0.5 truncate pr-20 text-[13px] text-ink-3">
            {values.location?.name || "Pickup area"}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <Button type="submit" size="lg" disabled={pending || uploading}>
            {uploading ? "Waiting for photos…" : pending ? (editing ? "Saving…" : "Publishing…") : editing ? "Save changes" : "Publish listing"}
          </Button>
          {editing && (
            <Button variant="ghost" onClick={() => router.back()} disabled={pending}>
              Cancel
            </Button>
          )}
        </div>
      </aside>
    </form>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl">{title}</h2>
      {hint && <p className="mt-1 text-sm text-ink-3">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
