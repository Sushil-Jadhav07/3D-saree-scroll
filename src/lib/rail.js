export const RAIL_TABS = [
  { id: "all", label: "All pieces" },
  { id: "silk", label: "Silk Sarees" },
  { id: "half", label: "Half Sarees" },
  { id: "blouse-full", label: "Full-Sleeve Blouses" },
  { id: "blouse-half", label: "Half-Sleeve Blouses" },
  { id: "checked", label: "Checked Sarees" },
  { id: "zari", label: "Zari & Brocade" },
];
const S = (id, name, price, note, details) => ({ id, tab: "silk", name, price, note, details });
const H = (id, name, price, note, details) => ({ id, tab: "half", name, price, note, details });
const F = (id, name, price, note, details) => ({ id, tab: "blouse-full", name, price, note, details });
const B = (id, name, price, note, details) => ({ id, tab: "blouse-half", name, price, note, details });
const C = (id, name, price, note, details) => ({ id, tab: "checked", name, price, note, details });
const Z = (id, name, price, note, details) => ({ id, tab: "zari", name, price, note, details });
export const RAIL = [
  // Silk sarees
  S("s1", "Ruby Red Silk", 32400, "Ruby silk, gold zari butis and a woven temple border.", ["Pure silk", "Gold zari", "Blouse piece"]),
  S("s2", "Royal Cobalt Peacock", 36800, "Cobalt body with a peacock-motif zari border.", ["Pure silk", "Peacock border", "Blouse piece"]),
  S("s3", "Peacock Teal Kanjivaram", 34500, "Teal silk with a wide gold border and a quiet pallu.", [
    "Kanjivaram",
    "Gold zari",
    "Blouse piece",
  ]),
  S("s4", "Ivory Maroon Zari", 29800, "Ivory body, maroon and gold border, made for a morning pooja.", [
    "Pure silk",
    "Maroon zari",
    "Blouse piece",
  ]),
  S("s5", "Rani Pink Butta Silk", 27600, "Rani pink with fine gold buttas down the whole drape.", [
    "Pure silk",
    "Butta weave",
    "Blouse piece",
  ]),
  S("s6", "Cobalt Butta Silk", 26900, "Deep cobalt with scattered gold motifs and a pale zari hem.", [
    "Pure silk",
    "Butta weave",
    "Blouse piece",
  ]),
  S("s7", "Turmeric Check Silk", 24800, "Turmeric and saffron checks with a maroon edge.", ["Silk blend", "Woven check", "Blouse piece"]),
  S("s8", "Olive Gold Border", 25400, "Olive silk with a broad mustard-gold border.", ["Pure silk", "Zari border", "Blouse piece"]),
  S("s9", "Cream Gold Silk", 22900, "Cream silk with a soft gold hem, easy to style for any season.", [
    "Pure silk",
    "Gold hem",
    "Blouse piece",
  ]),
  S("s10", "Rainbow Stripe Silk", 23700, "Wide stripes in earthy greens, reds and gold.", ["Silk blend", "Woven stripe", "Blouse piece"]),
  // Half sarees
  H("h1", "Emerald Magenta Half-Saree", 28500, "Emerald skirt, magenta dupatta, finished with a gold border.", [
    "Skirt, choli, dupatta",
    "Zari border",
    "Semi-stitched",
  ]),
  H("h2", "Maroon Ivory Half-Saree", 31200, "Ivory skirt with a maroon drape, classic for festivals.", [
    "Skirt, choli, dupatta",
    "Zari border",
    "Semi-stitched",
  ]),
  H("h3", "Mustard Royal Blue Half-Saree", 29400, "Royal blue skirt, mustard dupatta, a gold hem all round.", [
    "Skirt, choli, dupatta",
    "Zari border",
    "Semi-stitched",
  ]),
  H("h4", "Violet Peach Half-Saree", 30800, "Soft peach skirt with a violet dupatta and a temple border.", [
    "Skirt, choli, dupatta",
    "Zari border",
    "Semi-stitched",
  ]),
  // Full-sleeve blouses
  F("f1", "Cobalt Peacock Cuff Blouse", 5400, "Cobalt silk, gold sweetheart neck, peacock-woven cuffs.", [
    "Full sleeve",
    "Padded",
    "Hook-and-eye back",
  ]),
  F("f2", "Emerald Zari Blouse", 4900, "Emerald silk with a zari-edged square neck and golden butis.", [
    "Full sleeve",
    "Padded",
    "Hook-and-eye back",
  ]),
  F("f3", "Ivory Gold Trim Blouse", 4800, "Ivory silk, gold-trimmed neck and zari cuffs.", ["Full sleeve", "Padded", "Hook-and-eye back"]),
  F("f4", "Maroon Lotus Blouse", 5200, "Maroon silk with a lotus-embroidered neckline and woven cuffs.", [
    "Full sleeve",
    "Padded",
    "Hook-and-eye back",
  ]),
  F("f5", "Rani Pink Zari Blouse", 5100, "Rani pink with gold embroidery along the neck and cuffs.", [
    "Full sleeve",
    "Padded",
    "Hook-and-eye back",
  ]),
  // Half-sleeve blouses
  B("b1", "Coral Peach Zari Blouse", 3900, "Coral peach silk with a gold-embroidered scoop neck.", [
    "Half sleeve",
    "Padded",
    "Zari borders",
  ]),
  B("b2", "Ivory Maroon Border Blouse", 3800, "Ivory silk, maroon and gold borders on the sleeves.", [
    "Half sleeve",
    "Padded",
    "Zari borders",
  ]),
  B("b3", "Mustard Silk Blouse", 3600, "Mustard silk with a temple-motif sleeve border.", ["Half sleeve", "Padded", "Temple border"]),
  B("b4", "Rani Pink Silk Blouse", 3700, "Rani pink silk with gold sleeve borders.", ["Half sleeve", "Padded", "Zari borders"]),
  B("b5", "Royal Violet Blouse", 4100, "Violet silk with gold buttas and peacock-woven sleeves.", [
    "Half sleeve",
    "Padded",
    "Peacock border",
  ]),
  B("b6", "Ruby Zari Blouse", 4200, "Ruby red with a sweetheart neck and gold embroidery.", ["Half sleeve", "Padded", "Zari borders"]),
  B("b7", "Teal Zari Blouse", 4000, "Teal silk with a square neck and woven lotus sleeves.", ["Half sleeve", "Padded", "Lotus border"]),
  // Checked sarees
  C("c1", "Cobalt Gold Check", 26400, "Cobalt and gold checks over a peacock-woven border.", ["Silk blend", "Woven check", "Blouse piece"]),
  C("c2", "Emerald Pink Check", 24900, "Bold emerald and pink squares with a lotus border.", ["Silk blend", "Woven check", "Blouse piece"]),
  C("c3", "Magenta Saffron Check", 21800, "Magenta and saffron checks, a gold hem and not a dull moment.", [
    "Silk blend",
    "Woven check",
    "Blouse piece",
  ]),
  C("c4", "Rose Gingham Silk", 19600, "Rose and cream gingham with a green zari border.", ["Silk blend", "Gingham check", "Blouse piece"]),
  C("c5", "Ivory Maroon Check", 23400, "Ivory and maroon check with a temple border.", ["Silk blend", "Woven check", "Blouse piece"]),
  C("c6", "Kovai Multi Check", 20800, "Green, teal and saffron check, a Kovai favourite.", ["Silk blend", "Kovai check", "Blouse piece"]),
  C("c7", "Turmeric Magenta Check", 22600, "Turmeric and magenta squares, gold zari hem.", ["Silk blend", "Woven check", "Blouse piece"]),
  // Zari & brocade
  Z("z1", "Emerald Peacock Brocade", 38600, "Emerald brocade woven with gold peacocks.", ["Brocade", "Heavy zari", "Blouse piece"]),
  Z("z2", "Ivory Gold Paisley Zari", 41200, "Ivory silk, gold paisley all over.", ["Brocade", "Heavy zari", "Blouse piece"]),
  Z("z3", "Royal Purple Banarasi", 44800, "Royal purple Banarasi with a woven floral jaal.", ["Banarasi", "Heavy zari", "Blouse piece"]),
  Z("z4", "Wine Maroon Lotus Brocade", 43500, "Wine maroon with a gold lotus brocade pattern.", ["Brocade", "Heavy zari", "Blouse piece"]),
];
export const railFor = (tab) => (tab === "all" ? RAIL : RAIL.filter((p) => p.tab === tab));
export const isWide = (tab) => tab === "blouse-full" || tab === "blouse-half";
