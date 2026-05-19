"use client";

import { motion } from "framer-motion";

const particles = Array.from({ length: 56 }, (_, index) => ({
  id: index,
  left: `${(index * 37) % 100}%`,
  top: `${(index * 53) % 100}%`,
  delay: (index % 9) * 0.25,
  size: index % 5 === 0 ? 3 : 2
}));

export function ParticleField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-radial-grid bg-[length:100%_100%,48px_48px,48px_48px] opacity-80" />
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full bg-cyan-200/80 shadow-[0_0_14px_rgba(103,232,249,0.65)]"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size
          }}
          animate={{ opacity: [0.15, 0.9, 0.15], y: [0, -18, 0] }}
          transition={{ duration: 5 + (particle.id % 4), repeat: Infinity, delay: particle.delay }}
        />
      ))}
      <motion.div
        className="absolute left-1/2 top-28 h-72 w-72 -translate-x-1/2 rounded-full border border-cyan-200/20"
        animate={{ scale: [1, 1.16, 1], opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
    </div>
  );
}
