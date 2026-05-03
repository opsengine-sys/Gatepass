import { useEffect, useRef } from "react";

interface Props {
  className?: string;
  spacing?: number;
  dotRadius?: number;
  waveSpeed?: number;
  mouseRadius?: number;
}

export function DottedSurface({
  className,
  spacing = 28,
  dotRadius = 1.6,
  waveSpeed = 0.9,
  mouseRadius = 140,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const raf = useRef(0);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const rect = cv.getBoundingClientRect();
      const nw = Math.round(rect.width * dpr);
      const nh = Math.round(rect.height * dpr);
      if (nw === w && nh === h) return;
      w = nw; h = nh;
      cv.width = w; cv.height = h;
      ctx.scale(dpr, dpr);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    resize();

    const onMove = (e: MouseEvent) => {
      const rect = cv.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => { mouse.current = { x: -9999, y: -9999 }; };

    cv.parentElement?.addEventListener("mousemove", onMove);
    cv.parentElement?.addEventListener("mouseleave", onLeave);

    const t0 = performance.now();

    const frame = () => {
      resize();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const W = w / dpr, H = h / dpr;
      ctx.clearRect(0, 0, W, H);

      const t = (performance.now() - t0) / 1000;
      const mx = mouse.current.x, my = mouse.current.y;
      const cols = Math.ceil(W / spacing) + 1;
      const rows = Math.ceil(H / spacing) + 1;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * spacing;
          const y = r * spacing;

          // traveling wave from top-left diagonal
          const wave = Math.sin(c * 0.35 + r * 0.35 - t * waveSpeed);

          // mouse proximity ripple
          const dx = mx - x, dy = my - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, 1 - dist / mouseRadius);
          // secondary ripple ring spreading from mouse
          const ring = Math.max(0, Math.sin(dist * 0.08 - t * 4) * (influence * 0.6));

          const boost = influence * 2.5 + ring * 1.5;
          const rad = Math.max(0.3, dotRadius + wave * 0.7 + boost);

          // opacity varies with wave + mouse
          const baseAlpha = 0.13 + wave * 0.05;
          const alpha = Math.min(0.9, baseAlpha + influence * 0.6 + ring * 0.3);

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
      cv.parentElement?.removeEventListener("mousemove", onMove);
      cv.parentElement?.removeEventListener("mouseleave", onLeave);
    };
  }, [spacing, dotRadius, waveSpeed, mouseRadius]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
