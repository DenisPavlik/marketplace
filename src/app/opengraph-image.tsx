import { ImageResponse } from "next/og";
import { IK_ENDPOINT } from "@/lib/imagekit";
import { fetchImageDataUrl, loadOgFonts, OG, OG_SIZE, OgSticker, OgWordmark } from "@/lib/og";

export const alt = "Stoop: buy and sell secondhand with your neighbors";
export const size = OG_SIZE;
export const contentType = "image/png";

// A small pile of seeded listings, each wearing its price sticker.
const PILE = [
  { path: "/stoop/seed/orange-armchair-1.jpg", price: 180, category: "home", left: 596, top: 46, tilt: -7, dotTilt: 10, dotRight: -40 },
  { path: "/stoop/seed/canon-ae1-1.jpg", price: 240, category: "hobbies", left: 846, top: 92, tilt: 5, dotTilt: -8, dotRight: -14 },
  { path: "/stoop/seed/cruiser-skateboard-1.jpg", price: 70, category: "sports", left: 742, top: 318, tilt: -2, dotTilt: 6, dotRight: -40 },
];

const PHOTO = 272;

export default async function Image() {
  const [fonts, photos] = await Promise.all([
    loadOgFonts(),
    Promise.all(
      PILE.map((item) => fetchImageDataUrl(`${IK_ENDPOINT}${item.path}?tr=w-${PHOTO * 2},h-${PHOTO * 2},fo-auto,f-jpg`)),
    ),
  ]);

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: OG.paper, position: "relative" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 560,
            padding: "64px 0 60px 72px",
          }}
        >
          <OgWordmark size={52} />
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                fontFamily: "Archivo Expanded",
                fontWeight: 800,
                fontSize: 64,
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
                color: OG.ink,
              }}
            >
              Buy and sell with your neighbors.
            </div>
            <div style={{ fontFamily: "Archivo", fontWeight: 500, fontSize: 27, lineHeight: 1.35, color: OG.ink2 }}>
              Secondhand finds down the block. Message sellers in real time.
            </div>
          </div>
          <div style={{ fontFamily: "Archivo", fontWeight: 700, fontSize: 22, color: OG.ink3 }}>
            stoop-market.vercel.app
          </div>
        </div>

        {PILE.map((item, i) => (
          <div
            key={item.path}
            style={{
              position: "absolute",
              left: item.left,
              top: item.top,
              display: "flex",
              padding: "14px 14px 54px",
              background: OG.surface,
              borderRadius: 6,
              boxShadow: "0 18px 40px -12px rgba(21,23,28,0.35), 0 2px 6px rgba(21,23,28,0.12)",
              transform: `rotate(${item.tilt}deg)`,
            }}
          >
            {photos[i] ? (
              <img src={photos[i]} width={PHOTO} height={PHOTO} style={{ objectFit: "cover", borderRadius: 2 }} alt="" />
            ) : (
              <div style={{ width: PHOTO, height: PHOTO, background: OG.sunken, borderRadius: 2 }} />
            )}
            <OgSticker
              price={item.price}
              category={item.category}
              size={128}
              tilt={item.dotTilt}
              style={{ position: "absolute", right: item.dotRight, top: -36 }}
            />
          </div>
        ))}
      </div>
    ),
    { ...size, fonts },
  );
}
