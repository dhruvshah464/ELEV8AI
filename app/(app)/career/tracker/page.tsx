"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { TrackerTable } from "@/components/career/tracker-table";
import { useKriyaMode } from "@/contexts/kriya-mode-context";
import { cn } from "@/lib/utils";
import type { CareerTrackerEntry } from "@/types";

interface TrackerSummary {
  total: number;
  evaluated: number;
  applied: number;
  interviewing: number;
  offers: number;
  rejected: number;
  avgScore: string;
}

export default function TrackerPage() {
  const { mode } = useKriyaMode();
  const [entries, setEntries] = useState<CareerTrackerEntry[]>([]);
  const [summary, setSummary] = useState<TrackerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/career/tracker")
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries || []);
        setSummary(data.summary || null);
      })
      .catch(() => toast.error("Failed to load tracker data. Check your connection."))
      .finally(() => setLoading(false));
  }, []);

  const handleViewReport = (reportLink: string) => {
    // Extract slug from report link like "reports/001-company-2026-01-01.md"
    const slug = reportLink
      .replace(/^reports\//, "")
      .replace(/\.md$/, "");
    window.location.href = `/career/evaluate?report=${slug}`;
  };

  const modeMessages = {
    krishna: "Your journey unfolds in clarity. Every step has purpose.",
    vishnu: "Application intelligence. Structured. Precise. Complete.",
    shiva: "Watch uncertainty dissolve. Each update transforms your path.",
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-1"
      >
        <Link
          href="/career"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-4"
        >
          <ArrowLeft className="h-3 w-3" />
          Career Engine
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.04]">
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Tracker</h1>
            <p className="text-sm text-slate-500">{modeMessages[mode]}</p>
          </div>
        </div>
      </motion.div>

      {/* Summary Stats */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7"
        >
          {[
            { label: "Total", value: summary.total, color: "text-white" },
            { label: "Evaluated", value: summary.evaluated, color: "text-blue-400" },
            { label: "Applied", value: summary.applied, color: "text-cyan-400" },
            { label: "Interview", value: summary.interviewing, color: "text-violet-400" },
            { label: "Offers", value: summary.offers, color: "text-amber-400" },
            { label: "Rejected", value: summary.rejected, color: "text-rose-400" },
            { label: "Avg Score", value: `${summary.avgScore}/5`, color: "text-emerald-400" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 text-center transition-colors hover:bg-white/[0.03]"
            >
              <p className={cn("text-lg font-semibold tabular-nums", stat.color)}>{stat.value}</p>
              <p className="text-[9px] uppercase tracking-wider text-slate-600 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Tracker Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6"
      >
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="ml-3 text-sm">Loading tracker data...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.05] bg-white/[0.01] px-6 py-16 text-center">
            <TrendingUp className="mx-auto h-8 w-8 text-slate-600" />
            <h3 className="mt-4 text-sm font-medium text-white">No applications tracked</h3>
            <p className="mt-1 text-xs text-slate-500">
              Evaluate opportunities in the Pipeline to start building your tracker.
            </p>
          </div>
        ) : (
          <TrackerTable entries={entries} onViewReport={handleViewReport} />
        )}
      </motion.div>

      {/* Data Source Info */}
      <div className="rounded-xl border border-white/[0.03] bg-white/[0.01] px-6 py-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong className="text-slate-400">Data source:</strong>{" "}
          This tracker reads from{" "}
          <code className="rounded bg-white/[0.04] px-1 py-0.5">career-ops/data/applications.md</code>.
          Status updates can be made either from this UI or from the CLI via{" "}
          <code className="rounded bg-white/[0.04] px-1 py-0.5">/career-ops tracker</code>.
          Both sources stay in sync.
        </p>
      </div>
    </div>
  );
}
