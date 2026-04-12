"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shivaDissolve, shivaBuild, vishnuContainer, vishnuItem } from "@/lib/motion";
import type { HireabilityScore, Mission, Task } from "@/types";

/* ─── Types ───────────────────────────────────────────────────────── */

type ScoreBreakdown = {
  profileScore: number;
  taskScore: number;
  resumeScore: number;
  quizScore: number;
};

type DashboardMetrics = {
  totalScore: number;
  missionProgress: number;
  profileCompletion: number;
  completedTasks: number;
  pendingTasks: number;
  streak: number;
  breakdown: ScoreBreakdown;
  signalGraph: Array<{ label: string; value: number }>;
};

/* ─── Utilities ───────────────────────────────────────────────────── */

function describeDashboardError(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message, details: { name: error.name, stack: error.stack } };
  }
  if (error && typeof error === "object") {
    const entries = Object.getOwnPropertyNames(error).reduce<Record<string, unknown>>(
      (acc, key) => { acc[key] = (error as Record<string, unknown>)[key]; return acc; }, {}
    );
    return { message: typeof entries.message === "string" ? entries.message : "Unexpected dashboard error", details: entries };
  }
  return { message: typeof error === "string" ? error : "Unexpected dashboard error", details: error };
}

function logDashboardWarning(context: string, error: unknown) {
  const serialized = describeDashboardError(error);
  console.warn(context, serialized, JSON.stringify(serialized));
}

function computeStreak(tasks: Task[]) {
  const uniqueDays = Array.from(
    new Set(
      tasks.filter((t) => t.completed_at).map((t) => new Date(t.completed_at as string).toDateString())
    )
  ).map((d) => new Date(d)).sort((a, b) => b.getTime() - a.getTime());

  if (uniqueDays.length === 0) return 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const first = new Date(uniqueDays[0]); first.setHours(0, 0, 0, 0);
  if (Math.round((today.getTime() - first.getTime()) / 86400000) > 1) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]); prev.setHours(0, 0, 0, 0);
    const curr = new Date(uniqueDays[i]); curr.setHours(0, 0, 0, 0);
    if (Math.round((prev.getTime() - curr.getTime()) / 86400000) !== 1) break;
    streak++;
  }
  return streak;
}

function deriveDashboardMetrics({ profile, tasks, mission, resumeAtsScore, interviewAverage }: {
  profile: ReturnType<typeof useAuth>["profile"];
  tasks: Task[];
  mission: Mission | null;
  resumeAtsScore: number;
  interviewAverage: number;
}): DashboardMetrics {
  const skills = profile?.skills ?? [];
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;
  const missionProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : mission?.progress ?? 0;

  const profileFields = [Boolean(profile?.full_name), Boolean(profile?.industry), skills.length > 0, Boolean(profile?.bio), Boolean(profile?.experience), Boolean(profile?.onboarded)];
  const profileCompletion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  const profileScore = Math.round((profileCompletion / 100) * 30);
  const taskScore = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 35) : 0;
  const normalizedResumeScore = Math.round((resumeAtsScore / 100) * 20);
  const quizScore = Math.round((interviewAverage / 100) * 15);
  const totalScore = Math.max(0, Math.min(100, profileScore + taskScore + normalizedResumeScore + quizScore));

  return {
    totalScore, missionProgress, profileCompletion, completedTasks, pendingTasks,
    streak: computeStreak(tasks),
    breakdown: { profileScore, taskScore, resumeScore: normalizedResumeScore, quizScore },
    signalGraph: [
      { label: "Profile", value: profileCompletion },
      { label: "Mission", value: missionProgress },
      { label: "Resume", value: resumeAtsScore },
      { label: "Interview", value: Math.round(interviewAverage) },
    ],
  };
}

/* ─── Signal Bar (memoized) ───────────────────────────────────────── */

const SignalBar = memo(function SignalBar({ data }: { data: Array<{ label: string; value: number }> }) {
  return (
    <div className="space-y-3">
      <p className="kriya-label">Signal Strength</p>
      {data.map((item) => (
        <div key={item.label} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-slate-400">{item.label}</span>
            <span className="text-[12px] font-medium text-slate-300">{item.value}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/[0.04] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.value}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, hsl(var(--kriya-primary) / 0.6), hsl(var(--kriya-accent) / 0.8))`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
});

/* ─── Main Dashboard ──────────────────────────────────────────────── */

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [mission, setMission] = useState<Mission | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [resumeAtsScore, setResumeAtsScore] = useState(0);
  const [interviewAverage, setInterviewAverage] = useState(0);
  const [scoreSnapshot, setScoreSnapshot] = useState<HireabilityScore | null>(null);
  const [actionTaskId, setActionTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const metrics = useMemo(
    () => deriveDashboardMetrics({ profile, tasks, mission, resumeAtsScore, interviewAverage }),
    [interviewAverage, mission, profile, resumeAtsScore, tasks]
  );

  const pendingTasks = useMemo(
    () => [...tasks]
      .filter((t) => t.status === "pending" || t.status === "in_progress")
      .sort((a, b) => {
        const rank = { critical: 4, high: 3, medium: 2, low: 1 };
        const diff = (rank[b.priority] ?? 0) - (rank[a.priority] ?? 0);
        return diff !== 0 ? diff : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }),
    [tasks]
  );

  const topTask = pendingTasks[0] ?? null;

  /* ─── Data Fetch ──────────────────────────────────────────────── */

  useEffect(() => {
    let cancelled = false;

    async function persistScoreSnapshot(totalScore: number, breakdown: ScoreBreakdown) {
      if (!user) return null;
      const { data: existing, error: existingErr } = await supabase
        .from("hireability_scores").select("*").eq("user_id", user.id)
        .order("computed_at", { ascending: false }).limit(1).maybeSingle();
      if (existingErr) { logDashboardWarning("[DASHBOARD] score read failed", existingErr); return null; }
      if (existing?.score === totalScore) { if (!cancelled) setScoreSnapshot(existing); return existing; }
      const { data: inserted, error: insertErr } = await supabase
        .from("hireability_scores").insert({ user_id: user.id, score: totalScore, breakdown }).select().single();
      if (insertErr) { logDashboardWarning("[DASHBOARD] score write failed", insertErr); return existing ?? null; }
      if (!cancelled) setScoreSnapshot(inserted);
      return inserted;
    }

    const fetchData = async () => {
      if (authLoading) return;
      if (!user) { if (!cancelled) { setMission(null); setTasks([]); setResumeAtsScore(0); setInterviewAverage(0); setScoreSnapshot(null); setLoading(false); } return; }
      if (!cancelled) { setLoading(true); setError(null); }
      try {
        const [{ data: activeMission, error: missionErr }, { data: resume, error: resumeErr }, { data: logs, error: logsErr }] = await Promise.all([
          supabase.from("missions").select("*").eq("user_id", user.id).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle(),
          supabase.from("resumes").select("ats_score").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
          supabase.from("interview_logs").select("quiz_score").eq("user_id", user.id),
        ]);
        if (missionErr) throw missionErr;
        if (resumeErr) logDashboardWarning("[DASHBOARD] resume query failed", resumeErr);
        if (logsErr) logDashboardWarning("[DASHBOARD] interview query failed", logsErr);
        let missionTasks: Task[] = [];
        if (activeMission) {
          const { data: taskRows, error: taskErr } = await supabase.from("tasks").select("*").eq("mission_id", activeMission.id).order("created_at", { ascending: true });
          if (taskErr) logDashboardWarning("[DASHBOARD] task query failed", taskErr);
          else missionTasks = taskRows ?? [];
        }
        const nextResume = resume?.ats_score ?? 0;
        const nextInterview = logs && logs.length > 0 ? logs.reduce((s: number, l: { quiz_score: number | null }) => s + (l.quiz_score || 0), 0) / logs.length : 0;
        const nextMetrics = deriveDashboardMetrics({ profile, tasks: missionTasks, mission: activeMission, resumeAtsScore: nextResume, interviewAverage: nextInterview });
        if (activeMission && activeMission.progress !== nextMetrics.missionProgress) {
          await supabase.from("missions").update({ progress: nextMetrics.missionProgress }).eq("id", activeMission.id);
        }
        if (cancelled) return;
        setMission(activeMission ? { ...activeMission, progress: nextMetrics.missionProgress } : null);
        setTasks(missionTasks); setResumeAtsScore(nextResume); setInterviewAverage(nextInterview);
        await persistScoreSnapshot(nextMetrics.totalScore, nextMetrics.breakdown);
      } catch (err) { console.error("Dashboard fetch error:", describeDashboardError(err)); if (!cancelled) setError("Sync issue while loading your command center."); }
      finally { if (!cancelled) setLoading(false); }
    };
    void fetchData();
    return () => { cancelled = true; };
  }, [authLoading, profile, supabase, user]);

  /* ─── Task completion ─────────────────────────────────────────── */

  const completeTask = useCallback(async (taskId: string) => {
    if (!user || actionTaskId) return;
    const prev = tasks;
    const completedAt = new Date().toISOString();
    const next = tasks.map((t) => t.id === taskId ? { ...t, status: "completed" as const, completed_at: completedAt } : t);
    setActionTaskId(taskId); setTasks(next);
    const nextMetrics = deriveDashboardMetrics({ profile, tasks: next, mission, resumeAtsScore, interviewAverage });
    if (mission) setMission({ ...mission, progress: nextMetrics.missionProgress });
    try {
      const { error: taskErr } = await supabase.from("tasks").update({ status: "completed", completed_at: completedAt }).eq("id", taskId);
      if (taskErr) throw taskErr;
      if (mission) { const { error: mErr } = await supabase.from("missions").update({ progress: nextMetrics.missionProgress }).eq("id", mission.id); if (mErr) throw mErr; }
      const { data: ins, error: sErr } = await supabase.from("hireability_scores").insert({ user_id: user.id, score: nextMetrics.totalScore, breakdown: nextMetrics.breakdown }).select().single();
      if (sErr) console.warn("[DASHBOARD] score save failed", sErr); else setScoreSnapshot(ins);
      toast.success("Action completed. Momentum increased.");
    } catch { setTasks(prev); if (mission) setMission(mission); toast.error("Could not update. Please retry."); }
    finally { setActionTaskId(null); }
  }, [user, actionTaskId, tasks, profile, mission, resumeAtsScore, interviewAverage, supabase]);

  /* ─── Loading state ───────────────────────────────────────────── */

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <span className="text-3xl" style={{ color: "hsl(var(--kriya-primary))", animation: "kriya-glyph-pulse 2.4s ease-in-out infinite" }}>◈</span>
          <p className="kriya-label">Loading command center</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const firstName = profile?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "there";
  const missionTitle = mission?.title || "No active mission";

  return (
    <div className="mx-auto max-w-5xl space-y-0">

      {/* ─── Status Strip ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-2 text-[12px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <Target className="h-3 w-3" />
          <span className="text-slate-400 font-medium">{missionTitle}</span>
        </span>
        <span className="hidden sm:inline">·</span>
        <span className="flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3" />
          <span className="text-slate-300 font-medium">{metrics.totalScore}</span>/100
        </span>
        <span className="hidden sm:inline">·</span>
        <span className="flex items-center gap-1.5">
          <Flame className="h-3 w-3 text-amber-400/80" />
          {metrics.streak > 0 ? `${metrics.streak}d streak` : "Start today"}
        </span>
        <span className="hidden sm:inline">·</span>
        <span>{metrics.pendingTasks} pending</span>
      </div>

      <div className="kriya-divider" />

      {error && (
        <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {/* ─── The Oracle — Primary Focus Zone ────────────────────── */}
      <section className="py-16 sm:py-20 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="kriya-serif text-2xl sm:text-3xl md:text-4xl font-light text-white leading-tight"
        >
          What needs your attention,{" "}
          <span className="text-gradient-premium font-normal">{firstName}</span>?
        </motion.p>

        {topTask ? (
          <motion.div
            key={topTask.id}
            variants={shivaBuild}
            initial="initial"
            animate="animate"
            className="mt-12 mx-auto max-w-2xl"
          >
            <p className="kriya-label mb-4">Highest priority action</p>
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6 sm:p-8 text-left">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="kriya-serif text-xl sm:text-2xl font-light text-white leading-snug">
                    {topTask.title}
                  </h3>
                  {topTask.description && (
                    <p className="mt-3 text-sm text-slate-400 leading-relaxed line-clamp-3">
                      {topTask.description}
                    </p>
                  )}
                </div>
                <span className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider border",
                  topTask.priority === "critical" ? "border-red-400/20 text-red-300 bg-red-400/8" :
                  topTask.priority === "high" ? "border-amber-400/20 text-amber-300 bg-amber-400/8" :
                  "border-white/[0.06] text-slate-400 bg-white/[0.03]"
                )}>
                  {topTask.priority}
                </span>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <Button
                  onClick={() => void completeTask(topTask.id)}
                  disabled={actionTaskId === topTask.id}
                  className="rounded-xl bg-white text-slate-900 hover:bg-slate-200 shadow-sm"
                >
                  {actionTaskId === topTask.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Complete
                </Button>
                <Button asChild variant="ghost" className="text-slate-400 hover:text-white">
                  <Link href="/tasks">
                    View all actions
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            variants={shivaBuild}
            initial="initial"
            animate="animate"
            className="mt-12 mx-auto max-w-md"
          >
            <div className="rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01] p-8 text-center">
              <p className="text-sm text-slate-400">No pending actions.</p>
              <Button asChild className="mt-4 rounded-xl" variant="outline">
                <Link href={mission ? "/tasks" : "/mission"}>
                  {mission ? "Generate tasks" : "Create your first mission"}
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </section>

      <div className="kriya-divider" />

      {/* ─── Intelligence Layer — Three Columns ─────────────────── */}
      <motion.section
        variants={vishnuContainer}
        initial="hidden"
        animate="visible"
        className="py-12 grid gap-8 md:grid-cols-3"
      >
        {/* Signal Graph */}
        <motion.div variants={vishnuItem} className="space-y-4">
          <SignalBar data={metrics.signalGraph} />
        </motion.div>

        {/* Mentor Whisper */}
        <motion.div variants={vishnuItem} className="space-y-3">
          <p className="kriya-label">Mentor Insight</p>
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
              <p className="text-[13px] text-slate-400 leading-relaxed">
                {metrics.totalScore < 30
                  ? "Focus on completing your profile and starting a mission. Small actions compound into career momentum."
                  : metrics.totalScore < 60
                    ? `Score at ${metrics.totalScore}. Prioritize clearing your execution queue — each completed task lifts your entire signal.`
                    : `Strong position at ${metrics.totalScore}. Push your resume ATS score higher and run interview prep loops to close the gap.`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Navigation */}
        <motion.div variants={vishnuItem} className="space-y-3">
          <p className="kriya-label">Next Moves</p>
          <div className="space-y-1.5">
            {[
              { label: "Define clarity", href: "/mission", desc: "Set your strategic target" },
              { label: "Optimize signal", href: "/resume", desc: "Sharpen your resume" },
              { label: "Prepare", href: "/interview", desc: "Run AI mock interview" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
              >
                <div>
                  <p className="text-[13px] font-medium text-slate-300 group-hover:text-white transition-colors">{item.label}</p>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                </div>
                <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-slate-300 transition-colors" />
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.section>

      <div className="kriya-divider" />

      {/* ─── Momentum Snapshot ──────────────────────────────────── */}
      <motion.section
        variants={vishnuContainer}
        initial="hidden"
        animate="visible"
        className="py-12 grid gap-6 sm:grid-cols-3"
      >
        {[
          { label: "Profile", value: `${metrics.profileCompletion}%`, desc: "Raises discoverability and AI guidance quality" },
          { label: "Completed", value: `${metrics.completedTasks}`, desc: "Every action increases mission completion" },
          { label: "Resume ATS", value: `${resumeAtsScore || 0}`, desc: "Feeds directly into your hireability model" },
        ].map((item) => (
          <motion.div
            key={item.label}
            variants={vishnuItem}
            className="rounded-xl border border-white/[0.03] bg-white/[0.01] p-5"
          >
            <p className="kriya-label">{item.label}</p>
            <p className="mt-3 kriya-serif text-3xl font-light text-white">{item.value}</p>
            <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </motion.section>
    </div>
  );
}
