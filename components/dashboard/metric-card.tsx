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
    <motion.div whileHover={{ y: -6, rotateX: 3 }} transition={{ duration: 0.2 }}>
      <Card className="overflow-hidden">
        <CardContent className="relative p-5">
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{title}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p>
              <p className="mt-2 text-sm text-slate-400">{detail}</p>
            </div>
            <div
              className={cn(
                "rounded-2xl border border-white/10 p-3 shadow-[0_12px_30px_rgba(4,8,20,0.28)]",
                accentClassName
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
