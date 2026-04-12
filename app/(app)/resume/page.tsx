"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Save,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { logAppError } from "@/lib/error-utils";
import { createClient } from "@/lib/supabase/client";
import { optimizeResumeRequest } from "@/lib/ai/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { shivaBuild, vishnuContainer, vishnuItem } from "@/lib/motion";
import type { Resume } from "@/types";

export default function ResumePage() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [resume, setResume] = useState<Resume | null>(null);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    supabase.from("resumes").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data, error }: { data: Resume | null; error: any }) => {
        if (cancelled) return;
        if (error) { logAppError("[RESUME] Failed to load resume:", error); toast.error("Could not load your resume."); }
        if (data) { setResume(data); setContent(data.content); }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [supabase, user]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    const { data, error } = await supabase.from("resumes").upsert(
      { user_id: user.id, content, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    ).select().single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setResume(data);
    toast.success("Draft saved.");
  }, [content, supabase, user]);

  const handleATSScore = useCallback(async () => {
    if (!user || !content.trim()) { toast.error("Add resume content first."); return; }
    setScoring(true);
    try {
      const analysis = await optimizeResumeRequest({
        content,
        targetRole: undefined,
        industry: profile?.industry || undefined,
      });
      const { data, error } = await supabase.from("resumes").upsert(
        { user_id: user.id, content, ats_score: analysis.overallScore, ats_analysis: analysis, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      ).select().single();
      if (error) throw error;
      setResume(data);
      toast.success(`ATS score updated to ${analysis.overallScore}/100.`);
    } catch (error) {
      logAppError("[RESUME AI] Failed to score:", error);
      toast.error(error instanceof Error ? error.message : "Failed to score resume.");
    } finally { setScoring(false); }
  }, [content, profile, supabase, user]);

  const ats = resume?.ats_analysis;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <span className="text-3xl" style={{ color: "hsl(var(--kriya-primary))", animation: "kriya-glyph-pulse 2.4s ease-in-out infinite" }}>◈</span>
          <p className="kriya-label">Loading signal lab</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-0">

      {/* ─── Header ─────────────────────────────────────────────── */}
      <section className="py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <p className="kriya-label mb-3">Signal Lab</p>
            <h2 className="kriya-serif text-3xl sm:text-4xl font-light text-white leading-tight">
              Sharpen the signal your <span className="text-gradient-premium">resume sends</span>.
            </h2>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-xl">
              Write or paste your resume, save it as your working draft, and let AI score structure, keyword alignment, and execution strength.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-slate-500 shrink-0">
            <span>ATS: <span className="text-slate-300 font-medium">{ats?.overallScore ? `${ats.overallScore}/100` : "—"}</span></span>
            <span>Industry: <span className="text-slate-300">{profile?.industry || "Not set"}</span></span>
            <span>Draft: <span className={content.trim() ? "text-emerald-300" : "text-slate-500"}>{content.trim() ? "Active" : "Empty"}</span></span>
          </div>
        </div>
      </section>

      <div className="kriya-divider" />

      {/* ─── Editor ─────────────────────────────────────────────── */}
      <section className="py-8">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste or write your resume here. Include professional summary, work experience, projects, skills, and education."
          className="min-h-[400px] resize-y font-mono text-sm leading-7 bg-white/[0.01] border-white/[0.05] focus:border-white/[0.12] rounded-xl"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={handleSave} disabled={saving} variant="outline" className="rounded-xl bg-transparent border-white/[0.08] hover:bg-white/[0.03]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save draft"}
          </Button>
          <Button onClick={handleATSScore} disabled={scoring} className="rounded-xl">
            {scoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {scoring ? "Scoring..." : "Run AI analysis"}
          </Button>
        </div>
      </section>

      {/* ─── ATS Analysis Results ───────────────────────────────── */}
      {ats ? (
        <>
          <div className="kriya-divider" />

          {/* Score + Summary */}
          <section className="py-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="shrink-0 text-center">
                <p className={cn(
                  "kriya-serif text-5xl font-light",
                  ats.overallScore >= 70 ? "text-emerald-300" : ats.overallScore >= 50 ? "text-amber-200" : "text-rose-200"
                )}>
                  {ats.overallScore}
                </p>
                <p className="mt-2 kriya-label">ATS Score</p>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 flex-1">
                <p className="text-sm leading-7 text-slate-400">{ats.summary}</p>
              </div>
            </div>
          </section>

          {/* Section Breakdown — Editorial list, no cards */}
          <div className="kriya-divider" />
          <motion.section variants={vishnuContainer} initial="hidden" animate="visible" className="py-8 space-y-4">
            <p className="kriya-label mb-4">Section breakdown</p>
            {Object.entries(ats.sections || {}).map(([key, section]) => (
              <motion.div
                key={key}
                variants={vishnuItem}
                className="rounded-xl border border-white/[0.03] bg-white/[0.01] p-5"
              >
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-slate-300 capitalize">{key}</p>
                    <span className={cn(
                      "text-xs font-medium",
                      section.score >= 70 ? "text-emerald-300" : section.score >= 50 ? "text-amber-200" : "text-rose-200"
                    )}>
                      {section.score}%
                    </span>
                  </div>
                </div>
                <div className="h-1 w-full rounded-full bg-white/[0.04] overflow-hidden mb-3">
                  <div
                    className={cn("h-full rounded-full",
                      section.score >= 70 ? "bg-emerald-400/50" : section.score >= 50 ? "bg-amber-400/50" : "bg-rose-400/50"
                    )}
                    style={{ width: `${section.score}%` }}
                  />
                </div>
                <p className="text-[13px] text-slate-400 leading-relaxed">{section.tip}</p>

                {(section.found?.length || section.missing?.length) ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {section.found?.slice(0, 4).map((kw) => (
                      <span key={kw} className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/8 px-2 py-0.5 text-[10px] text-emerald-200">
                        <CheckCircle2 className="h-2.5 w-2.5" />{kw}
                      </span>
                    ))}
                    {section.missing?.slice(0, 4).map((kw) => (
                      <span key={kw} className="inline-flex items-center gap-1 rounded-full border border-rose-400/20 bg-rose-400/8 px-2 py-0.5 text-[10px] text-rose-200">
                        <XCircle className="h-2.5 w-2.5" />{kw}
                      </span>
                    ))}
                  </div>
                ) : null}
              </motion.div>
            ))}
          </motion.section>

          {/* Top Suggestions */}
          {ats.topSuggestions?.length ? (
            <>
              <div className="kriya-divider" />
              <section className="py-8">
                <p className="kriya-label mb-4">Top AI suggestions</p>
                <div className="space-y-2">
                  {ats.topSuggestions.map((suggestion, index) => (
                    <div key={`${suggestion}-${index}`} className="flex items-start gap-3 rounded-xl border border-white/[0.03] bg-white/[0.01] p-4">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.04] text-[10px] font-medium text-slate-400 shrink-0">
                        {index + 1}
                      </span>
                      <p className="text-[13px] text-slate-400 leading-relaxed">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </>
      ) : (
        <>
          <div className="kriya-divider" />
          <section className="py-14 text-center">
            <FileText className="h-8 w-8 mx-auto text-slate-600" />
            <h3 className="mt-4 kriya-serif text-xl font-light text-white">No analysis yet</h3>
            <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Save a draft and run AI analysis to see ATS scoring, missing signals, and the highest-leverage improvements.
            </p>
            <Button onClick={handleATSScore} disabled={scoring} className="mt-5 rounded-xl">
              {scoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {scoring ? "Scoring..." : "Run AI analysis"}
            </Button>
          </section>
        </>
      )}
    </div>
  );
}
