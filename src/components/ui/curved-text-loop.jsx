import { Fragment, useRef, useEffect, useState, useMemo, useId } from "react";
const DEFAULT_TEXT = "fill-white text-[4rem] font-black uppercase tracking-tight";
export const CurvedLoop = ({
  marqueeText = "CURVED MARQUEE • INTERACTIVE LOOP • 21ST.DEV • ",
  speed = 2,
  className,
  highlights = [],
  highlightClassName,
  curveAmount = 250,
  baseY = 40,
  direction = "left",
  interactive = true,
}) => {
  const text = useMemo(() => {
    const hasTrailing = /\s| $/.test(marqueeText);
    return (hasTrailing ? marqueeText.replace(/\s+$/, "") : marqueeText) + " ";
  }, [marqueeText]);
  const measureRef = useRef(null);
  const textPathRef = useRef(null);
  const pathRef = useRef(null);
  const [spacing, setSpacing] = useState(0);
  const [offset, setOffset] = useState(0);
  const uid = useId();
  const pathId = `curve-${uid.replace(/:/g, "")}`;
  // control point at the middle of the path so the curve is symmetric (the middle sits curveAmount / 2 off the ends)
  const pathD = `M-100,${baseY} Q720,${baseY + curveAmount} 1540,${baseY}`;
  const textClass = className ?? DEFAULT_TEXT;
  const dragRef = useRef(false);
  const lastXRef = useRef(0);
  const dirRef = useRef(direction);
  const velRef = useRef(0);
  // the text cut into plain / highlighted runs (highlights may be a different weight, so measure the same runs we draw)
  const unit = useMemo(() => {
    const list = highlights.filter(Boolean);
    if (!list.length) return [{ t: text, hi: false }];
    const esc = (h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("(" + list.map(esc).join("|") + ")", "g");
    return text
      .split(re)
      .filter(Boolean)
      .map((t) => ({ t, hi: list.includes(t) }));
  }, [text, highlights.join("|")]);
  const runs = (copies) =>
    Array.from({ length: copies }, (_, c) => (
      <Fragment key={c}>
        {unit.map((r, i) =>
          r.hi ? (
            <tspan key={i} className={highlightClassName}>
              {r.t}
            </tspan>
          ) : (
            r.t
          ),
        )}
      </Fragment>
    ));
  const textLength = spacing;
  const copies = textLength ? Math.ceil(1800 / textLength) + 2 : 1;
  const ready = spacing > 0;
  useEffect(() => {
    if (measureRef.current) setSpacing(measureRef.current.getComputedTextLength());
  }, [text, textClass]);
  // fonts load late: measure again once they are in, otherwise the loop seam drifts
  useEffect(() => {
    let live = true;
    document.fonts?.ready.then(() => {
      if (live && measureRef.current) setSpacing(measureRef.current.getComputedTextLength());
    });
    return () => {
      live = false;
    };
  }, [text, textClass]);
  useEffect(() => {
    if (!spacing) return;
    if (textPathRef.current) {
      const initial = -spacing;
      textPathRef.current.setAttribute("startOffset", initial + "px");
      setOffset(initial);
    }
  }, [spacing]);
  useEffect(() => {
    if (!spacing || !ready) return;
    let frame = 0;
    const step = () => {
      if (!dragRef.current && textPathRef.current) {
        const delta = dirRef.current === "right" ? speed : -speed;
        const currentOffset = parseFloat(textPathRef.current.getAttribute("startOffset") || "0");
        let newOffset = currentOffset + delta;
        const wrapPoint = spacing;
        if (newOffset <= -wrapPoint) newOffset += wrapPoint;
        if (newOffset > 0) newOffset -= wrapPoint;
        textPathRef.current.setAttribute("startOffset", newOffset + "px");
        setOffset(newOffset);
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [spacing, speed, ready]);
  const onPointerDown = (e) => {
    if (!interactive) return;
    dragRef.current = true;
    lastXRef.current = e.clientX;
    velRef.current = 0;
    e.target.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!interactive || !dragRef.current || !textPathRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    velRef.current = dx;
    const currentOffset = parseFloat(textPathRef.current.getAttribute("startOffset") || "0");
    let newOffset = currentOffset + dx;
    const wrapPoint = spacing;
    if (newOffset <= -wrapPoint) newOffset += wrapPoint;
    if (newOffset > 0) newOffset -= wrapPoint;
    textPathRef.current.setAttribute("startOffset", newOffset + "px");
    setOffset(newOffset);
  };
  const endDrag = () => {
    if (!interactive) return;
    dragRef.current = false;
    dirRef.current = velRef.current > 0 ? "right" : "left";
  };
  const cursorStyle = interactive ? (dragRef.current ? "grabbing" : "grab") : "auto";
  return (
    <div
      className="relative flex w-full items-center justify-center overflow-hidden"
      style={{ visibility: ready ? "visible" : "hidden", cursor: cursorStyle }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    >
      <svg className="block aspect-[100/11] w-full select-none overflow-visible" viewBox="0 0 1440 160">
        <text
          ref={measureRef}
          xmlSpace="preserve"
          className={textClass}
          style={{ visibility: "hidden", opacity: 0, pointerEvents: "none" }}
        >
          {runs(1)}
        </text>
        <defs>
          <path ref={pathRef} id={pathId} d={pathD} fill="none" stroke="transparent" />
        </defs>
        {ready && (
          <text xmlSpace="preserve" className={textClass}>
            <textPath ref={textPathRef} href={`#${pathId}`} startOffset={offset + "px"} xmlSpace="preserve">
              {runs(copies)}
            </textPath>
          </text>
        )}
      </svg>
    </div>
  );
};
export default CurvedLoop;
