import { ArrowLeft, ArrowRight, Heart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { BRIDAL, inr } from "@/lib/data";
import { un } from "@/lib/images";
import { useStore } from "@/lib/store";
const mod = (n, m) => ((n % m) + m) % m;
const ARCH = "50% 50% 4px 4px / 34% 34% 4px 4px";
export default function Bridal() {
  const [c, setC] = useState(3);
  const cur = BRIDAL[mod(c, BRIDAL.length)];
  const { addToBag, toggleWish, isWished } = useStore();
  const down = useRef(null);
  return (
    <section id="bridal" className="overflow-hidden bg-white" style={{ paddingTop: 48, paddingBottom: 64 }}>
      <div className="text-center">
        <span className="eyebrow justify-center">For the muhurtham and every vow after</span>
        <h2 className="section-title mt-4">
          The Bridal <span className="gradient-text">Collection</span>
        </h2>
      </div>

      <div
        className="relative mx-auto mt-10 h-[480px] max-w-[1500px] cursor-grab touch-pan-y select-none active:cursor-grabbing"
        role="group"
        aria-roledescription="carousel"
        aria-label="Bridal sarees"
        onPointerDown={(e) => (down.current = e.clientX)}
        onPointerUp={(e) => {
          if (down.current === null) return;
          const dx = e.clientX - down.current;
          if (Math.abs(dx) > 60) setC((x) => x + (dx < 0 ? 1 : -1));
          down.current = null;
        }}
      >
        {[-3, -2, -1, 0, 1, 2, 3].map((o) => {
          const idx = c + o;
          const b = BRIDAL[mod(idx, BRIDAL.length)];
          const a = Math.abs(o);
          const centre = o === 0;
          return (
            <motion.button
              key={idx}
              type="button"
              initial={false}
              onClick={() => !centre && setC(idx)}
              aria-label={centre ? b.name : `Show ${b.name}`}
              animate={{
                x: o * 235 - (a > 1 ? Math.sign(o) * (a - 1) * 30 : 0),
                y: a * a * 14 + a * 18,
                rotate: o * 9,
                scale: centre ? 1 : 0.86 - (a - 1) * 0.05,
                opacity: centre ? 1 : 0.9 - a * 0.2,
              }}
              transition={{ type: "spring", stiffness: 130, damping: 20 }}
              style={{ zIndex: 10 - a, transformOrigin: "50% 100%" }}
              className="absolute bottom-0 left-1/2 -ml-[160px] h-[430px] w-[320px]"
            >
              <div
                className={`relative h-full w-full overflow-hidden bg-neutral-200 ${centre ? "shadow-[0_40px_60px_-30px_rgba(120,70,20,0.55)] ring-2 ring-gold" : "shadow-[0_26px_40px_-26px_rgba(60,30,20,0.5)]"}`}
                style={{ borderRadius: ARCH }}
              >
                <img
                  src={un(b.img, 760)}
                  alt={`${b.name} bridal saree`}
                  draggable={false}
                  loading="lazy"
                  className="h-full w-full object-cover object-top"
                />
                {!centre && <div className="absolute inset-0 bg-white/20" />}
                {b.tag && (
                  <span className="absolute right-[14%] top-[26%] rounded-sm bg-maroon px-2 py-1 text-[11px] font-bold text-white shadow">
                    {b.tag}
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={cur.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <h3 className="text-[clamp(1.8rem,3.2vw,2.5rem)] font-semibold tracking-tight">{cur.name}</h3>
            <p className="mt-1 text-[14px] text-neutral-500">
              {cur.fabric} · {cur.note}
            </p>
            <p className="mt-2 text-[22px] font-semibold text-gold">{inr(cur.price)}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setC((x) => x - 1)}
            aria-label="Previous saree"
            className="grid h-12 w-12 place-items-center rounded-full border border-neutral-300 bg-white transition hover:bg-neutral-50"
          >
            <ArrowLeft size={20} />
          </button>
          <button onClick={() => addToBag(cur.id, cur.name)} className="btn-maroon !px-12 !py-3.5 text-[17px]">
            Add to cart
          </button>
          <button
            onClick={() => toggleWish(cur.id)}
            aria-pressed={isWished(cur.id)}
            aria-label={`Wishlist ${cur.name}`}
            className="grid h-12 w-12 place-items-center rounded-full border border-neutral-300 bg-white text-maroon transition hover:bg-neutral-50"
          >
            <Heart size={18} fill={isWished(cur.id) ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => setC((x) => x + 1)}
            aria-label="Next saree"
            className="grid h-12 w-12 place-items-center rounded-full border border-neutral-300 bg-white transition hover:bg-neutral-50"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
