import { ArrowRight, ShoppingBag } from "lucide-react";
import { useRef } from "react";
import { useStore } from "@/lib/store";
import MuseLens from "./MuseLens";
import CurvedLoop from "./ui/curved-text-loop";
/* ---- tune the curved line under the cards with these four numbers ---------------------------------------------
   GAP_TO_CARDS   px between the cards and the line. More negative = line moves UP, closer to the cards (try -80 … -130)
   CURVE          how much the line arches. More negative = more curve, 0 = flat (try -60 … -160)
   TEXT_Y         height of the line's two ends inside its box, 0–160. Bigger = the ends sit lower than the middle's start
   GAP_TO_BUTTONS space between the line and the "View cart" row. More negative = buttons move up (try "-5vw" … "0")
   -------------------------------------------------------------------------------------------------------------- */
const GAP_TO_CARDS = -86;
const CURVE = -115;
const TEXT_Y = 100;
const GAP_TO_BUTTONS = "-5vw";
/**
 * "Draped in devotion. Worn in light." — ten silks, ten muses on a curved-lens carousel: the centre card
 * is flat, the rest bend away toward the rim. Drag, flick, arrow keys or buttons; tap a side card to bring
 * it forward; "Add to cart" on the centre card goes straight to the bag.
 */
export default function Muses() {
  const { addToBag, bag } = useStore();
  const api = useRef(null);
  return (
    <section id="the-muses" className="overflow-hidden" style={{ background: "#e4edfb", paddingTop: 48 }}>
      <div className="mx-auto flex max-w-[1800px] flex-col justify-between gap-3 px-6 sm:px-10 md:flex-row md:items-end">
        <div>
          <span className="eyebrow">The Muses</span>
          <h2 className="section-title mt-4">
            Draped in devotion. <span className="gradient-text">Worn in light.</span>
          </h2>
          <p className="mt-3 text-[19px] text-neutral-600">Ten silks. Ten muses.</p>
        </div>
        <p className="max-w-[26rem] font-sans text-[16px] leading-relaxed text-neutral-500 md:text-right">
          Drag the lens, flick it, tap a card to bring it forward, and add the one that finds you.
        </p>
      </div>

      <div className="relative mt-4">
        <MuseLens apiRef={api} bend={0.3} onAdd={(m) => addToBag(`muse-${m.id}`, m.title)} />
      </div>

      {/* the line of text rides an arch that follows the bottom edge of the cards, right under them */}
      <div className="muses-curve relative" style={{ marginTop: GAP_TO_CARDS, marginBottom: GAP_TO_BUTTONS }}>
        <CurvedLoop
          marqueeText="Ten silks. Ten muses. • Every thread an offering. • Woven by hand. Worn in devotion. • "
          speed={1}
          curveAmount={CURVE}
          baseY={TEXT_Y}
          direction="left"
          highlights={["Ten muses.", "an offering.", "Worn in devotion."]}
          highlightClassName="fill-[#7a1230] font-bold"
          className="fill-neutral-800 font-serif text-[1.55rem] font-medium"
        />
      </div>

      <div className="muses-actions relative mt-7 flex items-center justify-center gap-4 md:gap-6">
        <a
          href="#the-rack"
          className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[15px] font-semibold text-white transition hover:brightness-125 md:px-7 md:py-3.5 md:text-[17px]"
          style={{ background: "#5b0f23", boxShadow: "0 10px 24px -10px rgba(91,15,35,0.8)" }}
        >
          View cart · {bag.length}
          <ShoppingBag size={19} />
        </a>
        <a
          href="#the-rack"
          className="inline-flex items-center gap-1.5 text-[15px] font-medium underline md:text-[17px] underline-offset-4 transition hover:opacity-70"
        >
          Shop the Rack <ArrowRight size={18} />
        </a>
      </div>
    </section>
  );
}
