import { motion } from "framer-motion";
import { MOODS } from "@/lib/data";
/**
 * The mood photo sits inside the gold arch frame (public/arch-ogee-frame.png). The photo is masked to the frame's inner
 * shape (public/arch-ogee-mask.png, same 700 × 1280 box) and the frame is laid over it so the gold edge covers the seam.
 */
function Arch({ src, alt }) {
  const mask = {
    WebkitMaskImage: "url(/arch-ogee-mask.png)",
    maskImage: "url(/arch-ogee-mask.png)",
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
  };
  return (
    <div className="relative w-full" style={{ aspectRatio: "700 / 1280" }}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[6%] bottom-0 h-[8%] rounded-[50%] bg-[rgba(110,60,60,0.3)] blur-xl"
      />
      <div className="absolute inset-0" style={mask}>
        <img
          src={src}
          alt={alt}
          className="h-full w-full transform-gpu object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:scale-[1.06] motion-reduce:transition-none"
        />
      </div>
      <img
        src="/arch-ogee-frame.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{
          filter:
            "drop-shadow(0.7px 0 0 #b98a2e) drop-shadow(-0.7px 0 0 #b98a2e) drop-shadow(0 0.7px 0 #b98a2e) drop-shadow(0 -0.7px 0 #b98a2e)",
        }}
      />
    </div>
  );
}
export default function SixMoods() {
  return (
    <section id="six-moods" className="bg-white px-6 sm:px-10" style={{ paddingTop: 48, paddingBottom: 48 }}>
      <div className="mx-auto max-w-[1800px]">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <span className="eyebrow">The NOOLAM Archive</span>
            <h2 className="section-title mt-4">
              Six Moods. <span className="gradient-text">Timeless Drapes</span>
            </h2>
          </div>
          <p className="max-w-[22rem] text-[17px] leading-relaxed text-neutral-500 lg:text-right">
            Woven by hand, worn for a lifetime. Six silk stories, from quiet mornings to festive evenings.
          </p>
        </div>

        <ul className="mx-auto mt-14 grid max-w-[1440px] grid-cols-2 gap-x-6 gap-y-14 sm:grid-cols-3 lg:grid-cols-6">
          {MOODS.map((m, i) => (
            <motion.li
              key={m.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group flex flex-col items-center"
            >
              <div className="w-full max-w-[210px]">
                <Arch src={m.img} alt={`${m.name}: model draped in NOOLAM silk`} />
              </div>
              <p className="mt-6 max-w-[9rem] text-center text-[11px] font-semibold uppercase leading-[1.35] tracking-[0.22em] text-ink">
                {m.name}
              </p>
              {/* revealed under the image on hover; space is reserved so nothing shifts */}
              <div className="mood-note mt-2 flex h-10 flex-col items-center text-center opacity-0 translate-y-2 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none">
                <span className="max-w-[10rem] text-[12px] leading-snug text-neutral-500">{m.note}</span>
                <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a97c2e]">Explore &rarr;</span>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
