import { useEffect, useRef } from "react";

interface Props {
  className?: string;
  spacing?: number;
  dotRadius?: number;
  waveSpeed?: number;
  mouseRadius?: number;
  interactive?: boolean;
}

export function DottedSurface({
  className,
  spacing = 28,
  dotRadius = 1.6,
  waveSpeed = 0.9,
  mouseRadius = 140,
  interactive = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const raf = useRef(0);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = Math.min(devicePixelRatio || 1, 2);

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      const rect = cv.getBoundingClientRect();
      const nw = Math.round(rect.width * dpr);
      const nh = Math.round(rect.height * dpr);
      if (nw === w && nh === h) return;
      w = nw;
      h = nh;
      cv.width = w;
      cv.height = h;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    resize();

    const onMove = (e: PointerEvent) => {
      if (!interactive) return;
      const rect = cv.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => {
      mouse.current = { x: -9999, y: -9999 };
    };

    const target = cv.parentElement;
    target?.addEventListener("pointermove", onMove);
    target?.addEventListener("pointerleave", onLeave);

    const t0 = performance.now();

    const frame = () => {
      resize();
      const W = w / dpr;
      const H = h / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const t = (performance.now() - t0) / 1000;
      const mx = mouse.current.x;
      const my = mouse.current.y;
      const cols = Math.ceil(W / spacing) + 1;
      const rows = Math.ceil(H / spacing) + 1;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * spacing;
          const y = r * spacing;
          const wave = Math.sin(c * 0.35 + r * 0.35 - t * waveSpeed);
          const dx = mx - x;
          const dy = my - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influence = interactive ? Math.max(0, 1 - dist / mouseRadius) : 0;
          const ring = interactive ? Math.max(0, Math.sin(dist * 0.08 - t * 4) * influence * 0.6) : 0;
          const boost = influence * 2.5 + ring * 1.5;
          const rad = Math.max(0.3, dotRadius + wave * 0.7 + boost);
          const baseAlpha = 0.11 + wave * 0.05;
          const alpha = Math.min(0.92, baseAlpha + influence * 0.7 + ring * 0.3);

          ctx.beginPath();
          ctx.arc(x, y, rad, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(192,107,44,${alpha.toFixed(3)})`;
          ctx.fill();
        }
      }

      raf.current = requestAnimationFrame(frame);
    };

    raf.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
      target?.removeEventListener("pointermove", onMove);
      target?.removeEventListener("pointerleave", onLeave);
    };
  }, [spacing, dotRadius, waveSpeed, mouseRadius, interactive]);

  return <canvas ref={canvasRef} className={className} style={{ display: "block", width: "100%", height: "100%" }} />;
}
