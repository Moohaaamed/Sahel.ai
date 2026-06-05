import { useEffect, useRef } from 'react';

export default function InteractiveDots({ color = 'rgba(0, 94, 164, 0.5)', count = 120, className = '' }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let w, h;

    const dots = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: 1.5 + Math.random() * 2,
      alpha: 0.2 + Math.random() * 0.4,
    }));

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      ctx.clearRect(0, 0, w, h);

      for (const dot of dots) {
        const dx = (mouseRef.current.x / w) - dot.x;
        const dy = (mouseRef.current.y / h) - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repelRadius = 0.12;

        if (dist < repelRadius && dist > 0.001) {
          const force = (repelRadius - dist) / repelRadius;
          dot.vx -= (dx / dist) * force * 0.02;
          dot.vy -= (dy / dist) * force * 0.02;
        }

        dot.vx += (Math.random() - 0.5) * 0.01;
        dot.vy += (Math.random() - 0.5) * 0.01;
        dot.vx *= 0.96;
        dot.vy *= 0.96;
        dot.x += dot.vx * 0.008;
        dot.y += dot.vy * 0.008;

        if (dot.x < 0) { dot.x = 0; dot.vx *= -0.5; }
        if (dot.x > 1) { dot.x = 1; dot.vx *= -0.5; }
        if (dot.y < 0) { dot.y = 0; dot.vy *= -0.5; }
        if (dot.y > 1) { dot.y = 1; dot.vy *= -0.5; }

        const px = dot.x * w;
        const py = dot.y * h;
        ctx.beginPath();
        ctx.arc(px, py, dot.r, 0, Math.PI * 2);
        ctx.fillStyle = color.replace('0.5', String(dot.alpha));
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    function onMove(e) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }
    function onLeave() {
      mouseRef.current = { x: -9999, y: -9999 };
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, [color, count]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
    />
  );
}
