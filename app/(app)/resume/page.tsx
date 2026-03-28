"use client";

import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { Resume } from "@/types";

function ResumeSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[220px] rounded-[1.75rem]" />
      <Skeleton className="h-[420px] rounded-[1.5rem]" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[260px] rounded-[1.5rem]" />
        <Skeleton className="h-[260px] rounded-[1.5rem]" />
      </div>
    </div>
  );
}

export default function ResumePage() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [resume, setResume] = useState<Resume | null>(null);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }: { data: Resume | null; error: any }) => {
        if (cancelled) return;

        if (error) {
          logAppError("[RESUME] Failed to load resume:", error);
          toast.error("We could not load your resume lab.");
          setLoading(false);
          return;
        }

        if (data) {
          setResume(data);
          setContent(data.content);
        }

        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    const { data, error } = await supabase
      .from("resumes")
      .upsert(
        {
          user_id: user.id,
          content,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setResume(data);
    toast.success("Resume saved.");
  };

  const handleATSScore = async () => {
    if (!user || !content.trim()) {
      toast.error("Add resume content first.");
      return;
    }

    setScoring(true);

    try {
      const analysis = await optimizeResumeRequest({
        content,
        targetRole: undefined,
        industry: profile?.industry || undefined,
      });

      const { data, error } = await supabase
        .from("resumes")
        .upsert(
          {
            user_id: user.id,
            content,
            ats_score: analysis.overallScore,
            ats_analysis: analysis,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      setResume(data);
      toast.success(`ATS score updated to ${analysis.overallScore}/100.`);
    } catch (error) {
      logAppError("[RESUME AI] Failed to score resume:", error);
      toast.error(error instanceof Error ? error.message : "Failed to score resume.");
    } finally {
      setScoring(false);
    }
  };

  const ats = resume?.ats_analysis;

  if (loading) {
    return <ResumeSkeleton />;
  }

  return (
    <div className="space-y-6">
      <Card className="glass-panel-strong relative overflow-hidden border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.14),transparent_20%)]" />
        <CardContent className="relative p-6 sm:p-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_340px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                Resume lab
              </div>
              <h1 className="mt-5 text-4xl font-semibold text-white sm:text-5xl">
                Improve the signal your
                <span className="text-gradient-premium"> resume sends</span>.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Write or paste your resume, save it as your working draft, and let AI
                score structure, keyword alignment, and execution strength.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save draft"}
                </Button>
                <Button type="button" onClick={handleATSScore} disabled={scoring}>
                  {scoring ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {scoring ? "Scoring..." : "Run AI analysis"}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {[
                {
                  label: "Current ATS",
                  value: ats?.overallScore ? `${ats.overallScore}/100` : "Not scored",
                  tone: "text-cyan-100",
                },
                {
                  label: "Industry fit",
                  value: profile?.industry || "Not set",
                  tone: "text-slate-100",
                },
                {
                  label: "Draft status",
                  value: content.trim() ? "Active" : "Empty",
                  tone: "text-violet-100",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] p-4"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    {item.label}
                  </p>
                  <p className={`mt-3 text-2xl font-semibold ${item.tone}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Resume editor</CardTitle>
          <CardDescription>
            Paste your full draft below. Include summary, experience, projects, skills,
            and measurable outcomes where possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Paste or write your resume here. Include professional summary, work experience, projects, skills, and education."
            className="min-h-[440px] resize-y font-mono text-sm leading-7"
          />
        </CardContent>
      </Card>

      {ats ? (
        <div className="space-y-6">
          <Card className="border-white/10">
            <CardContent className="grid gap-6 p-6 md:grid-cols-[160px_minmax(0,1fr)]">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5 text-center">
                <p
                  className={`text-5xl font-semibold ${
                    ats.overallScore >= 70
                      ? "text-emerald-300"
                      : ats.overallScore >= 50
                        ? "text-amber-200"
                        : "text-rose-200"
                  }`}
                >
                  {ats.overallScore}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-500">
                  ATS score
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm leading-7 text-slate-300">{ats.summary}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            {Object.entries(ats.sections || {}).map(([key, section], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Card className="h-full border-white/10">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                          {key}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-white">
                          {section.score}%
                        </p>
                      </div>
                      <Badge
                        className={
                          section.score >= 70
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                            : section.score >= 50
                              ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
                              : "border-rose-400/20 bg-rose-400/10 text-rose-100"
                        }
                      >
                        signal
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <Progress value={section.score} className="h-2" />
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-400">{section.tip}</p>

                    {section.found?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {section.found.slice(0, 4).map((keyword) => (
                          <Badge
                            key={keyword}
                            className="border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    ) : null}

                    {section.missing?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {section.missing.slice(0, 4).map((keyword) => (
                          <Badge
                            key={keyword}
                            className="border-rose-400/20 bg-rose-400/10 text-rose-100"
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {ats.topSuggestions?.length ? (
            <Card className="border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Top AI suggestions</CardTitle>
                <CardDescription>
                  Highest-leverage changes to improve recruiter clarity and ATS fit.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ats.topSuggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion}-${index}`}
                    className="flex items-start gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/15 text-xs font-semibold text-violet-100">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-7 text-slate-300">{suggestion}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : (
        <Card className="border-dashed border-white/10 bg-white/[0.03]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-violet-500/20 to-cyan-400/20 text-cyan-100">
              <FileText className="h-7 w-7" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-white">No AI analysis yet</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">
              Save a draft and run AI analysis to see ATS scoring, missing signals, and
              the highest-leverage improvements for your next application cycle.
            </p>
            <Button type="button" className="mt-6" onClick={handleATSScore} disabled={scoring}>
              {scoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {scoring ? "Scoring..." : "Run AI analysis"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
