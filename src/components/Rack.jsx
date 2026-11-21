import { Heart, ShoppingBag } from "lucide-react";
import { Fragment } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { inr } from "@/lib/data";
import { RAIL, RAIL_TABS, isWide, railFor } from "@/lib/rail";
import { useStore } from "@/lib/store";
import ClothingRailHero from "./ProductRail";
const SIZES = [34, 36, 38, 40, 42];
/** Add to bag + wishlist, shown in the lifted-off-the-rail detail view. */
function Actions({ id, name, price, blouse }) {
  const { addToBag, toggleWish, isWished } = useStore();
  const [size, setSize] = useState(null);
  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-xl font-semibold tracking-tight text-foreground">{inr(price)}</p>
      {blouse && (
        <div className="flex flex-wrap justify-center gap-2 md:justify-start" role="group" aria-label="Size">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              aria-pressed={size === s}
              className={`grid size-9 place-items-center rounded-full border text-[12px] transition ${size === s ? "border-ink bg-ink text-white" : "border-neutral-300 hover:border-ink"}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center justify-center gap-3 md:justify-start">
        <button
          type="button"
          disabled={blouse && size === null}
          onClick={() => addToBag(blouse ? `${id}-${size}` : id, name)}
          className="inline-flex min-w-[210px] items-center justify-center gap-2 rounded-full bg-maroon px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition enabled:hover:bg-maroon-ink disabled:bg-neutral-300"
        >
          <ShoppingBag size={14} />
          {blouse && size === null ? "Select a size" : "Add to bag"}
        </button>
        <button
          type="button"
          onClick={() => toggleWish(id)}
          aria-pressed={isWished(id)}
          aria-label="Wishlist"
          className="grid size-11 place-items-center rounded-full border border-neutral-300 text-maroon transition hover:bg-neutral-50"
        >
          <Heart size={16} fill={isWished(id) ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
  );
}
/** "All pieces" has 37 hangers, more than a screen holds: keep them full size and let the rail scroll sideways. */
const ALL_RAIL_W = 2850;
function Scroller({ children }) {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className="rail-scroll overflow-x-auto overflow-y-hidden pb-3"
      style={{ ["--rail-viewport"]: w ? w + "px" : "100vw", scrollbarWidth: "thin", scrollbarColor: "#c9bdb6 transparent" }}
      aria-label="Scroll sideways to see every piece"
    >
      <div style={{ width: ALL_RAIL_W }}>{children}</div>
    </div>
  );
}
export default function Rack() {
  const [tab, setTab] = useState("silk");
  const wide = isWide(tab);
  const list = railFor(tab);
  const items = useMemo(
    () =>
      list.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.note,
        details: p.details,
        tag: inr(p.price),
        image: `/rail/${p.id}-${wide ? "w" : "t"}.webp`,
      })),
    [list, wide],
  );
  const byId = useMemo(() => new Map(RAIL.map((p) => [p.id, p])), []);
  return (
    <section id="the-rack" className="relative bg-white px-4 sm:px-8" style={{ paddingTop: 48, paddingBottom: 48 }}>
      <div className="mx-auto max-w-[1800px] text-center">
        <span className="eyebrow">The Collection</span>
        <h2 className="section-title mt-4">
          Every silk, <span className="gradient-text">on the rail.</span>
        </h2>

        <div role="tablist" aria-label="Filter the rack" className="mt-9 flex flex-wrap justify-center gap-3">
          {RAIL_TABS.map((c) => {
            const on = tab === c.id;
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={on}
                onClick={() => setTab(c.id)}
                className={`flex items-center gap-2.5 rounded-full border py-2 pl-5 pr-2 text-[15px] font-medium transition-all duration-300 ${
                  on
                    ? "border-maroon-deep bg-maroon text-white shadow-[0_0_0_3px_rgba(138,28,46,0.15),0_10px_24px_-10px_rgba(138,28,46,0.8)]"
                    : "border-neutral-200 bg-white text-ink shadow-sm hover:-translate-y-0.5 hover:shadow-md"
                }`}
              >
                {c.label}
                <span
                  className={`grid h-7 min-w-7 place-items-center rounded-full px-1.5 text-[13px] font-semibold ${on ? "bg-white text-maroon" : "bg-[#fbeee6] text-maroon"}`}
                >
                  {railFor(c.id).length}
                </span>
              </button>
            );
          })}
        </div>

        {/* the rail: remounted per tab so every tab starts with its hangers swinging in */}
        {(() => {
          const Wrap = tab === "all" ? Scroller : Fragment;
          return (
            <div className="mt-6">
              <Wrap>
                <ClothingRailHero
                  key={tab}
                  items={items}
                  hanger="none"
                  aspect={wide ? 1.2 : 200 / 310}
                  maxHeight={wide ? 300 : tab === "all" ? 340 : 400}
                  minHeight={wide || tab === "all" ? 150 : 200}
                  scrollable={tab === "all"}
                  caption="Brush along the rail, slide a hanger, lift a piece to see it up close."
                  autoplay={false}
                  className="rail-stage"
                  actions={(item) => {
                    const p = byId.get(item.id);
                    return p ? (
                      <Actions id={p.id} name={p.name} price={p.price} blouse={p.tab === "blouse-full" || p.tab === "blouse-half"} />
                    ) : null;
                  }}
                />
              </Wrap>
            </div>
          );
        })()}

        <div className="mt-6 flex flex-col justify-between gap-2 text-[11px] uppercase tracking-[0.16em] text-neutral-400 sm:flex-row">
          <span>
            {tab === "all" ? "Scroll sideways to see every piece" : "Explore the collection"} · {list.length}{" "}
            {list.length === 1 ? "piece" : "pieces"}
          </span>
          <span>Demo collection · Prices in ₹</span>
        </div>
      </div>
    </section>
  );
}
