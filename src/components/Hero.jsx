import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
/**
 * Cinematic hero, one continuous film in two parts.
 *
 *  1. INTRO: "Saree_boutique 1.mp4" plays by itself the moment the site opens (a plain video, not scroll-driven).
 *     The page is locked while it plays; about 2.4 s before it ends the navbar, ticker and title slide in, and when
 *     it ends scrolling is released. The video's last frame is the first frame of the scroll part (a canvas that
 *     takes over underneath, so the handoff is invisible).
 *  2. SCROLL: clips 2 and 3 are played by the scroll bar. public/hero holds the three clips joined end to start
 *     (f001…f366.jpg: every second frame, plus 3 cross-blended frames at each join). Only f001 (video poster) and
 *     f119 onwards are used; the frames before f119 are the intro, which is the video.
 *     The page pins for ~6 screens while the camera walks the showroom and settles on the two women.
 *
 * Frames are drawn to a canvas, eased and cross-faded between neighbours, so scrolling is smooth in both
 * directions. No overlay on the film.
 */
const N = 366;
const frameUrl = (i) => `/hero/f${String(i + 1).padStart(3, "0")}.jpg`;
const INTRO_VIDEO = "/Saree_boutique%201.mp4";
/** the scroll part starts on the last frame of clip 1 (index 119), which is where the intro video ends */
const SCROLL_START = 119;
/** first frame of clip 3 inside the joined sequence */
const CLIP3_START = 246;
/** the navbar / ticker / title arrive this many seconds before the intro video ends */
const UI_BEFORE_END = 2.4;
/** scroll progress at which the film reaches its last frame; the rest of the pin holds on it */
const FILM_END = 0.92;
const ease = [0.22, 1, 0.36, 1];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
/** frame load order for the scroll part: where the intro ends, the last frame, then ever finer strides */
function loadOrder(lite) {
  const seen = new Set();
  const out = [];
  const add = (i) => {
    if (i >= SCROLL_START && i < N && !seen.has(i)) {
      seen.add(i);
      out.push(i);
    }
  };
  add(SCROLL_START);
  add(N - 1);
  for (const s of lite ? [24, 8, 4, 2] : [24, 8, 4, 2, 1]) for (let i = SCROLL_START; i < N; i += s) add(i);
  return out;
}
/** where the camera looks horizontally on a tall (phone) screen: centre, then the red saree, then the green one */
function focalX(p) {
  if (p < 0.78) return 0.5;
  if (p < 0.84) return lerp(0.5, 0.2, (p - 0.78) / 0.06);
  return lerp(0.2, 0.87, clamp((p - 0.84) / 0.06));
}
/** opacity / lift / blur for a scene that fades in over [a,b] and out over [c,d] (function transforms: any range, main thread) */
function useScene(p, a, b, c, d) {
  const k = (v) => (v < b ? clamp((v - a) / (b - a)) : v > c ? clamp(1 - (v - c) / (d - c)) : 1);
  const opacity = useTransform(p, (v) => k(v));
  const y = useTransform(p, (v) => (v < b ? 1 - k(v) : v > c ? -(1 - k(v)) : 0) * 36);
  const filter = useTransform(p, (v) => `blur(${((1 - k(v)) * 10).toFixed(1)}px)`);
  const pointerEvents = useTransform(p, (v) => (k(v) > 0.4 ? "auto" : "none"));
  return { opacity, y, filter, pointerEvents };
}
const CHAPTERS = ["The Showroom", "The Drape"];
const frameAt = (p) => SCROLL_START + clamp(p / FILM_END) * (N - 1 - SCROLL_START);
const chapterAt = (p) => (frameAt(p) >= CLIP3_START ? 1 : 0);
export default function Hero() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const skipRef = useRef(() => {});
  const [reduced, setReduced] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [ui, setUi] = useState(false); // navbar / title / rail have arrived
  const [playing, setPlaying] = useState(true); // the intro video is on screen
  const { scrollYProgress: p } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  useMotionValueEvent(p, "change", (v) => setChapter((c) => (chapterAt(v) === c ? c : chapterAt(v))));
  // text scenes, timed against the scroll part of the film (clip 2, then clip 3)
  const s0 = useScene(p, -1, 0, 0.03, 0.09);
  const sA = useScene(p, 0.12, 0.17, 0.24, 0.29);
  const sB = useScene(p, 0.3, 0.35, 0.4, 0.45);
  const sC = useScene(p, 0.64, 0.69, 0.75, 0.79);
  const s5 = useScene(p, 0.84, 0.9, 3, 4);
  const cue = useTransform(p, (v) => clamp(1 - v / 0.03));
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  // ---- intro video + frame player -----------------------------------------------------------------------
  useEffect(() => {
    const cv = canvasRef.current;
    const sec = sectionRef.current;
    if (!cv || !sec) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const root = document.documentElement;
    const video = videoRef.current;
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // no intro for reduced motion, or when the page opens already scrolled / on a #hash link
    const skipIntro = rm || window.scrollY > 40 || window.location.hash.length > 1;
    const imgs = new Array(N).fill(null);
    let cw = 0;
    let ch = 0;
    let target = 0; // frame the scroll position asks for
    let cur = 0; // frame currently shown
    let prog = 0;
    let dirty = true;
    let inView = true;
    let alive = true;
    let raf = 0;
    let phase = skipIntro ? "scroll" : "play";
    let uiShown = skipIntro;
    let started = false;
    const t0 = performance.now();
    const setFromProgress = (v) => {
      prog = v;
      target = frameAt(v);
    };
    setFromProgress(rm ? 0.88 : p.get());
    cur = target;
    const reveal = () => {
      if (uiShown) return;
      uiShown = true;
      root.dataset.intro = "ready"; // navbar + ticker slide in
      setUi(true);
    };
    const finishIntro = () => {
      if (phase !== "play") return;
      // hand over to the canvas only once the frame the video ends on is ready underneath it
      if (!imgs[SCROLL_START]) {
        setTimeout(finishIntro, 80);
        return;
      }
      phase = "scroll";
      video?.pause();
      root.style.overflow = "";
      reveal();
      setPlaying(false); // the video fades out over the canvas
      setFromProgress(p.get());
      cur = target;
      dirty = true;
    };
    if (skipIntro) {
      root.dataset.intro = "ready";
      setUi(true);
      setPlaying(false);
      video?.pause();
    } else {
      window.scrollTo(0, 0);
      root.style.overflow = "hidden"; // no scrolling while the film plays
      root.dataset.intro = "playing";
      skipRef.current = finishIntro;
      if (video) {
        video.muted = true;
        video.defaultMuted = true;
        video.play().catch(() => finishIntro()); // autoplay refused: go straight to the page
      }
    }
    const onEnded = () => finishIntro();
    const onError = () => finishIntro();
    video?.addEventListener("ended", onEnded);
    video?.addEventListener("error", onError);
    const nearest = (i) => {
      for (let d = 0; d < N; d++) {
        const a = imgs[i - d];
        if (a) return a;
        const b = imgs[i + d];
        if (b) return b;
      }
      return null;
    };
    const cover = (img, alpha) => {
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      // tall screens only see a slice of the 16:9 film: pan it to follow the action
      const tall = clamp((1.6 - cw / ch) / 0.8);
      const fx = lerp(0.5, focalX(prog), tall);
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, -(dw - cw) * fx, (ch - dh) / 2, dw, dh);
    };
    const draw = () => {
      if (!cw || !ch) return;
      const a = Math.floor(cur);
      const b = Math.min(a + 1, N - 1);
      const t = cur - a;
      const A = imgs[a];
      const B = imgs[b];
      if (A && B && t > 0.02 && a !== b) {
        cover(A, 1);
        cover(B, t);
      } else {
        const one = nearest(Math.round(cur));
        if (one) cover(one, 1);
      }
      ctx.globalAlpha = 1;
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      cw = Math.round(Math.min(w * dpr, 1920));
      ch = Math.round((cw / w) * h);
      cv.width = cw;
      cv.height = ch;
      dirty = true;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    resize();
    const io = new IntersectionObserver(([e]) => (inView = e.isIntersecting), { rootMargin: "100px" });
    io.observe(sec);
    const unsub = rm ? () => {} : p.on("change", setFromProgress);
    const tick = (now) => {
      if (!alive) return;
      if (phase === "play" && video) {
        if (!started) {
          if (video.currentTime > 0) started = true;
          else if (now - t0 > 7000) finishIntro(); // the video never started: do not hold the page hostage
        }
        if (!uiShown && video.duration && video.duration - video.currentTime <= UI_BEFORE_END) reveal();
      }
      if (inView) {
        const diff = target - cur;
        if (Math.abs(diff) > 0.004 || dirty) {
          cur = Math.abs(diff) < 0.02 ? target : cur + diff * 0.14;
          draw();
          dirty = false;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // stream the scroll-part frames in while the intro plays
    const conn = navigator.connection;
    const lite = !!conn && (!!conn.saveData || /(^|-)[23]g$/.test(conn.effectiveType ?? ""));
    const queue = rm ? [SCROLL_START, Math.round(frameAt(0.88))] : loadOrder(lite);
    const worker = async () => {
      while (alive && queue.length) {
        const i = queue.shift();
        const img = new Image();
        img.decoding = "async";
        img.src = frameUrl(i);
        try {
          await img.decode();
        } catch {
          continue;
        }
        imgs[i] = img;
        dirty = true;
      }
    };
    for (let k = 0; k < 6; k++) void worker();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      unsub();
      video?.removeEventListener("ended", onEnded);
      video?.removeEventListener("error", onError);
      root.style.overflow = "";
    };
  }, [p]);
  const first = reduced ? frameUrl(Math.round(frameAt(0.88))) : frameUrl(0);
  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative bg-maroon-deep"
      style={{ height: reduced ? "100svh" : "620svh" }}
      aria-label="NOOLAM: a walk through the showroom"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden [text-shadow:0_2px_20px_rgba(0,0,0,0.6),0_1px_3px_rgba(0,0,0,0.45)]">
        {/* first frame paints instantly; the canvas (scroll part) sits under the intro video */}
        <img src={first} alt="" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="A Kanchipuram silk saree showroom: red zari silk, hanging drapes, mannequins and two women seated in front of a golden Ganesha panel"
        />

        {/* the opening film: a plain video that plays once, then fades out over the canvas */}
        <AnimatePresence>
          {playing && (
            <motion.video
              key="intro-video"
              ref={videoRef}
              src={INTRO_VIDEO}
              poster={frameUrl(0)}
              autoPlay
              muted
              playsInline
              preload="auto"
              disablePictureInPicture
              aria-hidden
              initial={false}
              exit={{ opacity: 0, transition: { duration: 0.7, ease: "easeInOut" } }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </AnimatePresence>

        {/* ── the title: arrives at the end of the opening film, then leaves as you start to scroll ── */}
        <motion.div style={reduced ? undefined : s0} className="absolute inset-0 flex flex-col justify-end">
          <div className="mx-auto w-full max-w-[1560px] px-6 pb-32 pt-40 sm:px-8">
            <motion.div
              initial={false}
              animate={ui ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.7, delay: 0.1, ease }}
              className="inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-black/35 px-3.5 py-1.5 font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-md"
              style={{ fontSize: 10.5 }}
            >
              <span className="h-2 w-2 rounded-full bg-gold" />
              Kanchipuram · Pure Zari · Handwoven Silk
            </motion.div>

            <motion.h1
              initial={false}
              animate={ui ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
              transition={{ duration: 0.9, delay: 0.2, ease }}
              className="mt-4 font-bold leading-[0.98] tracking-[-0.045em] text-white sm:whitespace-nowrap"
              style={{ fontSize: "clamp(2rem,4.8vw,4.4rem)" }}
            >
              Woven for the Divine.
            </motion.h1>

            <motion.p
              initial={false}
              animate={ui ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.35, ease }}
              className="mt-4 max-w-[30rem] font-medium leading-relaxed text-white/95"
              style={{ fontSize: "clamp(0.82rem,1vw,0.95rem)" }}
            >
              NOOLAM brings the temple looms of Kanchipuram home: Kanjivaram silk in heritage colours, bordered in real zari and finished by
              hand.
            </motion.p>

            <motion.div
              initial={false}
              animate={ui ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.5, ease }}
              className="mt-6 flex flex-wrap gap-3"
              style={{ pointerEvents: ui ? undefined : "none" }}
            >
              <a href="#try-the-look" className="btn-maroon" style={{ fontSize: 14, gap: 12, padding: "5px 5px 5px 20px" }}>
                Try the Look
                <span className="btn-icon bg-white text-maroon" style={{ width: 34, height: 34 }}>
                  <ArrowUpRight size={16} />
                </span>
              </a>
              <a href="#the-rack" className="btn-white" style={{ fontSize: 14, gap: 12, padding: "5px 5px 5px 20px" }}>
                Browse the Rack
                <span className="btn-icon bg-[#fbeee6] text-maroon" style={{ width: 34, height: 34 }}>
                  <ArrowUpRight size={16} />
                </span>
              </a>
            </motion.div>
          </div>
        </motion.div>

        {/* skip the opening film */}
        <AnimatePresence>
          {playing && !reduced && (
            <motion.button
              key="skip"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { delay: 0, duration: 0.3 } }}
              transition={{ delay: 1.2, duration: 0.5 }}
              onClick={() => skipRef.current()}
              className="absolute bottom-16 right-6 z-10 rounded-full border border-white/30 bg-black/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-md transition hover:bg-black/50 sm:right-8"
            >
              Skip intro ›
            </motion.button>
          )}
        </AnimatePresence>

        {!reduced && (
          <>
            {/* ── captions that ride the camera through the scroll part ── */}
            <Caption
              scene={sA}
              n="01"
              kicker="The showroom"
              title="Every wall, a different weave."
              body="Pure zari borders, temple motifs and heritage colours, folded in rows and hung by hand."
            />
            <Caption
              scene={sB}
              n="01"
              kicker="The showroom"
              title="Walk in, take your time."
              body="Mannequins in Kanjivaram, silks on every rail, a lamp-lit room that has no hurry in it."
            />
            <Caption
              scene={sC}
              n="02"
              kicker="The drape"
              title="Made to be worn, not kept."
              body="A bridal red and a temple green, finished by hand and worn for a lifetime."
            />

            {/* ── the invitation ── */}
            <motion.div style={s5} className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-24 text-center sm:pb-20">
              <p className="eyebrow !text-gold-soft" style={{ fontSize: 11 }}>
                Come in
              </p>
              <h2 className="mt-2 font-bold leading-[1] tracking-[-0.04em] text-white" style={{ fontSize: "clamp(1.6rem,3.6vw,3rem)" }}>
                Drape yourself in it.
              </h2>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <a href="#try-the-look" className="btn-maroon" style={{ fontSize: 14, gap: 12, padding: "5px 5px 5px 20px" }}>
                  Try the Look
                  <span className="btn-icon bg-white text-maroon" style={{ width: 34, height: 34 }}>
                    <ArrowUpRight size={16} />
                  </span>
                </a>
                <a href="#the-rack" className="btn-white" style={{ fontSize: 14, gap: 12, padding: "5px 5px 5px 20px" }}>
                  Browse the Rack
                  <span className="btn-icon bg-[#fbeee6] text-maroon" style={{ width: 34, height: 34 }}>
                    <ArrowUpRight size={16} />
                  </span>
                </a>
              </div>
            </motion.div>

            {/* scroll cue: appears once the intro has finished */}
            <motion.div
              initial={false}
              animate={{ opacity: ui && !playing ? 1 : 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pointer-events-none absolute inset-x-0 bottom-20 hidden sm:block"
            >
              <motion.div
                style={{ opacity: cue }}
                className="flex flex-col items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.4em] text-white/80"
              >
                Scroll to walk in
                <span className="relative h-10 w-px overflow-hidden bg-white/25">
                  <motion.span
                    className="absolute inset-x-0 top-0 h-4 bg-gold"
                    animate={{ y: [-16, 40] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  />
                </span>
              </motion.div>
            </motion.div>

            {/* chapter rail for the scroll part: the gold line is the film, the dot is the join between clips */}
            <motion.div
              initial={false}
              animate={{ opacity: ui && !playing ? 1 : 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pointer-events-none absolute right-5 top-1/2 hidden -translate-y-1/2 items-center gap-4 md:flex"
              aria-hidden
            >
              <div className="text-right text-[10px] font-semibold uppercase tracking-[0.3em] text-white/80">
                <span className="text-gold-soft">0{chapter + 1}</span> / 02
                <p className="mt-1 text-white/55">{CHAPTERS[chapter]}</p>
              </div>
              <div className="relative h-28 w-px bg-white/25">
                <motion.span style={{ scaleY: p }} className="absolute inset-0 origin-top bg-gold" />
                <span
                  className="absolute -left-[2px] h-[5px] w-[5px] rounded-full bg-white/70"
                  style={{ top: `${((CLIP3_START - SCROLL_START) / (N - 1 - SCROLL_START)) * FILM_END * 100}%` }}
                />
              </div>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}
function Caption({ scene, n, kicker, title, body }) {
  return (
    <motion.div style={{ ...scene, pointerEvents: "none" }} className="absolute inset-x-0 bottom-0 flex flex-col justify-end">
      <div className="mx-auto w-full max-w-[1560px] px-6 pb-28 sm:px-8 sm:pb-32">
        <p className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.26em] text-gold-soft">
          <span className="h-px w-10 bg-gold-soft" />
          {n} · {kicker}
        </p>
        <h2 className="mt-4 max-w-[16ch] text-[clamp(2.2rem,5.6vw,5rem)] font-bold leading-[1] tracking-[-0.04em] text-white">{title}</h2>
        <p className="mt-4 max-w-[30rem] text-[clamp(0.95rem,1.35vw,1.1rem)] font-medium leading-relaxed text-white/90">{body}</p>
      </div>
    </motion.div>
  );
}
