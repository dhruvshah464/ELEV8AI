"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScoreDisplayProps {
  score: number;
  maxScore: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getScoreGrade(score: number, max: number): string {
  const pct = score / max;
  if (pct >= 0.9) return "A";
  if (pct >= 0.8) return "B";
  if (pct >= 0.65) return "C";
  if (pct >= 0.5) return "D";
  return "F";
}

function getScoreColor(score: number, max: number): string {
  const pct = score / max;
  if (pct >= 0.8) return "kriya-score-high";
  if (pct >= 0.5) return "kriya-score-mid";
  return "kriya-score-low";
}

const sizeClasses = {
  sm: "text-3xl",
  md: "text-5xl",
  lg: "text-7xl",
};

const gradeSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
};

export function ScoreDisplay({
  score,
  maxScore,
  label,
  size = "md",
  className,
}: ScoreDisplayProps) {
  const grade = getScoreGrade(score, maxScore);
  const colorClass = getScoreColor(score, maxScore);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        className="relative flex items-baseline gap-1"
      >
        <motion.span
          className={cn(
            sizeClasses[size],
            colorClass,
            "font-display font-semibold tracking-tighter tabular-nums kriya-glow-text"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {score.toFixed(1)}
        </motion.span>
        <span className={cn("text-slate-500 font-medium", gradeSizeClasses[size])}>
          /{maxScore}
        </span>
      </motion.div>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-bold tracking-wide",
            colorClass,
            "border-current/20 bg-current/10"
          )}
          style={{
            borderColor: `hsl(var(--${colorClass}) / 0.2)`,
            backgroundColor: `hsl(var(--${colorClass}) / 0.1)`,
          }}
        >
          {grade}
        </span>
        {label && (
          <span className="text-xs text-slate-500">{label}</span>
        )}
      </div>
    </div>
  );
}
