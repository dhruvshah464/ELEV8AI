"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ExternalLink, FileText, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CareerTrackerEntry, CareerOpsStatus } from "@/types";

interface TrackerTableProps {
  entries: CareerTrackerEntry[];
  onViewReport?: (reportLink: string) => void;
  className?: string;
}

const STATUS_STYLES: Record<CareerOpsStatus, { bg: string; text: string; dot: string }> = {
  Evaluated: { bg: "bg-blue-400/10", text: "text-blue-300", dot: "bg-blue-400" },
  Applied: { bg: "bg-cyan-400/10", text: "text-cyan-300", dot: "bg-cyan-400" },
  Responded: { bg: "bg-emerald-400/10", text: "text-emerald-300", dot: "bg-emerald-400" },
  Interview: { bg: "bg-violet-400/10", text: "text-violet-300", dot: "bg-violet-400" },
  Offer: { bg: "bg-amber-400/10", text: "text-amber-300", dot: "bg-amber-400" },
  Rejected: { bg: "bg-rose-400/10", text: "text-rose-300", dot: "bg-rose-400" },
  Discarded: { bg: "bg-slate-400/10", text: "text-slate-400", dot: "bg-slate-500" },
  SKIP: { bg: "bg-slate-400/10", text: "text-slate-500", dot: "bg-slate-600" },
};

const STATUS_ORDER: CareerOpsStatus[] = [
  "Interview",
  "Offer",
  "Responded",
  "Applied",
  "Evaluated",
  "Rejected",
  "Discarded",
  "SKIP",
];

export function TrackerTable({ entries, onViewReport, className }: TrackerTableProps) {
  const [statusFilter, setStatusFilter] = useState<CareerOpsStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "score" | "status">("date");

  const filteredAndSorted = useMemo(() => {
    let result = [...entries];

    if (statusFilter !== "all") {
      result = result.filter((e) => e.status === statusFilter);
    }

    result.sort((a, b) => {
      if (sortBy === "date") return b.date.localeCompare(a.date);
      if (sortBy === "score") {
        const scoreA = parseFloat(a.score) || 0;
        const scoreB = parseFloat(b.score) || 0;
        return scoreB - scoreA;
      }
      // status sort
      return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    });

    return result;
  }, [entries, statusFilter, sortBy]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: entries.length };
    for (const entry of entries) {
      counts[entry.status] = (counts[entry.status] || 0) + 1;
    }
    return counts;
  }, [entries]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Filter className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Filter</span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {(["all", ...STATUS_ORDER] as const).map((status) => {
            const count = statusCounts[status] || 0;
            if (status !== "all" && count === 0) return null;
            const isActive = statusFilter === status;
            const style = status !== "all" ? STATUS_STYLES[status] : null;

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-all",
                  isActive
                    ? "bg-white/[0.08] text-white border border-white/[0.08]"
                    : "text-slate-500 hover:text-slate-300 border border-transparent"
                )}
              >
                {style && (
                  <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                )}
                <span className="capitalize">{status === "all" ? "All" : status}</span>
                <span className="text-slate-600">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-1 rounded-lg border border-white/[0.04] bg-white/[0.02] p-0.5">
          {(["date", "score", "status"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-medium transition-all capitalize",
                sortBy === s
                  ? "bg-white/[0.06] text-white"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Entries */}
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {filteredAndSorted.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-dashed border-white/[0.05] bg-white/[0.01] px-6 py-12 text-center"
            >
              <p className="text-sm text-slate-500">No entries match the current filter.</p>
            </motion.div>
          ) : (
            filteredAndSorted.map((entry) => {
              const style = STATUS_STYLES[entry.status] ?? STATUS_STYLES.Evaluated;
              const scoreNum = parseFloat(entry.score) || 0;

              return (
                <motion.div
                  key={`${entry.number}-${entry.company}`}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="group flex items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-white/[0.02] border border-transparent hover:border-white/[0.03]"
                >
                  {/* Number */}
                  <span className="w-8 text-right text-xs tabular-nums text-slate-600 font-mono">
                    {String(entry.number).padStart(3, "0")}
                  </span>

                  {/* Score bar */}
                  <div className="w-16 flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          scoreNum >= 4 ? "bg-emerald-400" :
                          scoreNum >= 3 ? "bg-amber-400" :
                          "bg-rose-400"
                        )}
                        style={{ width: `${(scoreNum / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 tabular-nums w-7">
                      {entry.score}
                    </span>
                  </div>

                  {/* Company + Role */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {entry.company}
                      </p>
                      {entry.hasPdf && (
                        <span className="text-[10px] text-emerald-400">✅</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{entry.role}</p>
                  </div>

                  {/* Status */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-medium",
                      style.bg,
                      style.text
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                    {entry.status}
                  </span>

                  {/* Date */}
                  <span className="hidden sm:block text-xs text-slate-600 w-20 text-right">
                    {entry.date}
                  </span>

                  {/* Actions */}
                  {entry.reportLink && onViewReport && (
                    <button
                      onClick={() => onViewReport(entry.reportLink)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-white/[0.04]"
                      title="View report"
                    >
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between border-t border-white/[0.04] pt-3 text-xs text-slate-600">
        <span>{filteredAndSorted.length} entries</span>
        <span>
          Avg score:{" "}
          {filteredAndSorted.length > 0
            ? (
                filteredAndSorted.reduce((sum, e) => sum + (parseFloat(e.score) || 0), 0) /
                filteredAndSorted.length
              ).toFixed(1)
            : "—"}
          /5
        </span>
      </div>
    </div>
  );
}
