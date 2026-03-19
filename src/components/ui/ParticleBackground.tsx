import { useEffect, useRef } from 'react';
import { animate, random } from 'animejs';

export function ParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const particles: HTMLDivElement[] = [];
    const particleCount = 30;

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle absolute rounded-full bg-primary-500/20';

      const size = Math.random() * 4 + 2;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;

      containerRef.current.appendChild(particle);
      particles.push(particle);
    }

    // Animate particles
    particles.forEach((particle, i) => {
      animate(particle, {
        translateX: () => random(-100, 100),
        translateY: () => random(-100, 100),
        opacity: [
          { value: Math.random() * 0.5 + 0.2, duration: 2000 },
          { value: 0, duration: 2000 }
        ],
        scale: [
          { value: 1, duration: 2000 },
          { value: 0, duration: 2000 }
        ],
        duration: 4000,
        delay: i * 100,
        loop: true,
        easing: 'inOutQuad',
      });
    });

    return () => {
      particles.forEach((p) => p.remove());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
    />
  );
}
