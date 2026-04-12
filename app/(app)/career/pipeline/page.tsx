"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, GitBranch, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PipelineInput } from "@/components/career/pipeline-input";
import { useKriyaMode } from "@/contexts/kriya-mode-context";
import { cn } from "@/lib/utils";
import type { PipelineEntry } from "@/types";

export default function PipelinePage() {
  const { mode } = useKriyaMode();
  const [pending, setPending] = useState<PipelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastResult, setLastResult] = useState<{ status: string; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/career/pipeline")
      .then((r) => r.json())
      .then((data) => setPending(data.entries || []))
      .catch(() => toast.error("Failed to load pipeline. Check your connection."))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (input: { type: "url" | "text"; value: string }) => {
    setIsEvaluating(true);
    setLastResult(null);

    try {
      const res = await fetch("/api/career/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          input.type === "url" ? { url: input.value } : { text: input.value }
        ),
      });
      const data = await res.json();
      setLastResult(data);
    } catch (error) {
      setLastResult({ status: "error", message: "Failed to process. Try again." });
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
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
            <GitBranch className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Pipeline</h1>
            <p className="text-sm text-slate-500">Feed opportunities. Get evaluations.</p>
          </div>
        </div>
      </motion.div>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6"
      >
        <h2 className="text-sm font-medium text-white mb-4">
          Submit for Evaluation
        </h2>
        <PipelineInput onSubmit={handleSubmit} isLoading={isEvaluating} />

        {/* Result */}
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mt-4 rounded-xl border px-4 py-3 text-sm",
              lastResult.status === "error"
                ? "border-rose-400/20 bg-rose-400/5 text-rose-300"
                : "border-emerald-400/20 bg-emerald-400/5 text-emerald-300"
            )}
          >
            <p>{lastResult.message}</p>
            {lastResult.status === "queued" && (
              <p className="mt-1 text-xs text-slate-500">
                The evaluation will be processed by the Career-Ops agentic system. Run{" "}
                <code className="rounded bg-white/[0.04] px-1 py-0.5">/career-ops</code>{" "}
                in your terminal to execute.
              </p>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Pending Pipeline */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-white">Pending Pipeline</h2>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">
            {pending.length} queued
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="ml-2 text-sm">Loading pipeline...</span>
          </div>
        ) : pending.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.05] bg-white/[0.01] px-6 py-10 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-slate-600" />
            <p className="mt-3 text-sm text-slate-500">
              Pipeline is empty. Paste a job URL above to get started.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Or add URLs to <code className="rounded bg-white/[0.04] px-1 py-0.5">career-ops/data/pipeline.md</code>
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {pending.map((entry, i) => (
              <motion.div
                key={entry.url}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/[0.02] transition-colors"
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    entry.status === "pending" ? "bg-amber-400" :
                    entry.status === "processing" ? "bg-blue-400 animate-pulse" :
                    entry.status === "evaluated" ? "bg-emerald-400" :
                    "bg-rose-400"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-300 truncate font-mono">{entry.url}</p>
                </div>
                <span className="text-[10px] text-slate-600 shrink-0">{entry.source}</span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Help */}
      <div className="rounded-xl border border-white/[0.03] bg-white/[0.01] px-6 py-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong className="text-slate-400">How it works:</strong>{" "}
          Submit a job URL or description. The Career-Ops agentic system evaluates it across 10 dimensions
          (archetype match, CV fit, compensation, level, and more), generates a detailed A-F report,
          and optionally creates an ATS-optimized PDF resume.
          For full agentic processing, run <code className="rounded bg-white/[0.04] px-1">/career-ops</code> in your terminal.
        </p>
      </div>
    </div>
  );
}
