import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
/**
 * Looping, inline video that actually autoplays.
 * React does not reliably write the `muted` attribute, and browsers only allow autoplay when it is
 * present, so mute and play() are applied through the ref. The poster shows until the first frame
 * is really playing, then the video fades in.
 */
const AutoVideo = forwardRef(function AutoVideo({ src, poster, muted = true, className = "", label, onFail }, fwd) {
  const ref = useRef(null);
  useImperativeHandle(fwd, () => ref.current);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = muted;
    v.defaultMuted = true; // keeps the attribute present for autoplay policies
    v.play().catch(() => {
      /* autoplay refused (data saver / low-power mode): poster stays, user can still unmute-play */
    });
  }, [muted, src]);
  return (
    <>
      <img src={poster} alt="" className={className} aria-hidden />
      <video
        ref={ref}
        src={src}
        poster={poster}
        loop
        playsInline
        autoPlay
        preload="auto"
        aria-label={label}
        onPlaying={() => setLive(true)}
        onError={onFail}
        className={`${className} transition-opacity duration-1000 ${live ? "opacity-100" : "opacity-0"}`}
        style={{ position: "absolute", inset: 0 }}
      />
    </>
  );
});
export default AutoVideo;
