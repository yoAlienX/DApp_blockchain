import { useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';

export default function DocumentParticles() {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let rafId;
    const pointer = { x: -9999, y: -9999 };

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      width = rect ? rect.width : window.innerWidth;
      height = rect ? rect.height : 520;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const symbols = ['0x', 'SHA', '✓', '§', '#'];
    const count = Math.min(34, Math.max(18, Math.floor(width / 38)));
    const nodes = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      size: 2.2 + Math.random() * 2.2,
      kind: i % 5 === 0 ? 'doc' : i % 4 === 0 ? 'glyph' : 'node',
      glyph: symbols[i % symbols.length]
    }));

    const onMove = event => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    };
    const onLeave = () => { pointer.x = -9999; pointer.y = -9999; };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerleave', onLeave);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const nodeColor = isDark ? 'rgba(129, 140, 248, 0.55)' : 'rgba(79, 70, 229, 0.35)';
      const lineBase = isDark ? '129, 140, 248' : '79, 70, 229';
      const glyphColor = isDark ? 'rgba(165, 180, 252, 0.45)' : 'rgba(79, 70, 229, 0.28)';

      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];
        if (!prefersReduced) {
          a.x += a.vx;
          a.y += a.vy;
          if (a.x < 0 || a.x > width) a.vx *= -1;
          if (a.y < 0 || a.y > height) a.vy *= -1;

          const dx = a.x - pointer.x;
          const dy = a.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0 && dist < 110) {
            a.x += (dx / dist) * 0.7;
            a.y += (dy / dist) * 0.7;
          }
        }

        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 135) {
            const alpha = (1 - dist / 135) * (isDark ? 0.22 : 0.14);
            ctx.strokeStyle = `rgba(${lineBase}, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        if (a.kind === 'doc') {
          ctx.strokeStyle = nodeColor;
          ctx.lineWidth = 1.2;
          ctx.strokeRect(a.x - 5, a.y - 6, 10, 12);
        } else if (a.kind === 'glyph') {
          ctx.fillStyle = glyphColor;
          ctx.font = '600 10px ui-monospace, monospace';
          ctx.fillText(a.glyph, a.x - 6, a.y + 3);
        } else {
          ctx.fillStyle = nodeColor;
          ctx.beginPath();
          ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!prefersReduced) rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
