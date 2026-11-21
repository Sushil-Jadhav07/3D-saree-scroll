export const WEAVE_SILKS = [
  { id: "w1", name: "Muga Ivory Buta", price: 24600, base: "#efe2c4", accent: "#c79a3b", kind: "buti" },
  { id: "w2", name: "Cobalt Zari Stripe", price: 26800, base: "#1b3fa0", accent: "#e6bd62", kind: "stripe" },
  { id: "w3", name: "Silver Pearl Brocade", price: 31200, base: "#b9bcc2", accent: "#f2f3f5", kind: "brocade" },
  { id: "w4", name: "Manjal Stripe Kooral", price: 22400, base: "#f0b814", accent: "#b3122e", kind: "stripe" },
  { id: "w5", name: "Rani Pink Temple Border", price: 29400, base: "#d6246e", accent: "#e8c36a", kind: "border" },
  { id: "w6", name: "Marigold Butta", price: 21500, base: "#ea8a16", accent: "#7a1428", kind: "buti" },
  { id: "w7", name: "Parrot Green Kooral", price: 23300, base: "#2f9a4f", accent: "#e8c36a", kind: "border" },
  { id: "w8", name: "Kooral Madras Checks", price: 16900, base: "#c8321f", accent: "#f2c230", third: "#1d3a8a", kind: "check" },
  { id: "w9", name: "Magenta Mayil", price: 33700, base: "#b3167f", accent: "#e0b04d", kind: "brocade" },
  { id: "w10", name: "Midnight Kanchi", price: 35200, base: "#1d1a4a", accent: "#d9b25a", kind: "border" },
];
const cache = new Map();
/** Draws a tile of the silk (browser only). Used for swatches and as the ribbon texture. */
export function silkCanvas(s, size = 256) {
  const key = s.id + size;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  g.fillStyle = s.base;
  g.fillRect(0, 0, size, size);
  const u = size / 16;
  switch (s.kind) {
    case "buti": {
      g.fillStyle = s.accent;
      for (let y = 0; y < 4; y++)
        for (let x = 0; x < 4; x++) {
          const cx = ((x + 0.5 + (y % 2) * 0.5) * (size / 4)) % size;
          const cy = (y + 0.5) * (size / 4);
          g.beginPath();
          g.moveTo(cx, cy - u * 1.1);
          g.lineTo(cx + u * 0.8, cy);
          g.lineTo(cx, cy + u * 1.1);
          g.lineTo(cx - u * 0.8, cy);
          g.closePath();
          g.fill();
          g.beginPath();
          g.arc(cx, cy, u * 0.28, 0, 7);
          g.fillStyle = s.base;
          g.fill();
          g.fillStyle = s.accent;
        }
      break;
    }
    case "stripe": {
      g.fillStyle = s.accent;
      for (let x = 1; x < 16; x += 4) g.fillRect(x * u, 0, u * 0.45, size);
      g.fillStyle = `${s.accent}66`;
      for (let x = 3; x < 16; x += 4) g.fillRect(x * u, 0, u * 1.2, size);
      break;
    }
    case "check": {
      g.fillStyle = `${s.accent}b0`;
      for (let x = 0; x < 16; x += 8) g.fillRect(x * u, 0, u * 3, size);
      for (let y = 0; y < 16; y += 8) g.fillRect(0, y * u, size, u * 3);
      g.fillStyle = `${s.third ?? "#1d3a8a"}99`;
      for (let x = 4; x < 16; x += 8) g.fillRect(x * u, 0, u * 1.5, size);
      for (let y = 4; y < 16; y += 8) g.fillRect(0, y * u, size, u * 1.5);
      break;
    }
    case "border": {
      g.fillStyle = s.accent;
      g.fillRect(0, 0, size, u * 2.2);
      g.fillRect(0, size - u * 2.2, size, u * 2.2);
      for (let x = 0; x < 16; x++) {
        g.beginPath();
        g.moveTo(x * u, u * 2.2);
        g.lineTo(x * u + u / 2, u * 3.6);
        g.lineTo((x + 1) * u, u * 2.2);
        g.moveTo(x * u, size - u * 2.2);
        g.lineTo(x * u + u / 2, size - u * 3.6);
        g.lineTo((x + 1) * u, size - u * 2.2);
        g.fill();
      }
      g.fillStyle = `${s.accent}55`;
      g.fillRect(0, u * 6, size, u * 4);
      break;
    }
    case "brocade": {
      g.fillStyle = s.accent;
      for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++) {
          g.beginPath();
          g.arc(((x + 0.5 + (y % 2) * 0.5) * (size / 8)) % size, (y + 0.5) * (size / 8), u * 0.34, 0, 7);
          g.fill();
        }
      break;
    }
  }
  // silk sheen
  const sheen = g.createLinearGradient(0, 0, size, size);
  sheen.addColorStop(0, "rgba(255,255,255,0.22)");
  sheen.addColorStop(0.5, "rgba(255,255,255,0)");
  sheen.addColorStop(1, "rgba(0,0,0,0.2)");
  g.fillStyle = sheen;
  g.fillRect(0, 0, size, size);
  cache.set(key, c);
  return c;
}
