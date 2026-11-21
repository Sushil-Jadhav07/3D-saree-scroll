import { ArrowRight, Heart, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
const LINKS = [
  { label: "Home", id: "home" },
  { label: "Try the Look", id: "try-the-look" },
  { label: "Pick a Silk", id: "pick-a-silk" },
  { label: "The Rack", id: "the-rack" },
  { label: "The Muse", id: "the-muse" },
  { label: "Bridal", id: "bridal" },
  { label: "The Weave", id: "the-weave" },
];
export default function Navbar() {
  const { bag, wishlist } = useStore();
  const [active, setActive] = useState("home");
  useEffect(() => {
    // sections without their own nav link highlight the nearest one
    const owner = { "six-moods": "home", "the-reels": "the-muse" };
    const ids = [...LINKS.map((l) => l.id), ...Object.keys(owner)];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (vis[0]) setActive(owner[vis[0].target.id] ?? vis[0].target.id);
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: [0, 0.1, 0.5] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <header data-intro-hide className="fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
      <nav
        aria-label="Primary"
        className="mx-auto flex w-full max-w-[1020px] items-center justify-between gap-3 rounded-full border border-gold/60 bg-walnut/80 py-1.5 pl-6 pr-1.5 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.6)] backdrop-blur-xl"
      >
        <a href="#home" className="flex flex-col items-center leading-none text-[#f3dfb0]" aria-label="NOOLAM home">
          <svg width="18" height="11" viewBox="0 0 22 14" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
            <path d="M11 1c1.5 2.5 1.5 5-0 8-1.5-3-1.5-5.500 0-8Z" />
            <path d="M11 9C8 8 4.500 6.500 1 7c2 3.500 6 5.500 10 5 4 .5 8-1.500 10-5-3.500-.5-7 1-10 2Z" />
          </svg>
          <span className="mt-0.5 font-serif text-[17px] tracking-[0.2em]">NOOLAM</span>
          <span className="text-[5px] tracking-[0.42em] text-gold">KANCHIPURAM SILK</span>
        </a>

        <ul className="hidden items-center gap-0.5 lg:flex xl:gap-1">
          {LINKS.map((l) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                className={`whitespace-nowrap rounded-full px-2.5 py-2 text-[12.5px] font-medium transition-colors xl:px-3 xl:text-[13px] ${
                  active === l.id ? "bg-gradient-to-b from-gold-soft to-gold text-maroon-deep" : "text-white/80 hover:text-white"
                }`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href="#the-rack"
            aria-label={`Wishlist, ${wishlist.length} items`}
            className="relative grid h-9 w-9 place-items-center rounded-full border border-white/25 text-white transition hover:bg-white/10"
          >
            <Heart size={15} />
            {wishlist.length > 0 && <Badge n={wishlist.length} />}
          </a>
          <a
            href="#pick-a-silk"
            aria-label={`Bag, ${bag.length} items`}
            className="relative grid h-9 w-9 place-items-center rounded-full border border-white/25 text-white transition hover:bg-white/10"
          >
            <ShoppingBag size={15} />
            {bag.length > 0 && <Badge n={bag.length} />}
          </a>
          <a
            href="#the-weave"
            aria-label="Visit the Store"
            className="btn-maroon shrink-0 whitespace-nowrap !gap-0 !py-1 !pl-1 !pr-1 text-[13px] min-[640px]:max-[1023px]:!gap-3 min-[640px]:max-[1023px]:!pl-5 min-[1100px]:!gap-3 min-[1100px]:!pl-5"
          >
            <span className="hidden min-[640px]:max-[1023px]:inline min-[1100px]:inline">Visit the Store</span>
            <span className="btn-icon !h-8 !w-8 bg-white text-maroon">
              <ArrowRight size={15} />
            </span>
          </a>
        </div>
      </nav>
    </header>
  );
}
function Badge({ n }) {
  return (
    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-maroon-deep">
      {n}
    </span>
  );
}
