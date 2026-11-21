import { ArrowUpRight, Volume2, VolumeX } from "lucide-react";
import { useRef, useState } from "react";
import { FILM, IMG, un } from "@/lib/images";
import AutoVideo from "./AutoVideo";
function Column({ ids, dir, className = "" }) {
  const loop = [...ids, ...ids];
  return (
    <div
      aria-hidden
      className={`relative h-[640px] overflow-hidden ${className}`}
      style={{
        maskImage: "linear-gradient(to bottom, transparent 0, #000 16%, #000 84%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 16%, #000 84%, transparent 100%)",
      }}
    >
      <div className="flex flex-col gap-5" style={{ animation: `${dir === "up" ? "col-up" : "col-down"} 55s linear infinite` }}>
        {loop.map((id, n) => (
          <img
            key={n}
            src={un(id, 420)}
            alt=""
            loading="eager"
            decoding="async"
            className="aspect-[3/4] w-full rounded-[22px] object-cover shadow-[0_18px_30px_-20px_rgba(0,0,0,0.5)]"
            style={{ height: n % 2 ? 300 : 360 }}
          />
        ))}
      </div>
    </div>
  );
}
export default function MuseFilm() {
  const vid = useRef(null);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);
  return (
    <section id="the-muse" className="overflow-hidden bg-white px-4 sm:px-8" style={{ paddingTop: 48, paddingBottom: 48 }}>
      <div className="mx-auto grid max-w-[1800px] items-center gap-8 lg:grid-cols-[minmax(0,260px)_1fr_minmax(0,260px)]">
        <Column ids={IMG.museLeft} dir="up" className="hidden lg:block" />

        <div className="text-center">
          <span className="eyebrow justify-center">The Muse Film</span>
          <h2 className="section-title mt-4">
            Feel the <span className="gradient-text">drape</span>
          </h2>

          <div className="relative mx-auto mt-10 max-w-[900px]">
            {/* corner brackets */}
            {[
              "left-[-14px] top-[-14px] border-l border-t",
              "right-[-14px] top-[-14px] border-r border-t",
              "bottom-[-14px] left-[-14px] border-b border-l",
              "bottom-[-14px] right-[-14px] border-b border-r",
            ].map((c) => (
              <span key={c} className={`absolute h-5 w-5 border-gold ${c}`} aria-hidden />
            ))}
            <div className="rounded-[22px] border border-gold/50 bg-white p-3 shadow-[0_40px_70px_-40px_rgba(138,28,46,0.45)]">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-maroon-deep">
                {failed ? (
                  <img src={FILM.poster} alt="Hands working a Kanchipuram-style handloom" className="h-full w-full object-cover" />
                ) : (
                  <AutoVideo
                    ref={vid}
                    src={FILM.src}
                    poster={FILM.poster}
                    muted={muted}
                    label="Handloom saree weaving film"
                    className="h-full w-full object-cover"
                    onFail={() => setFailed(true)}
                  />
                )}
                <button
                  onClick={() => {
                    setMuted((m) => !m);
                    vid.current?.play().catch(() => {});
                  }}
                  aria-pressed={!muted}
                  className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/30 bg-black/55 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md transition hover:bg-black/75"
                >
                  {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  Sound {muted ? "off" : "on"}
                </button>
              </div>
            </div>
          </div>

          <a href="#the-rack" className="btn-maroon mt-10 text-[17px]">
            Purchase the Collection
            <span className="btn-icon bg-white text-maroon">
              <ArrowUpRight size={19} />
            </span>
          </a>
          <p className="mt-6 text-[11px] text-neutral-400">Film: “Close up of Weaving” by Roberto Zepeda · Pexels</p>
        </div>

        <Column ids={IMG.museRight} dir="down" className="hidden lg:block" />
      </div>
    </section>
  );
}
