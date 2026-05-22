import { useEffect, useRef, useState } from "react";

// Hook untuk trigger animasi saat elemen masuk viewport
export function useAnimateIn(delay = 0) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const style = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 0.5s ease ${delay}s, transform 0.5s cubic-bezier(.22,1,.36,1) ${delay}s`,
  };

  return [ref, style];
}

// Hook untuk counter animasi
export function useCounter(target, duration = 1200, trigger = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger || target === "-" || target == null) return;
    const num = parseInt(target);
    if (isNaN(num)) return;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(ease * num));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, trigger]);
  return target === "-" ? "-" : count;
}
