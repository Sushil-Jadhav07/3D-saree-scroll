import { X } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { inr } from "@/lib/data";
import { WEAVE_SILKS, silkCanvas } from "@/lib/silk";
import { useStore } from "@/lib/store";
import { WordmarkFooter } from "./ui/wordmark-footer";
const BraidCanvas = lazy(() => import("./BraidCanvas"));
/** "Three silks, one weave." — choose up to three silks, watch them braid, get 10% off the set. */
export default function Weave() {
  const { addMany } = useStore();
  const [slots, setSlots] = useState([null, null, null]);
  const [hover, setHover] = useState(null);
  const [thumbs, setThumbs] = useState({});
  // swatch images are drawn client-side from the same generator the 3D ribbons use
  useEffect(() => {
    const t = {};
    WEAVE_SILKS.forEach((s) => (t[s.id] = silkCanvas(s, 96).toDataURL()));
    setThumbs(t);
  }, []);
  const picked = slots.filter(Boolean);
  const count = picked.length;
  const silks = useMemo(() => slots.map((id) => WEAVE_SILKS.find((s) => s.id === id) ?? null), [slots]);
  const original = silks.reduce((n, s) => n + (s?.price ?? 0), 0);
  const total = Math.round(original * 0.9);
  const full = count === 3;
  const hovered = WEAVE_SILKS.find((s) => s.id === hover);
  const toggle = (id) =>
    setSlots((cur) => {
      if (cur.includes(id)) return cur.map((x) => (x === id ? null : x));
      const free = cur.indexOf(null);
      if (free === -1) return cur;
      return cur.map((x, i) => (i === free ? id : x));
    });
  return (
    <section id="the-weave" className="relative bg-white">
      {/* stage */}
      <div className="relative mx-auto h-[620px] max-w-[1800px] overflow-hidden px-6 sm:px-10 max-md:h-auto max-md:pb-12">
        <Suspense fallback={null}>
          <BraidCanvas picks={silks} />
        </Suspense>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-6 pt-20 sm:px-10 max-md:relative max-md:px-0">
          <div className="text-center">
            <span className="eyebrow justify-center">Seer Varisai · Any three silks, 10% off</span>
            <h2 className="section-title mt-4">
              Three silks, <span className="gradient-text">one weave.</span>
            </h2>
          </div>
        </div>

        {/* controls */}
        <div className="absolute inset-x-6 bottom-10 z-20 grid max-md:relative max-md:inset-x-0 max-md:bottom-auto max-md:mt-10 items-end gap-6 sm:inset-x-10 md:grid-cols-[minmax(230px,1fr)_minmax(0,2fr)_minmax(200px,1fr)]">
          <ol className="space-y-1.5 text-[13px]" aria-label="Your three silks">
            {slots.map((id, i) => {
              const s = WEAVE_SILKS.find((x) => x.id === id);
              return (
                <li key={i} className="flex items-center gap-3 border-b border-neutral-200/80 py-2">
                  <span className="w-3 text-[11px] text-neutral-400">{i + 1}</span>
                  {s ? (
                    <>
                      <span
                        className="h-4 w-4 shrink-0 rounded-sm ring-1 ring-black/10"
                        style={{ backgroundImage: `url(${thumbs[s.id]})`, backgroundSize: "cover" }}
                      />
                      <span className="flex-1 font-medium text-neutral-800">{s.name}</span>
                      <button
                        onClick={() => toggle(s.id)}
                        aria-label={`Remove ${s.name}`}
                        className="text-neutral-400 transition hover:text-maroon"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <span className="flex-1 italic text-neutral-400">A thread, waiting</span>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="text-center">
            <p className="h-7 text-[15px] italic text-neutral-500" aria-live="polite">
              {hovered ? (
                <>
                  <span className="not-italic font-medium text-neutral-800">{hovered.name}</span>{" "}
                  <span className="text-[12px] not-italic text-neutral-400">{inr(hovered.price)}</span>
                </>
              ) : full ? (
                "Woven as one"
              ) : (
                "Choose a silk to weave it in"
              )}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3" role="group" aria-label="Silks to weave">
              {WEAVE_SILKS.map((s) => {
                const on = slots.includes(s.id);
                const dim = full && !on;
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    onPointerEnter={() => setHover(s.id)}
                    onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover(s.id)}
                    onBlur={() => setHover(null)}
                    disabled={dim}
                    aria-pressed={on}
                    aria-label={`${s.name}, ${inr(s.price)}`}
                    className={`h-10 w-10 rounded-full shadow-[0_6px_14px_-6px_rgba(0,0,0,0.45)] transition duration-300 ${on ? "-translate-y-1.5 scale-110 ring-2 ring-maroon ring-offset-2" : dim ? "opacity-30" : "hover:-translate-y-1 hover:scale-110"}`}
                    style={{
                      backgroundColor: s.base,
                      backgroundImage: thumbs[s.id] ? `url(${thumbs[s.id]})` : undefined,
                      backgroundSize: "cover",
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div className="text-right">
            <p className="h-4 text-[12px] text-neutral-400 line-through">{count ? inr(original) : ""}</p>
            <p className="text-[clamp(1.6rem,2.4vw,2.2rem)] font-semibold tabular-nums">{inr(total)}</p>
            <p className="h-4 text-[11px] text-neutral-400">{count ? `You save ${inr(original - total)}` : "Pick a silk to begin"}</p>
            <button
              disabled={count === 0}
              onClick={() => {
                addMany(picked, `${count} ${count === 1 ? "silk" : "silks"} woven into your bag · saved ${inr(original - total)}`);
                setSlots([null, null, null]);
              }}
              className="mt-3 rounded-full bg-[#f2b324] px-7 py-3 text-[13px] font-bold text-maroon-deep shadow-[0_10px_24px_-10px_rgba(200,140,10,0.9)] transition enabled:hover:-translate-y-0.5 enabled:active:scale-95 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none"
            >
              Add to bag
            </button>
          </div>
        </div>
      </div>

      {/* footer: the NOOLAM wordmark, set large and fading out below the links */}
      <WordmarkFooter
        name="NOOLAM"
        year={2026}
        description="A demo brand built for a design showcase. Every silk here is imagined, but the weaving it is inspired by is real, and it lives in Kanchipuram."
        status="Open daily · 10 am – 8 pm"
        email="hello@noolam.example"
        credit={{ label: "Photos by Unsplash", href: "https://unsplash.com" }}
        navLabel="Footer"
        columns={[
          {
            title: "Explore",
            links: [
              { label: "Try the Look", href: "#try-the-look" },
              { label: "Pick a Silk", href: "#pick-a-silk" },
              { label: "The Rack", href: "#the-rack" },
              { label: "Bridal", href: "#bridal" },
            ],
          },
          {
            title: "Visit",
            links: [
              { label: "Gandhi Road, Kanchipuram", href: "https://maps.google.com/?q=Gandhi+Road+Kanchipuram" },
              { label: "Tamil Nadu, India", href: "https://maps.google.com/?q=Kanchipuram+Tamil+Nadu" },
            ],
          },
          {
            title: "Credits",
            links: [
              { label: "Photos: Unsplash", href: "https://unsplash.com" },
              { label: "Films: Pexels", href: "https://www.pexels.com" },
            ],
          },
        ]}
        // the wordmark uses the site's serif, and fades from the NOOLAM maroon
        style={{ ["--font-display"]: "var(--font-source-serif), Georgia, serif", ["--color-primary"]: "#8a1c2e" }}
      />
    </section>
  );
}
