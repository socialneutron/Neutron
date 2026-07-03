import { useEffect, useRef } from 'react';

export default function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Star configuration
    interface Star {
      x: number;
      y: number;
      size: number;
      opacity: number;
      velocity: number;
    }

    const stars: Star[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.2,
      opacity: Math.random() * 0.6 + 0.1,
      velocity: Math.random() * 0.03 + 0.005,
    }));

    // Mouse interactive glow
    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle dark gradient glow around mouse
      const gradient = ctx.createRadialGradient(
        mouseX,
        mouseY,
        10,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      gradient.addColorStop(0, 'rgba(20, 20, 20, 0.2)');
      gradient.addColorStop(0.5, 'rgba(5, 5, 5, 0.5)');
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Render star particles (monochrome/clean)
      stars.forEach((star) => {
        star.y += star.velocity;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }

        star.opacity += (Math.random() - 0.5) * 0.03;
        if (star.opacity < 0.05) star.opacity = 0.05;
        if (star.opacity > 0.8) star.opacity = 0.8;

        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      id="cosmic-canvas"
    />
  );
}
