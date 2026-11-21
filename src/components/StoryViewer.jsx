import { Heart, Volume2, VolumeX, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { REELS, inr } from "@/lib/data";
import { un } from "@/lib/images";
import { useStore } from "@/lib/store";
const mod = (n, m) => ((n % m) + m) % m;
const SECONDS = 7;
const SPAN = 2; // reels rendered each side of the current one
/**
 * Full-screen reel, laid out like a story: progress segments, header, the reel, details with price and
 * Add to bag. The reels sit on one continuous strip that glides on a spring: arrows, tap the sides, click a
 * neighbour, swipe/drag sideways or just scroll the wheel / trackpad. Hold to pause, Esc / swipe down to close.
 */
export default function StoryViewer({ start, onClose }) {
  const [i, setI] = useState(start);
  const [p, setP] = useState(0);
  const [held, setHeld] = useState(false);
  const [sound, setSound] = useState(false);
  const [dim, setDim] = useState({ w: 394, h: 700, wide: true });
  const { addToBag, toggleWish, isWished } = useStore();
  const touchY = useRef(null);
  const dragged = useRef(false);
  const wheelLock = useRef(false);
  const wheelTimer = useRef(null);
  const r = REELS[mod(i, REELS.length)];
  const go = useCallback((d) => {
    setI((x) => x + d);
    setP(0);
  }, []);
  useEffect(() => {
    const f = () => {
      const h = Math.min(window.innerHeight * 0.86, (window.innerWidth * 16) / 9);
      setDim({ h, w: (h * 9) / 16, wide: window.innerWidth >= 768 });
    };
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  // progress clock, paused while held
  useEffect(() => {
    if (held) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t) => {
      const dt = (t - last) / 1000;
      last = t;
      setP((v) => {
        const n = v + dt / SECONDS;
        if (n >= 1) {
          setTimeout(() => go(1), 0);
          return 0;
        }
        return n;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [held, go, i]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") go(1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onClose]);
  // wheel / trackpad: one gesture = one reel (inertia tail is swallowed until the wheel goes quiet)
  const onWheel = (e) => {
    const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (wheelTimer.current) clearTimeout(wheelTimer.current);
    wheelTimer.current = setTimeout(() => (wheelLock.current = false), 160);
    if (wheelLock.current || Math.abs(d) < 12) return;
    wheelLock.current = true;
    go(d > 0 ? 1 : -1);
  };
  useEffect(() => () => void (wheelTimer.current && clearTimeout(wheelTimer.current)), []);
  const offsets = Array.from({ length: SPAN * 2 + 1 }, (_, k) => k - SPAN);
  const gap = dim.w * 0.62 * 0.5 + dim.w * 0.5 + 28;
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${r.title} reel`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] overflow-hidden bg-[#120508]"
      style={{ perspective: 1600, overscrollBehavior: "contain" }}
      onClick={onClose}
      onWheel={onWheel}
    >
      {/* ambient glow from the current reel, cross-fading as the strip moves */}
      <AnimatePresence initial={false}>
        <motion.img
          key={r.img}
          src={un(r.img, 400)}
          alt=""
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0 h-full w-full scale-125 object-cover blur-3xl"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-black/55" />

      {offsets.map((o) => {
        const idx = i + o;
        const reel = REELS[mod(idx, REELS.length)];
        const centre = o === 0;
        const a = Math.abs(o);
        const side = Math.sign(o);
        const visible = centre || (a === 1 && dim.wide);
        return (
          <motion.div
            key={idx}
            initial={false}
            animate={{
              x: side * (a === 0 ? 0 : gap + (a - 1) * dim.w * 0.5),
              scale: centre ? 1 : 0.62,
              rotateY: -side * 14,
              opacity: visible ? (centre ? 1 : 0.7) : 0,
            }}
            transition={{ type: "spring", stiffness: 130, damping: 22, mass: 0.9 }}
            style={{
              zIndex: 10 - a,
              width: dim.w,
              height: dim.h,
              marginLeft: -dim.w / 2,
              marginTop: -dim.h / 2,
              pointerEvents: visible ? "auto" : "none",
            }}
            className="absolute left-1/2 top-1/2"
            onClick={(e) => {
              e.stopPropagation();
              if (!centre && !dragged.current) go(o);
            }}
          >
            <motion.div
              drag={centre ? "x" : false}
              dragSnapToOrigin
              dragElastic={0.35}
              dragMomentum={false}
              onDragStart={() => (dragged.current = true)}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > dim.w * 0.18 || Math.abs(info.velocity.x) > 500) go(info.offset.x < 0 ? 1 : -1);
                setTimeout(() => (dragged.current = false), 60);
              }}
              onPointerDown={() => centre && setHeld(true)}
              onPointerUp={() => setHeld(false)}
              onPointerLeave={() => setHeld(false)}
              onTouchStart={(e) => (touchY.current = e.touches[0].clientY)}
              onTouchEnd={(e) => {
                if (centre && touchY.current !== null && e.changedTouches[0].clientY - touchY.current > 90) onClose();
                touchY.current = null;
              }}
              className="relative h-full w-full touch-pan-y overflow-hidden rounded-[22px] bg-black shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)]"
            >
              <motion.img
                src={un(reel.img, 1100)}
                alt={centre ? `${reel.title}, ${reel.fabric}` : ""}
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: reel.pos }}
                initial={false}
                animate={{ scale: centre ? 1.12 : 1.02 }}
                transition={centre ? { duration: SECONDS + 1, ease: "linear" } : { duration: 0.6 }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent via-35% to-black/90" />

              {/* neighbour label */}
              {!centre && (
                <span className="absolute inset-x-0 bottom-6 px-3 text-center text-[clamp(14px,2.2vh,20px)] font-medium text-white">
                  {reel.title}
                </span>
              )}

              {/* story chrome: only the current reel carries it */}
              <motion.div
                initial={false}
                animate={{ opacity: centre ? 1 : 0 }}
                transition={{ duration: 0.35 }}
                className={centre ? "" : "pointer-events-none"}
              >
                {/* tap zones */}
                <button
                  aria-label="Previous reel"
                  tabIndex={centre ? 0 : -1}
                  onClick={() => !dragged.current && go(-1)}
                  className="absolute inset-y-24 left-0 z-10 w-1/3 cursor-w-resize"
                />
                <button
                  aria-label="Next reel"
                  tabIndex={centre ? 0 : -1}
                  onClick={() => !dragged.current && go(1)}
                  className="absolute inset-y-24 right-0 z-10 w-1/3 cursor-e-resize"
                />

                {/* progress segments */}
                <div className="absolute inset-x-3 top-3 z-20 flex gap-1.5">
                  {REELS.map((_, n) => {
                    const cur = mod(i, REELS.length);
                    return (
                      <div key={n} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                        <div className="h-full bg-white" style={{ width: n < cur ? "100%" : n === cur ? `${p * 100}%` : "0%" }} />
                      </div>
                    );
                  })}
                </div>

                {/* header */}
                <div className="absolute inset-x-4 top-7 z-20 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-gold font-bold text-maroon-deep">N</span>
                    <div className="leading-tight">
                      <p className="text-[13px] font-semibold">noolam</p>
                      <p className="text-[11px] text-white/75">{reel.place}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSound((s) => !s)}
                      aria-label={sound ? "Mute" : "Unmute"}
                      aria-pressed={sound}
                      tabIndex={centre ? 0 : -1}
                      className="relative z-30 grid h-9 w-9 place-items-center rounded-full hover:bg-white/15"
                    >
                      {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
                    </button>
                    <button
                      onClick={onClose}
                      aria-label="Close reel"
                      tabIndex={centre ? 0 : -1}
                      className="relative z-30 grid h-9 w-9 place-items-center rounded-full hover:bg-white/15"
                    >
                      <X size={19} />
                    </button>
                  </div>
                </div>

                {/* details */}
                <div className="absolute inset-x-5 bottom-14 z-20 text-white">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-gold-soft">{reel.fabric}</p>
                  <h3 className="mt-1.5 text-[clamp(1.6rem,3.4vh,2.1rem)] font-semibold leading-tight">{reel.title}</h3>
                  <p className="mt-1.5 max-w-[26ch] text-[13px] leading-snug text-white/80">{reel.note}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-[20px] font-bold">{inr(reel.price)}</span>
                    <button
                      onClick={() => addToBag(`reel-${reel.n}`, reel.title)}
                      tabIndex={centre ? 0 : -1}
                      className="relative z-30 rounded-full bg-maroon px-5 py-2.5 text-[12px] font-bold text-white shadow-[0_0_0_2px_rgba(212,162,76,0.55)] transition hover:bg-maroon-ink active:scale-95"
                    >
                      Add to bag
                    </button>
                    <button
                      onClick={() => toggleWish(`reel-${reel.n}`)}
                      aria-pressed={isWished(`reel-${reel.n}`)}
                      aria-label="Wishlist"
                      tabIndex={centre ? 0 : -1}
                      className="relative z-30 grid h-10 w-10 place-items-center rounded-full border border-white/35 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                    >
                      <Heart size={16} fill={isWished(`reel-${reel.n}`) ? "currentColor" : "none"} />
                    </button>
                    <a
                      href="#the-rack"
                      onClick={onClose}
                      tabIndex={centre ? 0 : -1}
                      className="relative z-30 ml-auto text-[12px] font-medium underline underline-offset-4 text-white/85"
                    >
                      More drapes
                    </a>
                  </div>
                </div>
                <p className="absolute inset-x-0 bottom-4 z-20 text-center text-[10.5px] text-white/55">
                  Scroll or swipe to move · hold to pause · swipe down to close
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
