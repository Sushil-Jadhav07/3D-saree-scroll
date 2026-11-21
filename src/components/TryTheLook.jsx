import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Heart, Plus, ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HOT_ORDER, LOOKS, LOOK_ACCESSORIES, inr } from "@/lib/data";
import { un } from "@/lib/images";
import { useStore } from "@/lib/store";
const ease = [0.22, 1, 0.36, 1];
const mod = (n, m) => ((n % m) + m) % m;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const r2 = (v) => Math.round(v * 100) / 100; // same text on server and client, so hydration matches
const N = LOOKS.length;
const SPAN = 4; // models rendered each side of the centre (the outermost pair is invisible, so they glide in and out)
const TILT = 6; // degrees each step away from the centre turns a model inward
// opacity by distance from the centre: the outer models melt into the page
const FADE = [1, 1, 0.82, 0.42, 0];
const SPRING = { type: "spring", stiffness: 120, damping: 21, mass: 0.95 };
const BOTTOM = 30; // px of floor under the models
/** CSS background that zooms into a point of the 2:3 cut-out (for the saree / blouse thumbnails) */
function crop(look, at, zoom) {
  const px_ = ((at[0] / 100) * zoom - 0.5) / (zoom - 1);
  const py_ = ((at[1] / 100) * 1.5 * zoom - 0.5) / (1.5 * zoom - 1);
  return {
    backgroundImage: `url(${look.img})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${zoom * 100}% auto`,
    backgroundPosition: `${clamp(px_, 0, 1) * 100}% ${clamp(py_, 0, 1) * 100}%`,
  };
}
function rowsFor(look) {
  const blouseAt = [(look.hot.blouse[0] + look.hot.necklace[0]) / 2, look.hot.blouse[1]];
  return [
    {
      id: `${look.id}-saree`,
      kind: "saree",
      label: "Saree",
      name: look.saree.name,
      price: look.saree.price,
      thumb: crop(look, [look.hot.saree[0], look.hot.saree[1] + 4], 2.3),
    },
    {
      id: `${look.id}-blouse`,
      kind: "blouse",
      label: "Blouse",
      name: look.blouse.name,
      price: look.blouse.price,
      thumb: crop(look, blouseAt, 3.2),
    },
    ...LOOK_ACCESSORIES.map((a) => ({
      id: `${look.id}-${a.kind}`,
      kind: a.kind,
      label: a.label,
      name: a.name,
      price: a.price,
      thumb: { backgroundImage: `url(${un(a.img, 240)})`, backgroundSize: "cover", backgroundPosition: "center" },
    })),
  ];
}
export default function TryTheLook() {
  const [c, setC] = useState(Math.floor(N / 2)); // unbounded: the ring has no ends
  const [open, setOpen] = useState(false);
  const [hot, setHot] = useState(null);
  const look = LOOKS[mod(c, N)];
  const { addToBag, addMany, toggleWish, isWished } = useStore();
  const go = useCallback((d) => setC((x) => x + d), []);
  // ---- sizes: everything follows the width of the stage and the height of the window -------------------
  const stageRef = useRef(null);
  const [stageW, setStageW] = useState(1000);
  const [vh, setVh] = useState(900);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setStageW(Math.round(e.contentRect.width)));
    ro.observe(el);
    const onResize = () => setVh(window.innerHeight);
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);
  const mh = Math.round(clamp(stageW * 0.56, 400, 600)); // model height on the ring
  const mw = Math.round((mh * 2) / 3);
  // a wide, shallow ring: neighbours stand a little closer than one body-width apart, so nobody piles up at the sides
  const R = mw * 6.5;
  const stepRad = (mw * 0.84) / R;
  const closedH = mh + BOTTOM + 14;
  const openH = Math.round(clamp(vh - 205, 560, 790));
  const S = Math.max(1.05, (openH - BOTTOM - 62) / mh); // how much the opened model grows
  const stageH = open ? openH : closedH;
  // ---- input ---------------------------------------------------------------------------------------------
  const down = useRef(null);
  const lastWheel = useRef(0);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);
  useEffect(() => setHot(null), [c, open]);
  // The heading folds away and the stage grows when a look opens, which shifts everything below it and used to
  // drag the page down. Pin the section's top to the top of the screen so the opened look stays right where it is.
  const sectionRef = useRef(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open === wasOpen.current) return; // only on a real open / close (not on mount, not on strict-mode re-runs)
    wasOpen.current = open;
    const el = sectionRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
      return;
    }
    // Ease the page to the section's top, re-aiming every frame: the heading is still folding while we scroll, so a
    // one-shot smooth scroll gets cut short and leaves the page too far down.
    const from = window.scrollY;
    const t0 = performance.now();
    let raf = 0;
    const stop = () => cancelAnimationFrame(raf);
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / 650);
      const e = 1 - Math.pow(1 - p, 3);
      const target = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: from + (target - from) * e, behavior: "instant" });
      if (p < 1 || Math.abs(el.getBoundingClientRect().top) > 1) raf = requestAnimationFrame(tick);
      if (now - t0 > 1400) stop();
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("wheel", stop, { passive: true, once: true });
    window.addEventListener("touchstart", stop, { passive: true, once: true });
    return () => {
      stop();
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
    };
  }, [open]);
  const rows = useMemo(() => rowsFor(look), [look]);
  const total = rows.reduce((s, r) => s + r.price, 0);
  const bundle = Math.round(total * 0.9);
  const byKind = (k) => rows.find((r) => r.kind === k);
  const offsets = Array.from({ length: SPAN * 2 + 1 }, (_, k) => k - SPAN);
  return (
    <section
      ref={sectionRef}
      id="try-the-look"
      style={{ overflowAnchor: "none" }}
      className="bg-white lg:grid lg:min-h-[100svh] lg:grid-cols-[1fr_minmax(380px,440px)]"
    >
      <div className="relative overflow-hidden px-6 pb-10 pt-20 sm:px-10">
        {/* heading: folds away when a look is open */}
        <motion.div
          initial={false}
          animate={open ? { height: 0, opacity: 0 } : { height: "auto", opacity: 1 }}
          transition={{ duration: 0.55, ease }}
          style={{ overflow: "hidden" }}
          aria-hidden={open}
        >
          <span className="eyebrow">Styled head to toe</span>
          <h2 className="section-title mt-4">
            Try the <span className="gradient-text">Look.</span>
          </h2>
          <p className="mt-5 max-w-xl text-[19px] text-neutral-500">
            Sixteen looks, styled head to toe. Tap a model to open the look and see every piece.
          </p>
        </motion.div>

        {/* the stage: a ring of models; opening one grows the stage and the model */}
        <motion.div
          ref={stageRef}
          initial={false}
          animate={{ height: stageH }}
          transition={SPRING}
          style={{
            perspective: 1800,
            touchAction: "pan-y",
            // closed: both ends of the stage fade out (the right end meets the shopping list)
            ...(open
              ? {}
              : {
                  WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 13%, #000 87%, transparent 100%)",
                  maskImage: "linear-gradient(90deg, transparent 0%, #000 13%, #000 87%, transparent 100%)",
                }),
          }}
          role="group"
          aria-roledescription="carousel"
          aria-label="Sixteen styled looks"
          tabIndex={0}
          onKeyDown={(e) => {
            if (open) return;
            if (e.key === "ArrowRight") go(1);
            if (e.key === "ArrowLeft") go(-1);
          }}
          onPointerDown={(e) => {
            if (!open) down.current = { x: e.clientX, moved: false };
          }}
          onPointerMove={(e) => {
            if (down.current && Math.abs(e.clientX - down.current.x) > 8) down.current.moved = true;
          }}
          onPointerUp={(e) => {
            const d = down.current;
            if (!d) return;
            const dx = e.clientX - d.x;
            if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
            setTimeout(() => (down.current = null), 0);
          }}
          onPointerLeave={() => (down.current = null)}
          onWheel={(e) => {
            if (open) return;
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 18 && Date.now() - lastWheel.current > 380) {
              lastWheel.current = Date.now();
              go(e.deltaX > 0 ? 1 : -1);
            }
          }}
          className={`relative mt-4 select-none outline-none ${open ? "" : "cursor-grab active:cursor-grabbing"}`}
        >
          {/* open-state chrome */}
          <AnimatePresence>
            {open && (
              <>
                <motion.button
                  key="back"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.4, delay: 0.25, ease }}
                  onClick={() => setOpen(false)}
                  className="absolute left-0 top-0 z-40 flex items-center gap-2 rounded-full border border-neutral-300 bg-white/90 py-2 pl-3 pr-5 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink backdrop-blur transition hover:bg-white"
                >
                  <ArrowLeft size={16} /> All looks
                </motion.button>
                <motion.p
                  key="title"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, delay: 0.3, ease }}
                  className="absolute right-0 top-1 z-40 text-right"
                >
                  <span className="block font-serif text-[22px] italic leading-tight text-maroon-ink">{look.name}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    {String(mod(c, N) + 1).padStart(2, "0")} / {N}
                  </span>
                </motion.p>
                {["prev", "next"].map((dir) => (
                  <motion.button
                    key={dir}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    onClick={() => go(dir === "next" ? 1 : -1)}
                    aria-label={dir === "next" ? "Next look" : "Previous look"}
                    className={`absolute top-1/2 z-40 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-neutral-300 bg-white/90 text-ink backdrop-blur transition hover:bg-white active:scale-95 ${dir === "next" ? "right-0" : "left-0"}`}
                  >
                    {dir === "next" ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                  </motion.button>
                ))}
              </>
            )}
          </AnimatePresence>

          {/* the ring is anchored at the middle of the floor */}
          <div className="absolute left-1/2 w-0" style={{ bottom: BOTTOM, height: 0, transformStyle: "preserve-3d" }}>
            {offsets.map((o) => {
              const idx = c + o;
              const l = LOOKS[mod(idx, N)];
              const a = Math.abs(o);
              const th = o * stepRad;
              const centre = o === 0;
              const isOpen = open && centre;
              return (
                <motion.div
                  key={idx}
                  initial={false}
                  animate={{
                    x: r2(open ? (centre ? 0 : Math.sin(th) * R * 1.5) : Math.sin(th) * R),
                    z: r2(open ? (centre ? 0 : -200) : (Math.cos(th) - 1) * R),
                    scale: r2(isOpen ? S : 1 - Math.min(a, 3) * 0.07),
                    rotateY: r2(open ? 0 : -o * TILT),
                    opacity: open ? (centre ? 1 : 0) : FADE[Math.min(a, SPAN)],
                  }}
                  transition={SPRING}
                  style={{
                    width: mw,
                    height: mh,
                    left: -mw / 2,
                    bottom: 0,
                    zIndex: open && centre ? 40 : 20 - a,
                    transformOrigin: "50% 100%",
                    transformStyle: "preserve-3d",
                    pointerEvents: open && !centre ? "none" : "auto",
                  }}
                  className="absolute"
                >
                  {/* soft floor shadow */}
                  <span
                    className="pointer-events-none absolute -bottom-2 left-1/2 h-5 w-[70%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(60,20,20,0.38),transparent)] blur-[2px]"
                    aria-hidden
                  />
                  <button
                    type="button"
                    aria-label={isOpen ? `${l.name} (open)` : `Open ${l.name}, look ${mod(idx, N) + 1} of ${N}`}
                    tabIndex={isOpen ? -1 : 0}
                    onClick={() => {
                      if (down.current?.moved || isOpen) return;
                      setC(idx);
                      setOpen(true);
                    }}
                    className="group relative block h-full w-full outline-none"
                    style={{ cursor: isOpen ? "default" : "pointer" }}
                  >
                    <img
                      src={l.img}
                      alt={isOpen ? `${l.name}: saree, blouse and jewellery` : ""}
                      draggable={false}
                      decoding="async"
                      className={`h-full w-full object-contain drop-shadow-[0_22px_26px_rgba(70,25,25,0.22)] transition-transform duration-500 ${open ? "" : "group-hover:-translate-y-1.5"}`}
                    />
                  </button>

                  {/* numbered hotspots: only on the opened model, they pop in one by one */}
                  <AnimatePresence>
                    {isOpen &&
                      HOT_ORDER.map((k, n) => (
                        <Hotspot
                          key={`${l.id}-${k}`}
                          n={n + 1}
                          at={l.hot[k]}
                          row={byKind(k)}
                          active={hot === k}
                          inv={1 / S}
                          delay={0.55 + n * 0.09}
                          onActive={(on) => setHot(on ? k : null)}
                          onAdd={() => addToBag(byKind(k).id, byKind(k).name)}
                        />
                      ))}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* arrows, progress and caption */}
        <div className="mt-3 flex items-center gap-4">
          <button
            onClick={() => go(-1)}
            aria-label="Previous look"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-neutral-200 transition hover:bg-neutral-100 active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="font-serif text-[22px] italic leading-tight text-maroon-ink">{look.name}</p>
            <div className="mt-2 flex items-center justify-center gap-2" role="tablist" aria-label="Choose a look">
              {LOOKS.map((l, n) => {
                const on = mod(c, N) === n;
                return (
                  <button
                    key={l.id}
                    role="tab"
                    aria-selected={on}
                    aria-label={l.name}
                    onClick={() => {
                      let d = n - mod(c, N);
                      if (d > N / 2) d -= N;
                      if (d < -N / 2) d += N;
                      go(d);
                    }}
                    className="h-3 rounded-full ring-2 ring-transparent transition-all duration-300"
                    style={{
                      width: on ? 26 : 12,
                      background: l.tint,
                      opacity: on ? 1 : 0.45,
                      boxShadow: on ? `0 0 0 2px #fff, 0 0 0 3.5px ${l.tint}` : undefined,
                    }}
                  />
                );
              })}
            </div>
            <p className="mt-2 text-[12px] uppercase tracking-[0.18em] text-neutral-400">
              {String(mod(c, N) + 1).padStart(2, "0")} / {N} · {open ? "Esc to close" : "Scroll, drag or tap a model"}
            </p>
          </div>
          <button
            onClick={() => go(1)}
            aria-label="Next look"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-neutral-200 transition hover:bg-neutral-100 active:scale-95"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* In this look */}
      {/* closed: the list sits level with the models (below the heading); open: the heading folds away and the list moves up with it */}
      <aside
        className={`border-t border-neutral-200 bg-white px-6 pb-28 pt-8 transition-[padding] duration-500 ease-out sm:px-8 lg:border-l lg:border-t-0 lg:pb-24 ${open ? "lg:pt-24" : "lg:pt-[17.5rem]"}`}
        aria-label="In this look"
      >
        <h3 className="text-[15px] font-medium text-neutral-600">In this look</h3>
        <AnimatePresence mode="wait">
          <motion.ul
            key={look.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="mt-3 divide-y divide-neutral-200 border-t border-neutral-200"
          >
            {rows.map((r, n) => {
              const on = open && hot === r.kind;
              return (
                <li
                  key={r.id}
                  onMouseEnter={() => open && setHot(r.kind)}
                  onMouseLeave={() => setHot(null)}
                  // a soft pastel wash + a thin accent edge, a different tint per piece; padding is always there so nothing shifts
                  style={{
                    background: on ? PASTEL[r.kind].bg : "transparent",
                    boxShadow: on
                      ? `inset 3px 0 0 ${PASTEL[r.kind].edge}, 0 0 0 1px ${PASTEL[r.kind].edge}55`
                      : "inset 3px 0 0 transparent, 0 0 0 1px transparent",
                  }}
                  className="-mx-3 flex items-center gap-4 rounded-xl px-3 py-3.5 transition-[background,box-shadow] duration-300"
                >
                  <div
                    className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-md bg-[#efede8]"
                    style={r.thumb}
                    role="img"
                    aria-label={r.name}
                  >
                    <AnimatePresence>
                      {open && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: on ? 1.12 : 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: "spring", stiffness: 420, damping: 22, delay: on ? 0 : 0.55 + n * 0.09 }}
                          className={`absolute left-1.5 top-1.5 grid h-[22px] w-[22px] place-items-center rounded-full text-[11px] font-bold shadow ring-1 ring-black/10 ${on ? "bg-maroon text-white" : "bg-white text-ink"}`}
                        >
                          {n + 1}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-neutral-400">NOOLAM · {r.label}</p>
                    <p className="mt-0.5 text-[15px] font-medium leading-snug">{r.name}</p>
                    <p className="mt-1 text-[13px] text-neutral-600">{inr(r.price)}</p>
                  </div>
                  <button
                    onClick={() => toggleWish(r.id)}
                    aria-label={`Wishlist ${r.name}`}
                    aria-pressed={isWished(r.id)}
                    className="grid h-9 w-9 place-items-center rounded-full text-maroon transition hover:bg-maroon/10"
                  >
                    <Heart size={16} fill={isWished(r.id) ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={() => addToBag(r.id, r.name)}
                    aria-label={`Add ${r.name} to bag`}
                    className="grid h-9 w-9 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-ink"
                  >
                    <Plus size={18} />
                  </button>
                </li>
              );
            })}
          </motion.ul>
        </AnimatePresence>

        <div className="mt-6 flex items-end justify-between">
          <div>
            <p className="text-[14px] text-neutral-700">Complete the look</p>
            <p className="mt-1 text-[12px] text-neutral-400">Bundle all {rows.length} pieces · save 10%</p>
          </div>
          <p className="text-right">
            <span className="mr-2 text-[12px] text-neutral-400 line-through">{inr(total)}</span>
            <span className="text-[22px] font-semibold">{inr(bundle)}</span>
          </p>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <button
            onClick={() =>
              addMany(
                rows.map((r) => r.id),
                `${look.name} look added to bag`,
              )
            }
            className="btn-maroon flex-1 justify-between !pl-8 text-[17px]"
          >
            Add full look to bag
            <span className="btn-icon bg-white text-maroon">
              <ShoppingCart size={19} />
            </span>
          </button>
          <button
            onClick={() => toggleWish(`look-${look.id}`)}
            aria-label="Save this look"
            aria-pressed={isWished(`look-${look.id}`)}
            className="grid h-[52px] w-[52px] place-items-center rounded-full border border-neutral-300 text-maroon transition hover:bg-maroon/5"
          >
            <Heart size={20} fill={isWished(`look-${look.id}`) ? "currentColor" : "none"} />
          </button>
        </div>
      </aside>
    </section>
  );
}
/** Light pastel wash (and a slightly deeper edge) that marks the row matching the hotspot you're on. */
const PASTEL = {
  saree: { bg: "#fde6ea", edge: "#f0a9b7" }, // rose
  blouse: { bg: "#ece4fa", edge: "#bda9ea" }, // lavender
  necklace: { bg: "#fff1cf", edge: "#ecc767" }, // butter
  jhumkas: { bg: "#dff3e7", edge: "#8fd0a9" }, // mint
  bangles: { bg: "#dcecfb", edge: "#92bfe8" }, // sky
};
/** A numbered dot on the model. Hover (or focus) it and the matching row lights up on the right, and vice versa. */
function Hotspot({ n, at, row, active, inv, delay, onActive, onAdd }) {
  const right = at[0] < 52; // tooltip opens towards the empty side
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 380, damping: 20, delay }}
      onMouseEnter={() => onActive(true)}
      onMouseLeave={() => onActive(false)}
      style={{ left: `${at[0]}%`, top: `${at[1]}%`, zIndex: active ? 50 : 41 }}
      className="absolute -ml-[15px] -mt-[15px]"
    >
      {/* counter-scale so the dot keeps its size while the model is enlarged */}
      <div style={{ transform: `scale(${inv})`, transformOrigin: "50% 50%" }} className="relative">
        <button
          type="button"
          onFocus={() => onActive(true)}
          onBlur={() => onActive(false)}
          aria-label={`${n}. ${row.label}: ${row.name}, ${inr(row.price)}`}
          className={`relative grid h-[30px] w-[30px] place-items-center rounded-full text-[12px] font-bold shadow-[0_6px_16px_-4px_rgba(0,0,0,0.5)] ring-1 ring-black/10 transition-colors duration-200 ${active ? "bg-maroon text-white" : "bg-white text-ink"}`}
        >
          <span className="hot-pulse pointer-events-none absolute inset-0 rounded-full" aria-hidden />
          {n}
        </button>
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ opacity: 0, x: right ? -8 : 8, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: right ? -6 : 6, scale: 0.96 }}
              transition={{ duration: 0.22, ease }}
              style={{ transformOrigin: right ? "0 50%" : "100% 50%" }}
              className={`absolute top-1/2 z-50 w-[min(210px,48vw)] -translate-y-1/2 rounded-2xl bg-white px-4 py-3 text-left shadow-[0_18px_40px_-14px_rgba(40,10,10,0.5)] ring-1 ring-black/5 ${right ? "left-full ml-3" : "right-full mr-3"}`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                {n} · {row.label}
              </p>
              <p className="mt-0.5 text-[13.5px] font-medium leading-snug text-ink">{row.name}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-maroon">{inr(row.price)}</span>
                <button
                  onClick={onAdd}
                  className="flex items-center gap-1 rounded-full bg-maroon px-3 py-1 text-[11px] font-bold text-white transition hover:bg-maroon-ink active:scale-95"
                >
                  <Plus size={12} /> Add
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
