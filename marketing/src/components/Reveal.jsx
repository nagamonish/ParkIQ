import { useEffect, useRef, useState } from "react";

// Apple-style "fade + rise on scroll into view". Respects reduced-motion.
// When motion is reduced (or ?reveal=all is set for screenshots/printing) the
// final state is painted on the very first frame — no animation to wait on.
function shouldRenderStatic() {
  if (typeof window === "undefined") return false;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  return reduced || window.location.search.includes("reveal=all");
}

export function Reveal({ children, as: Tag = "div", className = "", delay = 0, style }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(shouldRenderStatic);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return undefined;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const forced = window.location.search.includes("reveal=all");
    if (reduced || forced) {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ ...style, transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Tag>
  );
}
