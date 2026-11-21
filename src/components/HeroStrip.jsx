const WORDS = ["Kanchipuram", "Pure Zari", "Handwoven", "Temple Borders", "Bridal Silks", "Heirloom Drapes", "Mulberry Silk"];
/** Maroon strip that closes the hero: gold serif words scrolling past, as in the original. */
export default function HeroStrip() {
  const run = (
    <div className="flex shrink-0 items-center" aria-hidden>
      {WORDS.map((w) => (
        <span key={w} className="flex shrink-0 items-center">
          <span className="mx-7 text-[11px] text-gold">◆</span>
          <span className="font-serif text-[15px] uppercase tracking-[0.42em] text-gold-soft">{w}</span>
        </span>
      ))}
    </div>
  );
  return (
    <div
      className="relative z-10 -mt-px overflow-hidden border-y border-gold/40 bg-maroon-ink py-3.5"
      aria-label="Kanchipuram, pure zari, handwoven, temple borders, bridal silks"
    >
      <div className="marquee-track" style={{ animationDuration: "45s" }}>
        {run}
        {run}
        {run}
        {run}
      </div>
    </div>
  );
}
