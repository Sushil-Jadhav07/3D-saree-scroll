import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { REELS } from "@/lib/data";
import { un } from "@/lib/images";
import StoryViewer from "./StoryViewer";
const SPAN = 6; // visible cards each side of centre
const mod = (n, m) => ((n % m) + m) % m;
export default function MuseReels() {
  const [c, setC] = useState(3); // Reel 04 opens in the centre
  const [playing, setPlaying] = useState(true);
  const [full, setFull] = useState(null);
  const [progress, setProgress] = useState(0);
  // autoplay: advance every ~4.5s, with a gold progress bar on the centre card
  useEffect(() => {
    if (!playing || full !== null) return;
    setProgress(0);
    const t0 = performance.now();
    let raf = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / 4500);
      setProgress(p);
      if (p >= 1) setC((x) => x + 1);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [c, playing, full]);
  const offsets = Array.from({ length: SPAN * 2 + 1 }, (_, k) => k - SPAN);
  return (
    <section id="the-reels" className="overflow-hidden bg-white" style={{ paddingTop: 48, paddingBottom: 64 }}>
      <div className="mx-auto flex max-w-[1800px] flex-col justify-between gap-6 px-6 sm:px-10 lg:flex-row lg:items-start">
        <div>
          <span className="eyebrow">The Muse Reels</span>
          <h2 className="section-title mt-4">
            Silk, <span className="gradient-text">in motion.</span>
          </h2>
        </div>
        <div className="flex flex-col items-start gap-5 lg:items-end">
          <p className="max-w-[28rem] text-[17px] leading-relaxed text-neutral-500 lg:text-right">
            Five drapes filmed the way they are lived in — hotel lobbies, old market lanes, a courtyard in the morning. Tap the centre reel
            to open it full screen.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setC((x) => x - 1)}
              aria-label="Previous reel"
              className="grid h-12 w-12 place-items-center rounded-full border border-neutral-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause autoplay" : "Play autoplay"}
              className="grid h-14 w-14 place-items-center rounded-full bg-ink text-white shadow-md transition hover:scale-105"
            >
              {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>
            <button
              onClick={() => setC((x) => x + 1)}
              aria-label="Next reel"
              className="grid h-12 w-12 place-items-center rounded-full border border-neutral-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div
        className="relative mt-10 h-[520px]"
        style={{ perspective: 1400 }}
        role="group"
        aria-roledescription="carousel"
        aria-label="Muse reels"
      >
        {offsets.map((o) => {
          const idx = c + o;
          const r = REELS[mod(idx, REELS.length)];
          const a = Math.abs(o);
          const sign = Math.sign(o);
          const x = sign * (a === 0 ? 0 : 218 + (a - 1) * 150 - (a > 1 ? (a - 1) * 14 : 0));
          const centre = o === 0;
          return (
            <motion.div
              key={idx}
              initial={false}
              animate={{
                x,
                y: a * a * 4 + a * 14,
                scale: centre ? 1 : Math.max(0.42, 0.86 - (a - 1) * 0.1),
                rotateY: -sign * Math.min(a, 3) * 11,
                rotateZ: sign * a * 1.6,
                opacity: a > 5 ? 0 : 1,
              }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              style={{ zIndex: 20 - a, transformStyle: "preserve-3d" }}
              className="absolute left-1/2 top-4 -ml-[120px] h-[430px] w-[240px]"
            >
              <button
                onClick={() => (centre ? setFull(mod(idx, REELS.length)) : setC(idx))}
                aria-label={centre ? `Watch ${r.title} full screen` : `Bring ${r.title} to the centre`}
                className="group relative block h-full w-full overflow-hidden rounded-[22px] bg-maroon-deep text-left shadow-[0_28px_40px_-22px_rgba(40,10,10,0.7)]"
              >
                <img
                  src={un(r.img, 520)}
                  alt=""
                  draggable={false}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: r.pos }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/85" />
                <div className="absolute inset-x-4 top-4 flex items-center justify-between text-[11px] font-semibold text-white">
                  <span className="flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 backdrop-blur">
                    <span className={`h-1.5 w-1.5 rounded-full ${centre ? "bg-red-500" : "bg-gold"}`} />
                    REEL {String(r.n).padStart(2, "0")}
                  </span>
                  <span className="rounded-full bg-black/45 px-2.5 py-1 backdrop-blur">{r.dur}</span>
                </div>
                {centre && (
                  <span className="absolute left-1/2 top-[45%] grid h-[58px] w-[58px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-lg transition group-hover:scale-110">
                    <Play size={20} fill="currentColor" className="ml-0.5" />
                  </span>
                )}
                <div className="absolute inset-x-4 bottom-4 text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-soft">{r.fabric}</p>
                  <p className="mt-1 text-[24px] font-semibold leading-[1.05]">{r.title}</p>
                  <p className="mt-1 text-[12.5px] text-white/75">{r.place}</p>
                  {centre && (
                    <div className="mt-3 h-[3px] rounded-full bg-white/25">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${progress * 100}%` }} />
                    </div>
                  )}
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>{full !== null && <StoryViewer start={full} onClose={() => setFull(null)} />}</AnimatePresence>
    </section>
  );
}
