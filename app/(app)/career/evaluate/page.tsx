"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { EvaluationCard } from "@/components/career/evaluation-card";
import { ReportViewer } from "@/components/career/report-viewer";
import { cn } from "@/lib/utils";
import type { CareerReport } from "@/types";

export default function EvaluatePage() {
  const searchParams = useSearchParams();
  const activeSlug = searchParams.get("report");
  const [reports, setReports] = useState<CareerReport[]>([]);
  const [activeReport, setActiveReport] = useState<CareerReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/career/reports")
      .then((r) => r.json())
      .then((data) => {
        const allReports = (data.reports || []) as CareerReport[];
        setReports(allReports);

        if (activeSlug) {
          const found = allReports.find((r) => r.slug === activeSlug);
          if (found) setActiveReport(found);
        }
      })
      .catch(() => toast.error("Failed to load evaluations. Check your connection."))
      .finally(() => setLoading(false));
  }, [activeSlug]);

  const filtered = reports.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.company.toLowerCase().includes(q) ||
      r.role.toLowerCase().includes(q) ||
      r.archetype.toLowerCase().includes(q)
    );
  });

  // If a report is selected, show full view
  if (activeReport) {
    return (
      <div className="mx-auto max-w-5xl">
        <Link
          href="/career/evaluate"
          onClick={() => setActiveReport(null)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-6"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to evaluations
        </Link>
        <ReportViewer report={activeReport} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
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

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.04]">
              <FileText className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Evaluations</h1>
              <p className="text-sm text-slate-500">
                {reports.length} reports · Deep analysis of every opportunity
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, role..."
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-white/[0.12] focus:ring-1 focus:ring-white/[0.08] w-64"
            />
          </div>
        </div>
      </motion.div>

      {/* Reports Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ml-3 text-sm">Loading evaluations...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.05] bg-white/[0.01] px-6 py-16 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-600" />
          <h3 className="mt-4 text-sm font-medium text-white">
            {search ? "No matching reports" : "No evaluations yet"}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {search
              ? "Try a different search term."
              : "Submit a job opportunity in the Pipeline to generate your first evaluation."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.reverse().map((report, i) => (
            <motion.div
              key={report.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
            >
              <button
                onClick={() => setActiveReport(report)}
                className="w-full text-left"
              >
                <EvaluationCard report={report} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
