"use client";

import { upload } from "@imagekit/next";
import { ArrowLeft, ArrowRight, ImagePlus, LoaderCircle, RotateCcw, X } from "lucide-react";
import clsx from "clsx";
import Image from "next/image";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { ListingImage } from "@/components/listing-image";
import { MAX_IMAGES, type ListingImage as ListingImageData } from "@/lib/listing";

const MAX_BYTES = 15 * 1024 * 1024;

export type UploadItem =
  | { key: string; status: "done"; image: ListingImageData }
  | { key: string; status: "uploading"; preview: string; progress: number; file: File }
  | { key: string; status: "error"; preview: string; file: File };

async function getUploadAuth() {
  const res = await fetch("/api/imagekit/auth", { cache: "no-store" });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Couldn't start the upload.");
  return body as { token: string; expire: number; signature: string; publicKey: string; folder: string };
}

export function ImageUploader({
  items,
  onChange,
  error,
}: {
  items: UploadItem[];
  onChange: (update: (prev: UploadItem[]) => UploadItem[]) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const previews = useRef(new Set<string>());

  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  async function startUpload(key: string, file: File) {
    try {
      const auth = await getUploadAuth();
      const res = await upload({
        file,
        fileName: file.name.replace(/[^\w.-]+/g, "-").slice(-80) || "photo.jpg",
        folder: auth.folder,
        useUniqueFileName: true,
        token: auth.token,
        expire: auth.expire,
        signature: auth.signature,
        publicKey: auth.publicKey,
        onProgress: (e) => {
          const progress = e.total ? e.loaded / e.total : 0;
          onChange((prev) =>
            prev.map((it) => (it.key === key && it.status === "uploading" ? { ...it, progress } : it)),
          );
        },
      });
      if (!res.fileId || !res.filePath) throw new Error("Upload response was incomplete.");
      const image: ListingImageData = {
        fileId: res.fileId,
        path: res.filePath,
        width: res.width,
        height: res.height,
      };
      onChange((prev) => prev.map((it) => (it.key === key ? { key, status: "done", image } : it)));
    } catch (err) {
      onChange((prev) =>
        prev.map((it) =>
          it.key === key && it.status === "uploading"
            ? { key, status: "error", preview: it.preview, file: it.file }
            : it,
        ),
      );
      toast.error(err instanceof Error ? err.message : "A photo failed to upload.");
    }
  }

  function addFiles(list: FileList | File[]) {
    const files = Array.from(list).filter((f) => f.type.startsWith("image/"));
    const room = MAX_IMAGES - items.length;
    if (room <= 0) {
      toast.error(`You can add up to ${MAX_IMAGES} photos.`);
      return;
    }
    const tooBig = files.filter((f) => f.size > MAX_BYTES);
    if (tooBig.length) toast.error("Photos must be smaller than 15 MB.");
    const accepted = files.filter((f) => f.size <= MAX_BYTES).slice(0, room);
    if (files.length - tooBig.length > room) toast.message(`Only the first ${room} photos were added.`);

    const added = accepted.map((file) => {
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      return { key: crypto.randomUUID(), status: "uploading" as const, preview, progress: 0, file };
    });
    onChange((prev) => [...prev, ...added]);
    added.forEach((it) => startUpload(it.key, it.file));
  }

  function retry(item: Extract<UploadItem, { status: "error" }>) {
    onChange((prev) =>
      prev.map((it) =>
        it.key === item.key ? { key: item.key, status: "uploading", preview: item.preview, progress: 0, file: item.file } : it,
      ),
    );
    startUpload(item.key, item.file);
  }

  function move(index: number, delta: number) {
    onChange((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={clsx(
          "grid grid-cols-3 gap-2.5 rounded-2xl border-2 border-dashed p-2.5 transition-colors sm:grid-cols-4",
          dragging ? "border-ink bg-ink/5" : error ? "border-danger/50" : "border-line-strong",
        )}
      >
        {items.map((item, i) => (
          <figure key={item.key} className="group/photo relative aspect-square overflow-hidden rounded-xl bg-line">
            {item.status === "done" ? (
              <ListingImage
                src={item.image.path}
                alt={`Photo ${i + 1}`}
                fill
                sizes="160px"
                transformation={[{ aspectRatio: "1-1", focus: "auto" }]}
                className="object-cover"
              />
            ) : (
              <Image src={item.preview} alt="" fill unoptimized className="object-cover opacity-70" />
            )}

            {item.status === "uploading" && (
              <div className="absolute inset-0 grid place-items-center bg-ink/30">
                <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold">
                  <LoaderCircle className="size-3.5 animate-spin" />
                  {Math.round(item.progress * 100)}%
                </span>
              </div>
            )}
            {item.status === "error" && (
              <button
                type="button"
                onClick={() => retry(item)}
                className="absolute inset-0 grid place-items-center bg-danger/40 text-white"
              >
                <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-danger">
                  <RotateCcw className="size-3.5" /> Retry
                </span>
              </button>
            )}

            {i === 0 && (
              <figcaption className="absolute bottom-1.5 left-1.5 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">
                Cover
              </figcaption>
            )}

            <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover/photo:opacity-100 sm:group-focus-within/photo:opacity-100">
              <IconButton label="Remove photo" onClick={() => onChange((prev) => prev.filter((it) => it.key !== item.key))}>
                <X className="size-3.5" />
              </IconButton>
            </div>
            {items.length > 1 && (
              <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover/photo:opacity-100 sm:group-focus-within/photo:opacity-100">
                {i > 0 && (
                  <IconButton label="Move photo earlier" onClick={() => move(i, -1)}>
                    <ArrowLeft className="size-3.5" />
                  </IconButton>
                )}
                {i < items.length - 1 && (
                  <IconButton label="Move photo later" onClick={() => move(i, 1)}>
                    <ArrowRight className="size-3.5" />
                  </IconButton>
                )}
              </div>
            )}
          </figure>
        ))}

        {items.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={clsx(
              "flex flex-col items-center justify-center gap-1.5 rounded-xl bg-surface text-center text-[13px] font-semibold text-ink-2 ring-1 ring-inset ring-line transition-colors hover:text-ink hover:ring-ink-3",
              items.length === 0 ? "col-span-3 py-12 sm:col-span-4" : "aspect-square",
            )}
          >
            <ImagePlus className={items.length === 0 ? "size-8" : "size-6"} strokeWidth={1.75} />
            {items.length === 0 ? (
              <>
                <span className="text-[15px] text-ink">Add photos</span>
                <span className="font-normal text-ink-3">or drag them here · up to {MAX_IMAGES}</span>
              </>
            ) : (
              "Add more"
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-1.5 text-[13px] text-danger">{error}</p>}
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-full bg-white/95 text-ink shadow-sm hover:bg-white"
    >
      {children}
    </button>
  );
}
