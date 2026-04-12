"use client";

import { toast } from "sonner";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Compass,
  FileText,
  GitBranch,
  Gauge,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useKriyaMode } from "@/contexts/kriya-mode-context";
import { cn } from "@/lib/utils";
import type { CareerTrackerEntry, CareerReport } from "@/types";

const quickActions = [
  {
    href: "/career/pipeline",
    icon: GitBranch,
    title: "Pipeline",
    description: "Evaluate a new opportunity",
    accent: "from-blue-500/20 to-cyan-500/20",
  },
  {
    href: "/career/evaluate",
    icon: Gauge,
    title: "Evaluations",
    description: "Browse evaluation reports",
    accent: "from-violet-500/20 to-purple-500/20",
  },
  {
    href: "/career/tracker",
    icon: BarChart3,
    title: "Tracker",
    description: "Application intelligence",
    accent: "from-amber-500/20 to-orange-500/20",
  },
];

export default function CareerHubPage() {
  const { profile } = useAuth();
  const { mode, modeLabel } = useKriyaMode();
  const [reports, setReports] = useState<CareerReport[]>([]);
  const [tracker, setTracker] = useState<CareerTrackerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [reportsRes, trackerRes] = await Promise.all([
          fetch("/api/career/reports").then((r) => r.json()),
          fetch("/api/career/tracker").then((r) => r.json()),
        ]);
        setReports(reportsRes.reports || []);
        setTracker(trackerRes.entries || []);
      } catch {
        toast.error("Failed to load career data. Check your connection.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = {
    totalEvaluated: tracker.length,
    applied: tracker.filter((e) => e.status === "Applied").length,
    interviewing: tracker.filter((e) => e.status === "Interview").length,
    avgScore: tracker.length > 0
      ? (
          tracker.reduce((sum, e) => sum + (parseFloat(e.score) || 0), 0) /
          tracker.length
        ).toFixed(1)
      : "—",
  };

  const latestReports = reports.slice(-5).reverse();

  const modeMessages = {
    krishna: {
      greeting: "Your path unfolds before you",
      subtitle: "Let guidance illuminate the way forward. Each evaluation brings clarity.",
    },
    vishnu: {
      greeting: "Career Intelligence System",
      subtitle: "Structured execution. Precision evaluation. Systematic progress.",
    },
    shiva: {
      greeting: "Transform or be transformed",
      subtitle: "Every evaluation destroys uncertainty. Every decision rebuilds stronger.",
    },
  };

  const msg = modeMessages[mode];

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative pt-4 pb-6"
      >
        <div className="pointer-events-none absolute -inset-x-6 top-0 h-[320px] bg-[radial-gradient(ellipse_at_top_left,var(--kriya-gradient-start),transparent_50%),radial-gradient(ellipse_at_bottom_right,var(--kriya-gradient-end),transparent_40%)]" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.05] bg-white/[0.02] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">
            <Compass className="h-3 w-3" />
            Career Engine · {modeLabel} Mode
          </div>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {msg.greeting}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-400 leading-relaxed">
            {msg.subtitle}
          </p>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-2xl">
            {[
              { label: "Evaluated", value: stats.totalEvaluated },
              { label: "Applied", value: stats.applied },
              { label: "Interviewing", value: stats.interviewing },
              { label: "Avg Score", value: `${stats.avgScore}/5` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.03]"
              >
                <p className="text-2xl font-semibold tabular-nums text-white">
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                  ) : (
                    stat.value
                  )}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Quick Actions */}
      <section className="grid gap-4 sm:grid-cols-3">
        {quickActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Link href={action.href} className="group block">
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.03] hover:-translate-y-1">
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100", action.accent)} />

                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.04] transition-colors group-hover:bg-white/[0.06]">
                      <Icon className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">{action.title}</h3>
                    <p className="mt-1 text-sm text-slate-500 group-hover:text-slate-400 transition-colors">
                      {action.description}
                    </p>
                    <ArrowRight className="mt-4 h-4 w-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </section>

      {/* Recent Evaluations */}
      <section>
        <div className="mb-4 flex items-center justify-between border-b border-white/[0.04] pb-3">
          <div>
            <h2 className="text-lg font-medium tracking-tight text-white">Recent Evaluations</h2>
            <p className="mt-0.5 text-xs text-slate-500">Latest assessment reports</p>
          </div>
          <Link href="/career/evaluate">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 py-8 justify-center text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading evaluations...</span>
          </div>
        ) : latestReports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.05] bg-white/[0.01] px-6 py-12 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-slate-600" />
            <h3 className="mt-4 text-sm font-medium text-white">No evaluations yet</h3>
            <p className="mt-1 text-xs text-slate-500">
              Paste a job URL in the Pipeline to create your first evaluation.
            </p>
            <Link href="/career/pipeline">
              <Button size="sm" className="mt-4">
                Start evaluating
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {latestReports.map((report, i) => (
              <motion.div
                key={report.slug}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/career/evaluate?report=${report.slug}`}
                  className="group flex items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-white/[0.02] border border-transparent hover:border-white/[0.03]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.04]">
                    <FileText className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-200 truncate">{report.company}</p>
                    <p className="text-xs text-slate-500 truncate">{report.role}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-semibold tabular-nums",
                      report.score >= 4 ? "text-emerald-400" :
                      report.score >= 3 ? "text-amber-400" :
                      "text-rose-400"
                    )}>
                      {report.score.toFixed(1)}/5
                    </p>
                    <p className="text-[10px] text-slate-600">{report.date}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Next Action Prompt */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border border-white/[0.04] bg-gradient-to-br from-white/[0.02] to-white/[0.01] p-6"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04]">
            <Zap className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Suggested Next Action</h3>
            <p className="mt-1 text-sm text-slate-400">
              {tracker.length === 0
                ? "Start by evaluating your first job opportunity. Paste a URL in the Pipeline."
                : stats.applied === 0
                  ? `You've evaluated ${stats.totalEvaluated} opportunities. Time to apply to the highest-scoring ones.`
                  : `${stats.interviewing} interviews active. Review your STAR+R story bank and prep for the next round.`}
            </p>
            <Link
              href={
                tracker.length === 0
                  ? "/career/pipeline"
                  : stats.applied === 0
                    ? "/career/tracker"
                    : "/interview"
              }
            >
              <Button size="sm" variant="outline" className="mt-3 bg-transparent border-white/[0.06]">
                {tracker.length === 0 ? "Open Pipeline" : stats.applied === 0 ? "View Tracker" : "Prep Interviews"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
