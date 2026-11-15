import { useRef } from "react";

/**
 * Pointer-driven 3D tilt using CSS transforms only (no re-renders, no 3D library).
 * Attach `ref` and spread `handlers` onto the element to tilt.
 */
export default function useTilt({ max = 8, scale = 1.02, lift = 0 } = {}) {
  const ref = useRef(null);

  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onMouseMove = (e) => {
    const el = ref.current;
    if (!el || reduced) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5; // -0.5 .. 0.5
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transition = "transform 80ms linear";
    el.style.transform = `perspective(1000px) translateY(${-lift}px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(
      2
    )}deg) scale(${scale})`;
    // Used by the glare/shadow layers inside the card.
    el.style.setProperty("--mx", `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${((y + 0.5) * 100).toFixed(1)}%`);
  };

  const onMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)";
    el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
  };

  return { ref, handlers: { onMouseMove, onMouseLeave } };
}
