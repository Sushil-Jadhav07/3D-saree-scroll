import { HALF_TOP } from "@/lib/data";
import { IMG, un } from "@/lib/images";
/** Normalised clip shapes (objectBoundingBox). Rendered once by <GarmentDefs/>. */
export function GarmentDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        {/* a saree folded over the bar: straight shoulders, soft wavy hem */}
        <clipPath id="g-drape" clipPathUnits="objectBoundingBox">
          <path d="M0.05,0 L0.95,0 L0.985,0.18 L0.975,0.55 C0.985,0.78 0.995,0.9 0.955,0.955 C0.88,1 0.8,0.95 0.7,0.975 C0.6,1.005 0.5,0.955 0.4,0.98 C0.3,1.005 0.2,0.96 0.12,0.975 C0.03,0.96 0.015,0.8 0.025,0.55 C0.02,0.3 0.02,0.15 0.05,0 Z" />
        </clipPath>
        {/* half-saree: fitted choli at the bar, flared skirt below */}
        <clipPath id="g-half" clipPathUnits="objectBoundingBox">
          <path d="M0.3,0 L0.7,0 L0.76,0.07 L0.74,0.27 C0.86,0.55 0.95,0.8 0.985,0.95 C0.9,1 0.82,0.96 0.72,0.985 C0.62,1.01 0.52,0.96 0.42,0.985 C0.3,1.01 0.2,0.96 0.1,0.985 C0.02,0.96 0.04,0.9 0.015,0.95 C0.05,0.8 0.14,0.55 0.26,0.27 L0.24,0.07 Z" />
        </clipPath>
        <clipPath id="g-blouse-half" clipPathUnits="objectBoundingBox">
          <path d="M0.3,0.04 C0.36,0.36 0.64,0.36 0.7,0.04 L0.89,0.13 L1,0.58 L0.84,0.65 L0.8,0.44 L0.8,0.97 C0.62,1.01 0.38,1.01 0.2,0.97 L0.2,0.44 L0.16,0.65 L0,0.58 L0.11,0.13 Z" />
        </clipPath>
        <clipPath id="g-blouse-full" clipPathUnits="objectBoundingBox">
          <path d="M0.3,0.04 C0.36,0.36 0.64,0.36 0.7,0.04 L0.89,0.13 L0.995,0.9 L0.85,0.93 L0.8,0.4 L0.8,0.97 C0.62,1.01 0.38,1.01 0.2,0.97 L0.2,0.4 L0.15,0.93 L0.005,0.9 L0.11,0.13 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}
const mix = (c, pct) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;
function fabricStyle(p) {
  switch (p.pattern) {
    case "check":
      return {
        backgroundColor: p.c1,
        backgroundImage: [
          `repeating-linear-gradient(90deg, ${mix(p.c2, 62)} 0 9%, transparent 9% 22%, ${mix("#000", 25)} 22% 25%, transparent 25% 44%)`,
          `repeating-linear-gradient(0deg, ${mix(p.c2, 62)} 0 4.2%, transparent 4.2% 10%, ${mix("#000", 25)} 10% 11.5%, transparent 11.5% 20%)`,
        ].join(","),
      };
    case "stripe":
      return {
        backgroundColor: p.c1,
        backgroundImage: `repeating-linear-gradient(90deg, transparent 0 15%, ${mix(p.c2, 85)} 15% 17%, transparent 17% 30%)`,
      };
    case "brocade":
      return {
        backgroundColor: p.c1,
        backgroundImage: [
          `radial-gradient(circle at 50% 50%, ${mix(p.c2, 90)} 0 1.6px, transparent 2.4px)`,
          `radial-gradient(circle at 50% 50%, ${mix(p.c2, 55)} 0 1px, transparent 1.8px)`,
        ].join(","),
        backgroundSize: "15px 15px, 15px 15px",
        backgroundPosition: "0 0, 7.5px 7.5px",
      };
    default:
      return { backgroundColor: p.c1 };
  }
}
/**
 * A garment on a wooden hanger, drawn in the browser so it recolours per product:
 * SVG hanger + clipped fabric (base colour, silk-sheen photo overlay, folds, zari hem).
 * `w` is the pixel width; height follows the garment type.
 */
export default function Garment({ piece, w, back = false }) {
  const isBlouse = piece.cat === "blouse-full" || piece.cat === "blouse-half";
  const isHalf = piece.cat === "half";
  const hangerH = w * 0.46;
  const fabricTop = isBlouse ? hangerH * 0.5 : hangerH * 0.7;
  const fabricH = isBlouse ? w * (piece.sleeve === "full" ? 0.98 : 0.86) : isHalf ? w * 1.3 : w * 1.5;
  const clip = isBlouse ? (piece.sleeve === "full" ? "g-blouse-full" : "g-blouse-half") : isHalf ? "g-half" : "g-drape";
  const fw = isBlouse ? w * 0.92 : isHalf ? w * 0.92 : w * 0.8;
  const height = fabricTop + fabricH;
  return (
    <div className="relative" style={{ width: w, height }} aria-hidden>
      {/* hanger */}
      <svg viewBox="0 0 200 92" className="absolute left-0 top-0" style={{ width: w, height: hangerH }}>
        <defs>
          <linearGradient id={`wood-${piece.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a55b36" />
            <stop offset="0.5" stopColor="#7d3d20" />
            <stop offset="1" stopColor="#5a2812" />
          </linearGradient>
        </defs>
        <path
          d="M100 38 C100 24 99 14 106 9 C115 3 126 11 121 20 C118 25 111 26 109 32"
          fill="none"
          stroke="#b8bcc2"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <path d="M100 38 L14 74 Q4 79 9 85 Q12 88 18 88 L182 88 Q188 88 191 85 Q196 79 186 74 Z" fill={`url(#wood-${piece.id})`} />
        <path d="M100 38 L14 74" stroke="#d58a5c" strokeWidth="1.1" opacity=".55" />
        <path d="M100 38 L186 74" stroke="#2c1208" strokeWidth="1.1" opacity=".4" />
      </svg>

      {/* garment (outer wrapper carries the shadow, inner one is clipped) */}
      <div
        className="absolute left-1/2"
        style={{
          top: fabricTop,
          width: fw,
          height: fabricH,
          filter: "drop-shadow(0 14px 12px rgba(40,20,10,0.28))",
          transform: `translateX(-50%) ${back ? "scaleX(-1)" : ""}`,
        }}
      >
        <div className="relative h-full w-full overflow-hidden" style={{ clipPath: `url(#${clip})`, ...fabricStyle(piece) }}>
          {/* silk sheen from a real satin photograph */}
          <div
            className="absolute inset-0 opacity-60 mix-blend-soft-light"
            style={{ backgroundImage: `url(${un(IMG.fabricTexture, 500)})`, backgroundSize: "cover" }}
          />
          {/* vertical folds */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(0,0,0,0.22) 0 3%, rgba(255,255,255,0.1) 9%, rgba(0,0,0,0.04) 15%, rgba(0,0,0,0.2) 19%, transparent 26%)",
              mixBlendMode: "multiply",
              opacity: 0.8,
            }}
          />
          {/* shadow under the bar, light toward the hem */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/10" />

          {isHalf && (
            <>
              {/* choli + dupatta */}
              <div
                className="absolute inset-x-0 top-0"
                style={{
                  height: "29%",
                  background: `linear-gradient(160deg, ${HALF_TOP[piece.id] ?? piece.c2}, color-mix(in srgb, ${HALF_TOP[piece.id] ?? piece.c2} 72%, black))`,
                }}
              />
              <div
                className="absolute inset-x-0"
                style={{ top: "27.5%", height: "2.6%", background: piece.c2, boxShadow: "0 2px 3px rgba(0,0,0,0.3)" }}
              />
              <div
                className="absolute"
                style={{
                  left: "-10%",
                  top: "6%",
                  width: "70%",
                  height: "30%",
                  background: `color-mix(in srgb, ${HALF_TOP[piece.id] ?? piece.c2} 85%, transparent)`,
                  transform: "rotate(38deg)",
                  transformOrigin: "0 0",
                  filter: "blur(0.4px)",
                }}
              />
            </>
          )}
          {isBlouse ? (
            <>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                <path
                  d="M30,4 C36,36 64,36 70,4"
                  fill="none"
                  stroke={piece.c2}
                  strokeWidth="1.8"
                  strokeDasharray="1.2 2.2"
                  vectorEffect="non-scaling-stroke"
                  opacity=".95"
                />
                <path
                  d="M30,6 C36,33 64,33 70,6"
                  fill="none"
                  stroke={piece.c2}
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  opacity=".7"
                />
              </svg>
              {/* embroidered cuffs */}
              <div
                className="absolute rounded-sm"
                style={{
                  left: "0%",
                  top: piece.sleeve === "full" ? "80%" : "50%",
                  width: "17%",
                  height: "9%",
                  background: `repeating-linear-gradient(90deg, ${piece.c2} 0 3px, transparent 3px 6px)`,
                  transform: "rotate(-14deg)",
                  opacity: 0.9,
                }}
              />
              <div
                className="absolute rounded-sm"
                style={{
                  right: "0%",
                  top: piece.sleeve === "full" ? "80%" : "50%",
                  width: "17%",
                  height: "9%",
                  background: `repeating-linear-gradient(90deg, ${piece.c2} 0 3px, transparent 3px 6px)`,
                  transform: "rotate(14deg)",
                  opacity: 0.9,
                }}
              />
            </>
          ) : (
            <>
              {/* zari hem: wide border + pin-stripes */}
              <div
                className="absolute inset-x-0 bottom-0"
                style={{
                  height: back ? "34%" : isHalf ? "22%" : "17%",
                  background: `linear-gradient(to top, ${piece.c2} 0 28%, ${mix(piece.c2, 0)} 28% 36%, ${piece.c2} 36% 40%, transparent 40% 52%, ${mix(piece.c2, 85)} 52% 56%, transparent 56%)`,
                  boxShadow: "inset 0 6px 8px -6px rgba(0,0,0,0.35)",
                }}
              />
              <div
                className="absolute inset-y-0 left-0 w-[5%]"
                style={{ background: `linear-gradient(90deg, ${piece.c2}, transparent)`, opacity: 0.8 }}
              />
              <div
                className="absolute inset-y-0 right-0 w-[5%]"
                style={{ background: `linear-gradient(270deg, ${piece.c2}, transparent)`, opacity: 0.8 }}
              />
            </>
          )}
          {back && <div className="absolute inset-0 bg-black/10" />}
        </div>
      </div>
    </div>
  );
}
