import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
const Ctx = createContext(null);
export function StoreProvider({ children }) {
  const [bag, setBag] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const say = useCallback((msg) => {
    setToast(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2200);
  }, []);
  const value = useMemo(
    () => ({
      bag,
      wishlist,
      toast,
      addToBag: (id, label) => {
        setBag((b) => [...b, id]);
        say(label ? `${label} added to bag` : "Added to bag");
      },
      addMany: (ids, label) => {
        setBag((b) => [...b, ...ids]);
        say(label);
      },
      toggleWish: (id) => setWishlist((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id])),
      isWished: (id) => wishlist.includes(id),
    }),
    [bag, wishlist, toast, say],
  );
  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className={`pointer-events-none fixed bottom-16 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-2xl transition-all duration-300 ${toast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
      >
        {toast}
      </div>
    </Ctx.Provider>
  );
}
export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used inside StoreProvider");
  return c;
}
