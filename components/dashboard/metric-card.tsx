"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  accentClassName: string;
}

export function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  accentClassName,
}: MetricCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -2 }} 
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="group relative"
    >
      <div className="flex flex-col gap-2 rounded-2xl p-5 border border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.03] transition-colors relative overflow-hidden backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center gap-3">
          <div className={cn("inline-flex items-center justify-center p-2 rounded-xl border border-white/5", accentClassName)}>
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">{title}</p>
        </div>
        <p className="mt-2 text-3xl font-medium tracking-tight text-white">{value}</p>
        <p className="text-sm text-slate-500">{detail}</p>
      </div>
    </motion.div>
  );
}
