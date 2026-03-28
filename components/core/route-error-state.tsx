"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RouteErrorStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
}

export function RouteErrorState({
  title,
  description,
  onRetry,
}: RouteErrorStateProps) {
  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className="glass-panel-strong relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 p-8 sm:p-10"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.24),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.16),transparent_20%)]" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-amber-100">
            <Sparkles className="h-3.5 w-3.5" />
            Recovery mode
          </div>

          <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-amber-400/20 to-rose-400/20 text-amber-100 shadow-[0_20px_60px_rgba(251,191,36,0.12)]">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <h1 className="mt-6 text-3xl font-semibold text-white sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
            {description}
          </p>

          {onRetry ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <Button type="button" size="lg" onClick={onRetry}>
                <RefreshCw className="h-4 w-4" />
                Reload experience
              </Button>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
