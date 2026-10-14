import { ImageResponse } from "next/og";
import { conditionLabel, getCategory } from "@/lib/categories";
import { stickerTilt } from "@/lib/format";
import { IK_ENDPOINT } from "@/lib/imagekit";
import { getListing } from "@/lib/listings";
import { fetchImageDataUrl, loadOgFonts, OG, OG_SIZE, OgSticker, OgTape, OgWordmark } from "@/lib/og";

export const alt = "A listing on Stoop with its price sticker";
export const size = OG_SIZE;
export const contentType = "image/png";

const PHOTO_WIDTH = 660;
const STICKER = 236;
const TAPE: Record<string, string> = { reserved: "On hold", sold: "Sold" };

function clampTitle(title: string, max = 64): string {
  if (title.length <= max) return title;
  const cut = title.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\s—-]+$/, "")}…`;
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [fonts, listing] = await Promise.all([loadOgFonts(), getListing(id)]);

  // Unknown ids get the plain brand card rather than an error.
  if (!listing) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: OG.paper }}>
          <OgWordmark size={120} />
        </div>
      ),
      { ...size, fonts },
    );
  }

  const cover = listing.images[0];
  const photo = cover
    ? await fetchImageDataUrl(`${IK_ENDPOINT}${cover.path}?tr=w-${PHOTO_WIDTH},h-${size.height},fo-auto,f-jpg`)
    : null;
  const category = getCategory(listing.category);
  const condition = conditionLabel(listing.condition);
  const title = clampTitle(listing.title);
  const titleSize = title.length <= 30 ? 54 : title.length <= 48 ? 46 : 40;
  const tape = TAPE[listing.status];

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: OG.paper, position: "relative" }}>
        {photo ? (
          <img src={photo} width={PHOTO_WIDTH} height={size.height} style={{ objectFit: "cover" }} alt="" />
        ) : (
          <div style={{ width: PHOTO_WIDTH, height: size.height, background: OG.sunken }} />
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: "56px 60px 52px 64px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "Archivo", fontWeight: 700, fontSize: 24, color: OG.ink2 }}>
              <div style={{ width: 18, height: 18, borderRadius: 18, background: category.dot, boxShadow: "0 0 0 1px rgba(0,0,0,0.1)" }} />
              {category.label}
            </div>
            <div
              style={{
                fontFamily: "Archivo Expanded",
                fontWeight: 800,
                fontSize: titleSize,
                lineHeight: 1.06,
                letterSpacing: "-0.025em",
                color: OG.ink,
              }}
            >
              {title}
            </div>
            <div style={{ display: "flex", fontFamily: "Archivo", fontWeight: 500, fontSize: 26, color: OG.ink3 }}>
              {[condition, listing.location_name].filter(Boolean).join(" · ")}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <OgWordmark size={40} />
          </div>
        </div>

        {tape && <OgTape label={tape} style={{ position: "absolute", left: -12, top: 44, transform: "rotate(-8deg)" }} />}

        <OgSticker
          price={listing.price}
          category={listing.category}
          size={STICKER}
          tilt={stickerTilt(listing.id)}
          exact
          style={{ position: "absolute", left: PHOTO_WIDTH - STICKER * 0.62, bottom: 44 }}
        />
      </div>
    ),
    { ...size, fonts },
  );
}
