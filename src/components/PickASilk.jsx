import { Check, ChevronLeft, ChevronRight, Heart, Plus } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SILKS, inr } from "@/lib/data";
import { useStore } from "@/lib/store";
const CARD_W = 290;
const CARD_H = 460;
const GAP = 16;
// ---- HOW CURVED IS THE ARC? change this one number -------------------------------------------------
// R is the radius of the circle the cards stand on (px). Bigger = flatter, smaller = more curved.
//   2000 = strong fan   3400 = gentle (current)   5000 = almost straight   9999 = flat row
const R = 3400;
// ------------------------------------------------------------------------------------------------------
const STEP = ((CARD_W + GAP) / R) * (180 / Math.PI); // degrees between neighbours: cards almost touch
// how far the third card out sits below the centre one (sets the height of the stage)
const DROP = Math.round(R * (1 - Math.cos((3 * (CARD_W + GAP)) / R)) + (CARD_W / 2) * Math.sin((3 * (CARD_W + GAP)) / R));
const SPAN = 4; // cards rendered each side of the centre (the outermost pair is invisible so they glide in and out)
const mod = (n, m) => ((n % m) + m) % m;
const r2 = (v) => Math.round(v * 100) / 100; // identical text on server and client, so hydration matches
const titleCase = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
/** shrink the whole arc on narrow screens so neighbours still peek in at the edges */
function useStageScale() {
  const [k, setK] = useState(1);
  useEffect(() => {
    const f = () => setK(Math.min(1, Math.max(0.7, window.innerWidth / 1350)));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return k;
}
function SilkCard({ silk, centre }) {
  const { addToBag, toggleWish, isWished } = useStore();
  const ref = useRef(null);
  const [added, setAdded] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  // cursor tilt on the centre card; the model drifts the other way (parallax), the title a little less
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 170, damping: 17 });
  const sy = useSpring(my, { stiffness: 170, damping: 17 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-12, 12]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [10, -10]);
  const modelX = useTransform(sx, [-0.5, 0.5], [14, -14]);
  const modelY = useTransform(sy, [-0.5, 0.5], [8, -8]);
  const titleX = useTransform(sx, [-0.5, 0.5], [-8, 8]);
  const titleY = useTransform(sy, [-0.5, 0.5], [-5, 5]);
  const longest = Math.max(...silk.title.map((t) => t.length));
  const fs = Math.max(46, Math.min(82, Math.round(250 / (longest * 0.44))));
  const wished = isWished(`silk-${silk.id}`);
  const live = centre ? "" : "pointer-events-none"; // buttons only work on the centre card; a side card just comes forward on tap
  return (
    <div style={{ perspective: 900 }} className="h-full w-full">
      <motion.div
        ref={ref}
        onPointerMove={(e) => {
          if (!centre || e.pointerType !== "mouse") return;
          const r = ref.current.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width - 0.5);
          my.set((e.clientY - r.top) / r.height - 0.5);
        }}
        onPointerLeave={() => {
          mx.set(0);
          my.set(0);
        }}
        whileHover={centre ? { scale: 1.025 } : undefined}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        style={{ rotateX, rotateY, background: silk.bg, color: silk.ink, transformStyle: "preserve-3d" }}
        className="group relative h-full w-full overflow-hidden rounded-[26px] shadow-[0_30px_46px_-26px_rgba(30,10,30,0.55)] ring-[3px] ring-white"
      >
        {/* soft light from the top corner */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_55%_at_30%_0%,rgba(255,255,255,0.22),transparent_70%)]" />

        {/* huge condensed title behind the model */}
        <motion.h3
          style={{ x: titleX, y: titleY, fontSize: fs, color: silk.ink }}
          className="pointer-events-none absolute inset-x-0 top-5 z-0 text-center font-display uppercase leading-[0.92] tracking-tight"
        >
          {silk.title[0]}
          <br />
          {silk.title[1]}
        </motion.h3>

        {/* the model: stands in front of the title, her head overlapping it */}
        <motion.div
          style={{ x: modelX, y: modelY }}
          className="pointer-events-none absolute bottom-0 left-1/2 z-10 h-[88%] w-[78%] -translate-x-1/2"
        >
          <img
            src={silk.img}
            alt={`${silk.title.join(" ")} saree on a model`}
            loading="lazy"
            draggable={false}
            className="h-full w-full object-contain object-bottom drop-shadow-[0_18px_18px_rgba(0,0,0,0.28)] transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        </motion.div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/30 to-transparent" />

        <button
          onClick={() => toggleWish(`silk-${silk.id}`)}
          aria-label={`Wishlist ${silk.title.join(" ")}`}
          aria-pressed={wished}
          tabIndex={centre ? 0 : -1}
          className={`absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-white text-maroon shadow-md transition hover:scale-110 active:scale-90 ${live}`}
        >
          <motion.span
            key={String(wished)}
            initial={{ scale: wished ? 0.4 : 1 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 12 }}
            className="grid place-items-center"
          >
            <Heart size={16} fill={wished ? "currentColor" : "none"} />
          </motion.span>
        </button>

        <p className="absolute bottom-6 left-5 z-20 text-[16px] font-bold text-white drop-shadow">{inr(silk.price)}</p>

        <motion.button
          onClick={() => {
            addToBag(`silk-${silk.id}`, titleCase(silk.title.join(" ")));
            setAdded(true);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setAdded(false), 1400);
          }}
          whileTap={{ scale: 0.88 }}
          animate={{ rotate: added ? 360 : 0, backgroundColor: added ? "#1f7a43" : "#141010" }}
          transition={{ type: "spring", stiffness: 300, damping: 16 }}
          aria-label={`Add ${silk.title.join(" ")} to bag`}
          tabIndex={centre ? 0 : -1}
          className={`absolute bottom-5 right-5 z-20 grid h-[52px] w-[52px] place-items-center rounded-full border-[3px] border-white text-white shadow-xl transition-shadow hover:shadow-2xl ${live}`}
        >
          {added ? <Check size={22} strokeWidth={2.6} /> : <Plus size={22} strokeWidth={2.4} />}
        </motion.button>

        {/* side cards sit a touch in shade */}
        <div
          className="pointer-events-none absolute inset-0 z-30 bg-black transition-opacity duration-700"
          style={{ opacity: centre ? 0 : 0.14 }}
        />
      </motion.div>
    </div>
  );
}
/**
 * Pick a Silk: twelve flat cards standing on the rim of one wide circle. Every card points away from the
 * hub, so the row bows into an arc and fans out to both sides. Turn it with the arrows, the dots, the keyboard,
 * a swipe or the trackpad; tap a side card to bring it forward; tilt, wish and add on the centre card.
 */
export default function PickASilk() {
  const [c, setC] = useState(3); // opens on Bengal Garden, dead centre
  const k = useStageScale();
  const drag = useRef(null);
  const wheel = useRef(0);
  const n = SILKS.length;
  const go = (d) => setC((x) => x + d);
  const offsets = Array.from({ length: SPAN * 2 + 1 }, (_, i) => i - SPAN);
  const current = SILKS[mod(c, n)];
  return (
    <section
      id="pick-a-silk"
      className="overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#eef4fb_45%,#f6f9fd_80%,#ffffff_100%)] "
      style={{ paddingTop: 48, paddingBottom: 48 }}
    >
      <div className="mx-auto flex max-w-[1800px] flex-col justify-between gap-3 px-6 sm:px-10 md:flex-row md:items-end">
        <div>
          <span className="eyebrow">Choose your drape</span>
          <h2 className="section-title mt-4">
            Pick a <span className="gradient-text">Silk</span>
          </h2>
          <p className="mt-3 text-[19px] text-neutral-600">Twelve silks. Find your favourite.</p>
        </div>
        <p className="max-w-[26rem] text-[16px] leading-relaxed text-neutral-500 md:text-right">
          Swipe the arc, tap a card to bring it forward, tilt it, poke the silk. Hit{" "}
          <span className="mx-0.5 inline-grid h-6 w-6 place-items-center rounded-full bg-ink align-middle text-white">
            <Plus size={14} strokeWidth={2.6} />
          </span>{" "}
          to drop a saree into your bag.
        </p>
      </div>

      {/* the arc */}
      <div
        className="relative mt-4 select-none outline-none"
        style={{ height: (CARD_H + 44 + DROP + 70) * k, touchAction: "pan-y" }}
        role="group"
        aria-roledescription="carousel"
        aria-label="Silk sarees: turn the arc"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d && !d.moved && Math.abs(e.clientX - d.x) > 10) d.moved = true;
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (d && Math.abs(e.clientX - d.x) > 60) go(e.clientX < d.x ? 1 : -1);
        }}
        onPointerLeave={() => (drag.current = null)}
        onWheel={(e) => {
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 18 && Date.now() - wheel.current > 380) {
            wheel.current = Date.now();
            go(e.deltaX > 0 ? 1 : -1);
          }
        }}
      >
        <div className="absolute left-1/2 top-0" style={{ width: 0, height: 0, transform: `scale(${k})`, transformOrigin: "50% 0" }}>
          {offsets.map((o) => {
            const idx = c + o;
            const silk = SILKS[mod(idx, n)];
            const a = Math.abs(o);
            const centre = o === 0;
            return (
              <motion.div
                key={idx}
                initial={false}
                animate={{
                  rotate: r2(o * STEP),
                  y: centre ? -8 : 0,
                  opacity: a >= SPAN ? 0 : a === SPAN - 1 ? 0.8 : 1,
                }}
                transition={{ type: "spring", stiffness: 110, damping: 20, mass: 0.95 }}
                style={{
                  zIndex: 20 - a,
                  width: CARD_W,
                  height: CARD_H,
                  left: -CARD_W / 2,
                  top: 44,
                  transformOrigin: `50% ${R}px`, // the hub of the circle, far below the card
                  pointerEvents: a >= SPAN ? "none" : "auto",
                }}
                className="absolute"
                onClickCapture={(e) => {
                  // a drag is not a tap; a side card only comes forward, it does not fire its buttons
                  if (drag.current?.moved) return;
                  if (!centre) {
                    e.stopPropagation();
                    setC(idx);
                  }
                }}
                aria-hidden={a >= SPAN || undefined}
                aria-label={centre ? `${silk.title.join(" ")}, ${inr(silk.price)}` : `Bring ${silk.title.join(" ")} to the centre`}
              >
                <SilkCard silk={silk} centre={centre} />
                {!centre && <span className="absolute inset-0 z-40 cursor-pointer rounded-[26px]" aria-hidden />}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* controls: round arrows with the dots between them */}
      <div className="relative flex flex-col items-center gap-4" style={{ marginTop: -150 * k }}>
        <div className="flex items-center gap-6">
          <button
            onClick={() => go(-1)}
            aria-label="Previous silk"
            className="grid h-12 w-12 place-items-center rounded-full border-2 border-maroon text-maroon transition hover:bg-maroon hover:text-white active:scale-95"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex gap-2" role="tablist" aria-label="Choose a silk">
            {SILKS.map((s, i) => {
              const on = mod(c, n) === i;
              return (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={on}
                  aria-label={s.title.join(" ")}
                  onClick={() => {
                    // take the shortest way round
                    let d = i - mod(c, n);
                    if (d > n / 2) d -= n;
                    if (d < -n / 2) d += n;
                    go(d);
                  }}
                  className="h-2.5 rounded-full transition-all duration-500"
                  style={{ width: on ? 26 : 10, background: on ? "#8a1c2e" : "#c9cfd8" }}
                />
              );
            })}
          </div>
          <button
            onClick={() => go(1)}
            aria-label="Next silk"
            className="grid h-12 w-12 place-items-center rounded-full border-2 border-maroon text-maroon transition hover:bg-maroon hover:text-white active:scale-95"
          >
            <ChevronRight size={22} />
          </button>
        </div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-neutral-500" aria-live="polite">
          <span className="text-ink">{String(mod(c, n) + 1).padStart(2, "0")}</span> / {String(n).padStart(2, "0")} ·{" "}
          {current.title.join(" ")}
        </p>
      </div>
    </section>
  );
}
