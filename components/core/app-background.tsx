"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const particles = Array.from({ length: 14 }).map((_, index) => ({
  id: index,
  top: `${8 + ((index * 13) % 72)}%`,
  left: `${6 + ((index * 17) % 84)}%`,
  duration: 16 + (index % 6) * 3,
  delay: (index % 5) * 0.8,
}));

export function AppBackground() {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      setPointer({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(122,92,255,0.18),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(0,212,255,0.14),transparent_24%),linear-gradient(180deg,#0b0f19_0%,#121826_48%,#0b1020_100%)]" />
      <div className="absolute inset-0 bg-grid-premium opacity-40" />
      <motion.div
        animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.08, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 left-1/3 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(117,87,255,0.28),transparent_60%)] blur-3xl"
      />
      <motion.div
        animate={{ opacity: [0.25, 0.45, 0.25], scale: [1.05, 0.95, 1.05] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10rem] right-[-6rem] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(25,197,255,0.18),transparent_60%)] blur-3xl"
      />

      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute h-1.5 w-1.5 rounded-full bg-cyan-300/40 shadow-[0_0_24px_rgba(34,211,238,0.6)]"
          style={{ top: particle.top, left: particle.left }}
          animate={{ y: [0, -18, 0], opacity: [0.15, 0.6, 0.15] }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.delay,
          }}
        />
      ))}

      <motion.div
        className="absolute h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(122,92,255,0.28),rgba(122,92,255,0)_68%)] blur-2xl"
        animate={{
          x: pointer.x - 80,
          y: pointer.y - 80,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 160, mass: 0.6 }}
      />
    </div>
  );
}
