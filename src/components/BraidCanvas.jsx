import { useEffect, useRef } from "react";
import * as THREE from "three";
import { silkCanvas } from "@/lib/silk";
const N = 220; // segments along each ribbon
const lerp = (a, b, t) => a + (b - a) * t;
/**
 * Three ribbons of silk. Empty slots are thin waiting threads; each chosen silk unspools as a textured
 * ribbon from the left, and once all three are in they tighten into a braid ("woven as one").
 */
export default function BraidCanvas({ picks }) {
  const host = useRef(null);
  const picksRef = useRef(picks);
  picksRef.current = picks;
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // no WebGL: the page still works, just without the ribbons
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 9);
    const group = new THREE.Group();
    scene.add(group);
    let W = 14; // world width, kept equal to the visible width
    const tex = new Map();
    const texFor = (s) => {
      let t = tex.get(s.id);
      if (!t) {
        t = new THREE.CanvasTexture(silkCanvas(s, 256));
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        tex.set(s.id, t);
      }
      return t;
    };
    const idx = [];
    for (let i = 0; i < N; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const strands = [0, 1, 2].map(() => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array((N + 1) * 2 * 3), 3));
      geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array((N + 1) * 2 * 2), 2));
      geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array((N + 1) * 2 * 3), 3));
      geo.setIndex(idx);
      const uv = geo.getAttribute("uv");
      for (let i = 0; i <= N; i++) {
        uv.setXY(i * 2, (i / N) * 5, 0);
        uv.setXY(i * 2 + 1, (i / N) * 5, 1);
      }
      const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      mesh.visible = false;
      group.add(mesh);
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array((N + 1) * 3), 3));
      const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x8b93a1, transparent: true, opacity: 0.55 }));
      line.frustumCulled = false;
      group.add(line);
      return { mesh, line, geo, lineGeo, mat, grow: 0, silkId: null };
    });
    const resize = () => {
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const visH = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
      W = visH * camera.aspect * 1.12;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 });
    io.observe(el);
    const mouse = { x: 0, y: 0 };
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      mouse.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let braid = 0;
    let raf = 0;
    const clock = new THREE.Clock();
    let time = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      if (!still) time += dt;
      const t = time;
      const cur = picksRef.current;
      const count = cur.filter(Boolean).length;
      braid += ((count === 3 ? 1 : 0) - braid) * Math.min(1, dt * 2.2);
      const R = lerp(1.15, 0.52, braid);
      const turns = lerp(0.85, 3.6, braid);
      const half = lerp(0.8, 0.46, braid);
      strands.forEach((s, k) => {
        const pick = cur[k];
        // swap texture when the slot's silk changes
        const id = pick?.id ?? null;
        if (id !== s.silkId) {
          s.silkId = id;
          if (pick) {
            s.mat.map = texFor(pick);
            s.mat.needsUpdate = true;
            s.grow = Math.min(s.grow, 0.05);
          }
        }
        const target = pick ? 1 : 0;
        s.grow += (target - s.grow) * Math.min(1, dt * 1.7);
        if (Math.abs(target - s.grow) < 0.002) s.grow = target;
        const pos = s.geo.getAttribute("position");
        const col = s.geo.getAttribute("color");
        const lp = s.lineGeo.getAttribute("position");
        const phase = (k * Math.PI * 2) / 3;
        for (let i = 0; i <= N; i++) {
          const u = i / N;
          const uu = Math.min(u, s.grow);
          const x = (uu - 0.5) * W;
          const th = uu * turns * Math.PI * 2 + phase + t * 0.32;
          const wob = Math.sin(uu * 5.2 + t * 0.55 + k * 1.9) * (1 - braid) * 0.75;
          const cy = R * Math.sin(th) + wob + 0.35;
          const cz = R * Math.cos(th);
          const wy = Math.cos(th) * half;
          const wz = -Math.sin(th) * half;
          pos.setXYZ(i * 2, x, cy + wy, cz + wz);
          pos.setXYZ(i * 2 + 1, x, cy - wy, cz - wz);
          // facing-the-light shading so the twist reads as depth
          const shade = 0.58 + 0.42 * Math.max(0, Math.sin(th) * 0.45 + Math.cos(th) * 0.8);
          col.setXYZ(i * 2, shade, shade, shade);
          col.setXYZ(i * 2 + 1, shade, shade, shade);
          // waiting thread
          const lx = (u - 0.5) * W;
          const ly = Math.sin(u * 4.4 + t * 0.3 + phase) * (0.9 - braid * 0.5) * (1 - 0.2 * k) + 0.35;
          lp.setXYZ(i, lx, ly, 0);
        }
        pos.needsUpdate = true;
        col.needsUpdate = true;
        lp.needsUpdate = true;
        s.mesh.visible = s.grow > 0.004;
        s.line.material.opacity = 0.55 * (1 - Math.min(1, s.grow * 1.4));
      });
      group.rotation.y += (mouse.x * 0.16 - group.rotation.y) * 0.04;
      group.rotation.x += (mouse.y * 0.06 - group.rotation.x) * 0.04;
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      ro.disconnect();
      io.disconnect();
      strands.forEach((s) => {
        s.geo.dispose();
        s.lineGeo.dispose();
        s.mat.dispose();
        s.line.material.dispose();
      });
      tex.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return <div ref={host} className="absolute inset-0" aria-hidden />;
}
