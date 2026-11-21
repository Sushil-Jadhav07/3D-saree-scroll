import * as React from "react";
import { MUSES, inr } from "@/lib/data";
import { un } from "@/lib/images";
const CW = 310; // card size the textures are designed at (CSS px); drawn at 2x
const CH = 520;
const TS = 2;
const PILL = { x: 156, y: 460, w: 134, h: 40 }; // "Add to cart +" on the card, in card px
// #region motion
const wrap = (i, n) => (n > 0 ? ((i % n) + n) % n : 0);
const offsetOf = (i, pos, n) => wrap(i - pos + n / 2, n) - n / 2;
const restFor = (pos, velocity, max = 3) => Math.round(pos + Math.max(-max, Math.min(max, velocity * 0.18)));
const springStep = (pos, vel, target, dt, omega = 11) => {
  const a = (target - pos) * omega * omega - vel * 2 * omega;
  const v = vel + a * dt;
  return [pos + v * dt, v];
};
const cardSize = (w, h) => {
  const cw = Math.min(CW, w < 640 ? w * 0.6 : w < 900 ? w * 0.3 : w * 0.135, h * 0.62 * (CW / CH) * 1.6);
  return [Math.round(cw), Math.round((cw * CH) / CW)];
};
// #endregion
const VERT =
  "attribute vec2 aPos;" +
  "uniform vec2 uRes;uniform vec2 uSize;uniform float uX;uniform float uBend;uniform float uVel;uniform float uIntro;" +
  "varying vec2 vUv;varying float vX;" +
  "void main(){" +
  "vec2 p=vec2(uX+(aPos.x-.5)*uSize.x,(aPos.y-.5)*uSize.y);" +
  "p.y-=(1.-uIntro)*uSize.y*.9;" +
  "vec2 n=p/(uRes*.5);" +
  "float x=clamp(n.x,-1.4,1.4);" +
  "n.y*=1.+uBend*x*x;" +
  "n.y+=uVel*.05*sin(aPos.x*3.14159)*(aPos.y-.5);" +
  "n.x*=1.-.06*uBend*x*x;" +
  "vUv=aPos;vX=x;" +
  "gl_Position=vec4(n,0.,1.);}";
const FRAG =
  "precision highp float;" +
  "uniform sampler2D uTex;uniform vec2 uSize;uniform float uVel;uniform float uIntro;uniform float uReady;" +
  "varying vec2 vUv;varying float vX;" +
  "float box(vec2 q,vec2 b,float r){vec2 d=abs(q)-b+r;return length(max(d,0.))+min(max(d.x,d.y),0.)-r;}" +
  "void main(){" +
  "float ca=(.0008+.0040*vX*vX)*(1.+abs(uVel)*1.2);" +
  "vec3 c=vec3(texture2D(uTex,vUv+vec2(ca,0.)).r,texture2D(uTex,vUv).g,texture2D(uTex,vUv-vec2(ca,0.)).b);" +
  "c=mix(vec3(.16,.07,.09),c,uReady);" +
  "c*=1.-.42*min(1.,vX*vX);" +
  "float d=box((vUv-.5)*uSize,uSize*.5,26.);" +
  "float rim=smoothstep(-5.,0.,d);" +
  "c+=rim*.10;" +
  "float al=smoothstep(.75,-.75,d)*uIntro;" +
  "gl_FragColor=vec4(c*al,al);}";
function shader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}
/** A (segX × segY) grid of quads as triangles, positions 0..1. */
function grid(segX, segY) {
  const out = [];
  for (let y = 0; y < segY; y++)
    for (let x = 0; x < segX; x++) {
      const x0 = x / segX,
        x1 = (x + 1) / segX,
        y0 = y / segY,
        y1 = (y + 1) / segY;
      out.push(x0, y0, x1, y0, x0, y1, x0, y1, x1, y0, x1, y1);
    }
  return new Float32Array(out);
}
function lines(ctx, text, maxW, maxLines) {
  const out = [];
  let cur = "";
  for (const word of text.split(" ")) {
    const t = cur ? cur + " " + word : word;
    if (ctx.measureText(t).width > maxW && cur) {
      out.push(cur);
      cur = word;
    } else cur = t;
  }
  if (cur) out.push(cur);
  if (out.length > maxLines) {
    out.length = maxLines;
    out[maxLines - 1] = out[maxLines - 1].replace(/\s*\S*$/, "…");
  }
  return out;
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
/** Paint one card: photo, shading, number, fabric, title, note, price and the Add to cart pill. */
function paint(c, m, n, img, font, sans, added) {
  c.width = CW * TS;
  c.height = CH * TS;
  const x = c.getContext("2d");
  x.setTransform(TS, 0, 0, TS, 0, 0);
  x.fillStyle = "#3b0f1b";
  x.fillRect(0, 0, CW, CH);
  if (img) {
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = CW / CH;
    const sh = ir > cr ? img.naturalHeight : img.naturalWidth / cr;
    const sw = ir > cr ? img.naturalHeight * cr : img.naturalWidth;
    const [fx, fy] = (m.pos ?? "50% 25%").split(" ").map((s) => parseFloat(s) / 100);
    x.drawImage(img, (img.naturalWidth - sw) * fx, (img.naturalHeight - sh) * fy, sw, sh, 0, 0, CW, CH);
  }
  const g = x.createLinearGradient(0, 0, 0, CH);
  g.addColorStop(0, "rgba(0,0,0,.3)");
  g.addColorStop(0.45, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,.9)");
  x.fillStyle = g;
  x.fillRect(0, 0, CW, CH);
  // number badge
  x.fillStyle = "rgba(255,255,255,.92)";
  x.beginPath();
  x.arc(34, 34, 18, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = "#141010";
  x.font = `700 12px ${sans}`;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(String(n).padStart(2, "0"), 34, 34.5);
  // text block, built from the bottom up
  const pad = 20;
  x.textAlign = "left";
  x.textBaseline = "top";
  x.font = `400 13px ${font}`;
  const note = lines(x, m.note, CW - pad * 2, 3);
  const noteTop = PILL.y - 16 - note.length * 18;
  x.fillStyle = "rgba(255,255,255,.82)";
  note.forEach((l, i) => x.fillText(l, pad, noteTop + i * 18));
  x.font = `700 26px ${font}`;
  const title = lines(x, m.title, CW - pad * 2, 2);
  const titleTop = noteTop - 8 - title.length * 27;
  x.fillStyle = "#fff";
  title.forEach((l, i) => x.fillText(l, pad, titleTop + i * 27));
  x.font = `700 10.5px ${font}`;
  x.letterSpacing = "2.1px";
  x.fillStyle = "#ecc97a";
  x.fillText(m.fabric.toUpperCase(), pad, titleTop - 8 - 11);
  x.letterSpacing = "0px";
  // price + pill
  x.textBaseline = "middle";
  x.fillStyle = "#fff";
  x.font = `700 19px ${font}`;
  x.fillText(inr(m.price), pad, PILL.y + PILL.h / 2 + 0.5);
  roundRect(x, PILL.x - 2, PILL.y - 2, PILL.w + 4, PILL.h + 4, (PILL.h + 4) / 2);
  x.fillStyle = "rgba(212,162,76,.55)";
  x.fill();
  roundRect(x, PILL.x, PILL.y, PILL.w, PILL.h, PILL.h / 2);
  x.fillStyle = added ? "#2f6b43" : "#8a1c2e";
  x.fill();
  x.fillStyle = "#fff";
  x.textAlign = "center";
  x.font = `700 11px ${sans}`;
  x.letterSpacing = "1.5px";
  x.fillText(added ? "ADDED ✓" : "ADD TO CART +", PILL.x + PILL.w / 2 + 0.75, PILL.y + PILL.h / 2 + 0.5);
  x.letterSpacing = "0px";
}
export default function MuseLens({ apiRef, onIndex, onAdd, bend = 0.55 }) {
  const n = MUSES.length;
  const rootRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const [index, setIndex] = React.useState(Math.floor(n / 2));
  const [settled, setSettled] = React.useState(false);
  const [box, setBox] = React.useState({ w: 0, h: 0, cw: 0, ch: 0 });
  const [noGL, setNoGL] = React.useState(false);
  const [added, setAdded] = React.useState(-1);
  const flash = React.useRef(() => {});
  const onIndexRef = React.useRef(onIndex);
  onIndexRef.current = onIndex;
  const start = Math.floor(n / 2);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: true, alpha: true });
    if (!gl) {
      setNoGL(true);
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prog = gl.createProgram();
    gl.attachShader(prog, shader(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn("MuseLens: " + gl.getProgramInfoLog(prog));
      setNoGL(true);
      return;
    }
    gl.useProgram(prog);
    const mesh = grid(36, 12);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = {};
    for (const k of ["uRes", "uSize", "uX", "uBend", "uVel", "uIntro", "uTex", "uReady"]) u[k] = gl.getUniformLocation(prog, k);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    let disposed = false;
    const sans = getComputedStyle(document.body).fontFamily || "sans-serif";
    const serifVar = getComputedStyle(document.documentElement).getPropertyValue("--font-source-serif").trim();
    const font = `${serifVar ? serifVar + ", " : ""}Georgia, "Times New Roman", serif`;
    const tex = MUSES.map((m, i) => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([40, 18, 24, 255]));
      for (const [p, v] of [
        [gl.TEXTURE_MIN_FILTER, gl.LINEAR],
        [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
        [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE],
        [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE],
      ])
        gl.texParameteri(gl.TEXTURE_2D, p, v);
      const art = document.createElement("canvas");
      const entry = { t, art, img: null, ready: false };
      const upload = (isAdded) => {
        if (disposed) return;
        paint(art, m, i + 1, entry.img, font, sans, isAdded);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, art);
        entry.ready = true;
        kick();
      };
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.onload = () => {
        entry.img = img;
        upload(false);
      };
      img.src = un(m.img, 700);
      return Object.assign(entry, { upload });
    });
    // repaint once the web font is in, so the painted text matches the page
    const repaint = () => tex.forEach((e) => e.img && e.upload(false));
    if (document.fonts) {
      Promise.all([document.fonts.load(`700 26px ${font}`), document.fonts.load(`400 13px ${font}`)])
        .catch(() => {})
        .then(() => document.fonts.ready)
        .then(repaint);
    }
    flash.current = (i) => {
      tex[i].upload(true);
      setAdded(i);
      window.setTimeout(() => {
        tex[i].upload(false);
        setAdded((a) => (a === i ? -1 : a));
      }, 1700);
    };
    let W = 1,
      H = 1,
      dpr = 1,
      cw = 1,
      ch = 1,
      gap = 1;
    let pos = start,
      vel = 0,
      target = start;
    let intro = reduced.matches ? 1 : 0;
    let introStart = -1;
    let dragging = false,
      dragX = 0,
      dragPos = 0,
      lastX = 0,
      lastT = 0,
      flick = 0,
      moved = false;
    let raf = 0,
      last = 0,
      visible = true,
      current = start,
      wasSettled = false;
    const resize = (w, h) => {
      W = Math.max(1, w);
      H = Math.max(1, h);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      [cw, ch] = cardSize(W, H);
      // wide screens: seven cards across (the centre one and three each side), evenly spread; narrow screens keep a loose row
      gap = W < 900 ? cw * 0.14 : Math.max(8, (W / 2 - cw / 2) / 3 - cw);
      gl.viewport(0, 0, canvas.width, canvas.height);
      setBox({ w: W, h: H, cw, ch });
      kick();
    };
    const draw = () => {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(u.uRes, W, H);
      gl.uniform2f(u.uSize, cw, ch);
      gl.uniform1f(u.uBend, bend);
      gl.uniform1f(u.uVel, reduced.matches ? 0 : Math.max(-1, Math.min(1, vel * 0.12)));
      const step = cw + gap;
      for (let i = 0; i < n; i++) {
        const d = offsetOf(i, pos, n);
        const x = d * step;
        if (Math.abs(x) > W * 0.5 + step * 1.5) continue;
        const t = Math.max(0, Math.min(1, (intro - Math.abs(d) * 0.12) / 0.6));
        gl.bindTexture(gl.TEXTURE_2D, tex[i].t);
        gl.uniform1f(u.uX, x);
        gl.uniform1f(u.uIntro, 1 - Math.pow(1 - t, 3));
        gl.uniform1f(u.uReady, tex[i].ready ? 1 : 0);
        gl.drawArrays(gl.TRIANGLES, 0, mesh.length / 2);
      }
    };
    const frame = (now) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      if (intro < 1) {
        if (introStart < 0) introStart = now;
        intro = Math.min(1.5, (now - introStart) / 1100);
        if (intro >= 1.5) intro = 1;
      }
      if (!dragging) {
        if (reduced.matches) {
          pos = target;
          vel = 0;
        } else [pos, vel] = springStep(pos, vel, target, dt);
      }
      const idx = wrap(Math.round(pos), n);
      if (idx !== current) {
        current = idx;
        setIndex(idx);
        onIndexRef.current?.(idx);
      }
      draw();
      const rest = !dragging && Math.abs(target - pos) < 0.0005 && Math.abs(vel) < 0.001 && (intro >= 1 || reduced.matches);
      // the real button over the centre card is live only while the card is (nearly) still
      const still = !dragging && Math.abs(target - pos) < 0.04 && Math.abs(vel) < 0.15 && intro >= 1;
      if (still !== wasSettled) {
        wasSettled = still;
        setSettled(still);
      }
      if (rest) {
        pos = target;
        draw();
        last = 0;
      } else if (visible) raf = requestAnimationFrame(frame);
    };
    function kick() {
      if (!raf && visible && !disposed) raf = requestAnimationFrame(frame);
    }
    const go = (dir) => {
      target = Math.round(target) + dir;
      kick();
    };
    apiRef.current = {
      go,
      to: (i) => {
        let d = i - wrap(Math.round(target), n);
        if (d > n / 2) d -= n;
        if (d < -n / 2) d += n;
        go(d);
      },
    };
    /** which card sits under a pointer, using the same lens maths as the vertex shader */
    const cardAt = (clientX, clientY) => {
      const r = canvas.getBoundingClientRect();
      const px_ = clientX - r.left,
        py = clientY - r.top;
      const step = cw + gap;
      for (let i = 0; i < n; i++) {
        const d = offsetOf(i, pos, n);
        const nx = (d * step) / (W / 2);
        const xc = Math.max(-1.4, Math.min(1.4, nx));
        const sx = W / 2 + nx * (1 - 0.06 * bend * xc * xc) * (W / 2);
        const hw = (cw / 2) * (1 - 0.06 * bend * xc * xc);
        const hh = (ch / 2) * (1 + bend * xc * xc);
        if (Math.abs(px_ - sx) <= hw && Math.abs(py - H / 2) <= hh) return { i, d };
      }
      return null;
    };
    const onDown = (e) => {
      if (e.button !== 0) return;
      dragging = true;
      moved = false;
      dragX = lastX = e.clientX;
      lastT = e.timeStamp;
      dragPos = pos;
      flick = 0;
      canvas.setPointerCapture(e.pointerId);
      kick();
    };
    const onMove = (e) => {
      if (!dragging) return;
      if (Math.abs(e.clientX - dragX) > 6) moved = true;
      const step = cw + gap;
      const p = dragPos - (e.clientX - dragX) / step;
      const dts = Math.max(1, e.timeStamp - lastT) / 1000;
      flick = flick * 0.6 + (-(e.clientX - lastX) / step / dts) * 0.4;
      vel = flick;
      lastX = e.clientX;
      lastT = e.timeStamp;
      pos = p;
      kick();
    };
    const onUp = (e) => {
      if (!dragging) return;
      dragging = false;
      if (!moved && e.type === "pointerup") {
        // a tap: a side card comes to the front
        const hit = cardAt(e.clientX, e.clientY);
        if (hit && Math.round(hit.d) !== 0) {
          target = Math.round(pos) + Math.round(hit.d);
          vel = 0;
          kick();
          return;
        }
      }
      target = restFor(pos, flick);
      vel = flick;
      kick();
    };
    const onKey = (e) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else return;
      e.preventDefault();
    };
    let wheelLock = false;
    let wheelTimer = 0;
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 12) return;
      e.preventDefault();
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => (wheelLock = false), 160);
      if (wheelLock) return;
      wheelLock = true;
      go(e.deltaX > 0 ? 1 : -1);
    };
    const onMotion = () => kick();
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("keydown", onKey);
    reduced.addEventListener("change", onMotion);
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      resize(r.width, r.height);
    });
    ro.observe(root);
    const io = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) kick();
    });
    io.observe(root);
    return () => {
      disposed = true;
      apiRef.current = null;
      cancelAnimationFrame(raf);
      window.clearTimeout(wheelTimer);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      root.removeEventListener("keydown", onKey);
      reduced.removeEventListener("change", onMotion);
      for (const t of tex) gl.deleteTexture(t.t);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [bend]);
  const m = MUSES[index];
  return (
    <div
      ref={rootRef}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Ten silks, ten muses: drag, or use the arrow keys"
      className="relative w-full select-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
      style={{ height: "clamp(460px, 34vw, 560px)" }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 block h-full w-full cursor-grab touch-pan-y active:cursor-grabbing"
      />
      {noGL && (
        <img
          src={un(m.img, 700)}
          alt={m.title}
          className="absolute left-1/2 top-1/2 w-[min(62vw,310px)] -translate-x-1/2 -translate-y-1/2 rounded-[26px] object-cover"
        />
      )}

      {/* the live twin of the painted card in the middle: real buttons over the flat centre card */}
      {box.cw > 0 && (
        <div
          className="pointer-events-none absolute"
          style={{ left: box.w / 2 - box.cw / 2, top: box.h / 2 - box.ch / 2, width: box.cw, height: box.ch }}
        >
          <button
            type="button"
            tabIndex={settled || noGL ? 0 : -1}
            onClick={() => {
              onAdd(m);
              flash.current(index);
            }}
            aria-label={`Add ${m.title} to cart, ${inr(m.price)}`}
            className="absolute rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-white"
            style={{
              left: `${(PILL.x / CW) * 100}%`,
              top: `${(PILL.y / CH) * 100}%`,
              width: `${(PILL.w / CW) * 100}%`,
              height: `${(PILL.h / CH) * 100}%`,
              pointerEvents: settled || noGL ? "auto" : "none",
              cursor: "pointer",
            }}
          >
            <span className="sr-only">{added === index ? "Added" : "Add to cart"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
