import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { INTRO_FILM } from "@/lib/images";
/** Polygon whose bottom edge is a travelling silk-like wave. `p` runs 0 (hidden) → 1 (covers the screen). */
function drape(p) {
  const pts = ["0% 0%", "100% 0%"];
  const edge = p * 128 - 14; // % of viewport height; overshoots so the whole screen is covered at p=1
  for (let i = 20; i >= 0; i--) {
    const x = i * 5;
    const y = edge + Math.sin(i * 0.62 + p * 7) * 6 * (1 - p * 0.35) + Math.sin(i * 1.4 - p * 4) * 2.4;
    pts.push(`${x}% ${y}%`);
  }
  return `polygon(${pts.join(",")})`;
}
/**
 * Opening sequence: white screen + NOOLAM mark, then a red zari silk drops like a curtain
 * (real silk footage), holds, and dissolves into the hero. Skipped for reduced-motion users.
 */
export default function Intro() {
  const [done, setDone] = useState(false);
  const [vidOk, setVidOk] = useState(true);
  const [mounted, setMounted] = useState(false); // the drape is browser-only: its clip-path maths differs by float bits between server and client
  const p = useMotionValue(0);
  const clip = useTransform(p, drape);
  useEffect(() => {
    setMounted(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDone(true);
      return;
    }
    document.documentElement.style.overflow = "hidden";
    const drop = animate(p, 1, { duration: 1.5, delay: 0.9, ease: [0.55, 0.05, 0.25, 1] });
    const t = setTimeout(() => setDone(true), 3900);
    return () => {
      drop.stop();
      clearTimeout(t);
      document.documentElement.style.overflow = "";
    };
  }, [p]);
  useEffect(() => {
    if (done) document.documentElement.style.overflow = "";
  }, [done]);
  if (done) return null;
  return (
    <motion.div
      id="intro"
      aria-hidden
      className="fixed inset-0 z-[200] overflow-hidden bg-white"
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 1, 0] }}
      transition={{ duration: 3.9, times: [0, 0.7, 0.8, 1], ease: "easeInOut" }}
    >
      {/* white page with the mark, visible until the silk covers it */}
      <div className="absolute inset-0 grid place-items-center">
        {/* plain CSS animation so the mark paints with the server HTML, before any JS has loaded */}
        <div className="intro-logo text-center">
          <svg
            width="40"
            height="26"
            viewBox="0 0 22 14"
            className="mx-auto text-maroon"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
          >
            <path d="M11 1c1.5 2.5 1.5 5 0 8-1.5-3-1.5-5.5 0-8Z" />
            <path d="M11 9C8 8 4.5 6.5 1 7c2 3.5 6 5.5 10 5 4 .5 8-1.5 10-5-3.5-.5-7 1-10 2Z" />
          </svg>
          <p className="mt-1 font-serif text-[clamp(2.2rem,6vw,4.2rem)] text-maroon">NOOLAM</p>
          <p className="mt-1 text-[10px] tracking-[0.5em] text-gold">KANCHIPURAM SILK</p>
        </div>
      </div>

      {/* red zari silk drapes down over it */}
      {mounted && (
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,#e3261b,#a30f12_70%,#6e070b)]"
          style={{ clipPath: clip, WebkitClipPath: clip }}
        >
          {vidOk && (
            <video
              src={INTRO_FILM.src}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onError={() => setVidOk(false)}
              ref={(v) => {
                if (v) {
                  v.muted = true;
                  v.play().catch(() => {});
                }
              }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25" />
          <div className="absolute inset-0 grid place-items-center">
            <p className="font-serif text-[clamp(2.2rem,6vw,4.2rem)] tracking-[0.24em] text-[#f6dca0] drop-shadow-lg">NOOLAM</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
