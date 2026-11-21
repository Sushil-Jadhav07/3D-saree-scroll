/**
 * All photography is loaded online from Unsplash (free Unsplash licence, https://unsplash.com/license) and one
 * open-licensed film from Wikimedia Commons. Every photo used is credited in ATTRIBUTION.md.
 * Each entry below is an Unsplash photo path (the part after images.unsplash.com/); to swap a picture, change
 * the path here or in data.ts; nothing else in the app needs to move.
 */
export const un = (photo, w = 800) => `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=${w}&q=80`;
export const IMG = {
  // Muse Film side columns
  museLeft: [
    "photo-1614881064213-180b1c28f743",
    "photo-1572470176170-98fa8abcb741",
    "photo-1742287724816-4a8a1cc7ad5c",
    "photo-1692992193981-d3d92fabd9cb",
    "photo-1752469135696-f87983c56f2b",
    "photo-1750008558675-e385436092bf",
  ],
  museRight: [
    "photo-1757351122515-21a7b61d682e",
    "photo-1595231712612-754e8fe9d29b",
    "photo-1742891603263-a32036d63f3b",
    "photo-1742891603547-950f510710d7",
    "photo-1743015346338-24d9627085b2",
    "photo-1612273882937-44c5313400e5",
  ],
  // The Weave
  weave: [
    "photo-1759738096144-b43206226765",
    "photo-1631663027473-3671aa7c4503",
    "photo-1630961680768-998a170045fa",
    "photo-1612945578381-6481cdd73b0a",
  ],
  fabricTexture: "photo-1631663027473-3671aa7c4503",
  // Jewellery thumbnails
  choker: "photo-1640183298005-3a4497cc6a37",
  jhumka: "photo-1729101146493-347d9abf62b0",
  ottiyanam: "photo-1756355201178-699e692e2819",
  bangles: "photo-1612945578381-6481cdd73b0a",
};
/** Pexels video 7677156, "A Red Silk Fabric" (free licence). 4 MB, 1080p. Intro curtain. */
export const INTRO_FILM = {
  src: "https://videos.pexels.com/video-files/7677156/7677156-hd_1920_1080_25fps.mp4",
};
/** Pexels video 13752603, "Close up of Weaving" by Roberto Zepeda (Pexels License). 1080p, 28 s. Credited in ATTRIBUTION.md. */
export const FILM = {
  src: "https://videos.pexels.com/video-files/13752603/13752603-hd_1920_1080_60fps.mp4",
  poster: un("photo-1759738096144-b43206226765", 1200),
};
