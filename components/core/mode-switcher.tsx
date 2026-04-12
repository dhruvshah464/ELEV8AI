"use client";

import { useKriyaMode, type KriyaMode } from "@/contexts/kriya-mode-context";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const modes: { key: KriyaMode; label: string; symbol: string; color: string }[] = [
  { key: "krishna", label: "Guidance", symbol: "◎", color: "text-amber-400" },
  { key: "vishnu", label: "Order", symbol: "◉", color: "text-blue-400" },
  { key: "shiva", label: "Transform", symbol: "◈", color: "text-violet-400" },
];

export function ModeSwitcher({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useKriyaMode();

  return (
    <div
      className={cn(
        "flex items-center rounded-xl border border-white/[0.04] bg-white/[0.02] p-1",
        compact ? "gap-0.5" : "gap-1"
      )}
    >
      {modes.map((m) => {
        const isActive = mode === m.key;
        return (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-300",
              isActive
                ? "text-white"
                : "text-slate-500 hover:text-slate-300"
            )}
            title={`${m.label} Mode`}
          >
            {isActive && (
              <motion.div
                layoutId="kriya-mode-indicator"
                className="absolute inset-0 rounded-lg bg-white/[0.08] border border-white/[0.06]"
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              />
            )}
            <span className={cn("relative z-10 text-sm", isActive && m.color)}>
              {m.symbol}
            </span>
            {!compact && (
              <span className="relative z-10">{m.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
