"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  CheckSquare,
  Flame,
  Loader2,
  Radar,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SkillGraph } from "@/components/dashboard/skill-graph";
import { MentorPanel } from "@/components/dashboard/mentor-panel";
import type { HireabilityScore, Mission, Task } from "@/types";

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

function describeDashboardError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      details: {
        name: error.name,
        stack: error.stack,
      },
    };
  }

  if (error && typeof error === "object") {
    const entries = Object.getOwnPropertyNames(error).reduce<Record<string, unknown>>(
      (accumulator, key) => {
        accumulator[key] = (error as Record<string, unknown>)[key];
        return accumulator;
      },
      {}
    );

    return {
      message:
        typeof entries.message === "string"
          ? entries.message
          : "Unexpected dashboard error",
      details: entries,
    };
  }

  return {
    message: typeof error === "string" ? error : "Unexpected dashboard error",
    details: error,
  };
}

function logDashboardWarning(context: string, error: unknown) {
  const serializedError = describeDashboardError(error);
  console.warn(context, serializedError, JSON.stringify(serializedError));
}

const priorityStyles: Record<string, string> = {
  critical: "border-rose-400/20 bg-rose-400/10 text-rose-100",
  high: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  medium: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
  low: "border-white/10 bg-white/[0.06] text-slate-200",
};

function computeStreak(tasks: Task[]) {
  const uniqueCompletionDays = Array.from(
    new Set(
      tasks
        .filter((task) => task.completed_at)
        .map((task) => new Date(task.completed_at as string).toDateString())
    )
  )
    .map((day) => new Date(day))
    .sort((a, b) => b.getTime() - a.getTime());

  if (uniqueCompletionDays.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(uniqueCompletionDays[0]);
  firstDay.setHours(0, 0, 0, 0);

  const gapFromToday = Math.round(
    (today.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (gapFromToday > 1) return 0;

  let streak = 1;
  for (let index = 1; index < uniqueCompletionDays.length; index += 1) {
    const previous = new Date(uniqueCompletionDays[index - 1]);
    previous.setHours(0, 0, 0, 0);
    const current = new Date(uniqueCompletionDays[index]);
    current.setHours(0, 0, 0, 0);

    const difference = Math.round(
      (previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (difference !== 1) break;
    streak += 1;
  }

  return streak;
}

function deriveDashboardMetrics({
  profile,
  tasks,
  mission,
  resumeAtsScore,
  interviewAverage,
}: {
  profile: ReturnType<typeof useAuth>["profile"];
  tasks: Task[];
  mission: Mission | null;
  resumeAtsScore: number;
  interviewAverage: number;
}): DashboardMetrics {
  const skills = profile?.skills ?? [];
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const pendingTasks = tasks.filter(
    (task) => task.status === "pending" || task.status === "in_progress"
  ).length;
  const missionProgress =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : mission?.progress ?? 0;

  const profileFields = [
    Boolean(profile?.full_name),
    Boolean(profile?.industry),
    skills.length > 0,
    Boolean(profile?.bio),
    Boolean(profile?.experience),
    Boolean(profile?.onboarded),
  ];
  const profileCompletion = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100
  );

  const profileScore = Math.round((profileCompletion / 100) * 30);
  const taskScore = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 35) : 0;
  const normalizedResumeScore = Math.round((resumeAtsScore / 100) * 20);
  const quizScore = Math.round((interviewAverage / 100) * 15);
  const totalScore = Math.max(
    0,
    Math.min(100, profileScore + taskScore + normalizedResumeScore + quizScore)
  );

  return {
    totalScore,
    missionProgress,
    profileCompletion,
    completedTasks,
    pendingTasks,
    streak: computeStreak(tasks),
    breakdown: {
      profileScore,
      taskScore,
      resumeScore: normalizedResumeScore,
      quizScore,
    },
    signalGraph: [
      { label: "Profile", value: profileCompletion },
      { label: "Mission", value: missionProgress },
      { label: "Resume", value: resumeAtsScore },
      { label: "Interview", value: Math.round(interviewAverage) },
    ],
  };
}

function buildProjectIdeas({
  mission,
  skills,
  pendingTasks,
}: {
  mission: Mission | null;
  skills: string[];
  pendingTasks: Task[];
}) {
  const leadingSkill = skills[0] || "product execution";
  const secondarySkill = skills[1] || "AI workflows";

  return [
    {
      title: mission?.target_role
        ? `${mission.target_role} case study`
        : "Flagship proof-of-work sprint",
      description: `Build a portfolio artifact that demonstrates ${leadingSkill} with measurable impact.`,
      href: "/resume",
      label: "Portfolio signal",
    },
    {
      title: mission?.title
        ? `Execution system for ${mission.title}`
        : "Create an execution operating rhythm",
      description: `Convert ${
        pendingTasks.length > 0 ? pendingTasks.length : "your"
      } priority tasks into a visible weekly sprint board.`,
      href: "/tasks",
      label: "Execution velocity",
    },
    {
      title: `${secondarySkill} interview loop`,
      description:
        "Run a repeatable AI mock interview cadence and turn weak spots into prepared answers.",
      href: "/interview",
      label: "Interview readiness",
    },
  ];
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Skeleton className="h-[240px] rounded-[1.75rem]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[150px] rounded-[1.5rem]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_420px]">
        <div className="space-y-6">
          <Skeleton className="h-[340px] rounded-[1.5rem]" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[320px] rounded-[1.5rem]" />
            <Skeleton className="h-[320px] rounded-[1.5rem]" />
          </div>
        </div>
        <Skeleton className="h-[760px] rounded-[1.5rem]" />
      </div>
    </div>
  );
}

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
    () =>
      deriveDashboardMetrics({
        profile,
        tasks,
        mission,
        resumeAtsScore,
        interviewAverage,
      }),
    [interviewAverage, mission, profile, resumeAtsScore, tasks]
  );

  const pendingTasks = useMemo(
    () =>
      [...tasks]
        .filter((task) => task.status === "pending" || task.status === "in_progress")
        .sort((first, second) => {
          const priorityRank = { critical: 4, high: 3, medium: 2, low: 1 };
          const rankDifference =
            (priorityRank[second.priority] ?? 0) - (priorityRank[first.priority] ?? 0);
          if (rankDifference !== 0) return rankDifference;
          return new Date(first.created_at).getTime() - new Date(second.created_at).getTime();
        }),
    [tasks]
  );

  const projectIdeas = useMemo(
    () =>
      buildProjectIdeas({
        mission,
        skills: profile?.skills ?? [],
        pendingTasks,
      }),
    [mission, pendingTasks, profile?.skills]
  );

  useEffect(() => {
    let cancelled = false;

    async function persistScoreSnapshot(totalScore: number, breakdown: ScoreBreakdown) {
      if (!user) return null;

      const { data: existingScore, error: existingScoreError } = await supabase
        .from("hireability_scores")
        .select("*")
        .eq("user_id", user.id)
        .order("computed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingScoreError) {
        logDashboardWarning("[DASHBOARD] Unable to read hireability snapshot", existingScoreError);
        return null;
      }

      if (existingScore?.score === totalScore) {
        if (!cancelled) {
          setScoreSnapshot(existingScore);
        }
        return existingScore;
      }

      const { data: inserted, error: insertError } = await supabase
        .from("hireability_scores")
        .insert({
          user_id: user.id,
          score: totalScore,
          breakdown,
        })
        .select()
        .single();

      if (insertError) {
        logDashboardWarning("[DASHBOARD] Unable to persist hireability snapshot", insertError);
        return existingScore ?? null;
      }

      if (!cancelled) {
        setScoreSnapshot(inserted);
      }

      return inserted;
    }

    const fetchData = async () => {
      if (authLoading) return;

      if (!user) {
        if (!cancelled) {
          setMission(null);
          setTasks([]);
          setResumeAtsScore(0);
          setInterviewAverage(0);
          setScoreSnapshot(null);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setError(null);
      }

      try {
        const [
          { data: activeMission, error: missionError },
          { data: resume, error: resumeError },
          { data: logs, error: logsError },
        ] =
          await Promise.all([
            supabase
              .from("missions")
              .select("*")
              .eq("user_id", user.id)
              .eq("status", "active")
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("resumes")
              .select("ats_score")
              .eq("user_id", user.id)
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("interview_logs")
              .select("quiz_score")
              .eq("user_id", user.id),
          ]);

        if (missionError) {
          throw missionError;
        }

        if (resumeError) {
          logDashboardWarning("[DASHBOARD] Resume score query failed", resumeError);
        }

        if (logsError) {
          logDashboardWarning("[DASHBOARD] Interview logs query failed", logsError);
        }

        let missionTasks: Task[] = [];
        if (activeMission) {
          const { data: missionTaskRows, error: taskError } = await supabase
            .from("tasks")
            .select("*")
            .eq("mission_id", activeMission.id)
            .order("created_at", { ascending: true });

          if (taskError) {
            logDashboardWarning("[DASHBOARD] Mission tasks query failed", taskError);
          } else {
            missionTasks = missionTaskRows ?? [];
          }
        }

        const nextResumeScore = resume?.ats_score ?? 0;
        const nextInterviewAverage =
          logs && logs.length > 0
            ? logs.reduce((sum: number, log: { quiz_score: number | null }) => sum + (log.quiz_score || 0), 0) / logs.length
            : 0;

        const nextMetrics = deriveDashboardMetrics({
          profile,
          tasks: missionTasks,
          mission: activeMission,
          resumeAtsScore: nextResumeScore,
          interviewAverage: nextInterviewAverage,
        });

        if (activeMission && activeMission.progress !== nextMetrics.missionProgress) {
          const { error: missionProgressError } = await supabase
            .from("missions")
            .update({ progress: nextMetrics.missionProgress })
            .eq("id", activeMission.id);

          if (missionProgressError) {
            logDashboardWarning("[DASHBOARD] Mission progress sync failed", missionProgressError);
          }
        }

        if (cancelled) return;

        setMission(
          activeMission
            ? { ...activeMission, progress: nextMetrics.missionProgress }
            : null
        );
        setTasks(missionTasks);
        setResumeAtsScore(nextResumeScore);
        setInterviewAverage(nextInterviewAverage);

        await persistScoreSnapshot(nextMetrics.totalScore, nextMetrics.breakdown);
      } catch (dashboardError) {
        const serializedError = describeDashboardError(dashboardError);
        console.error(
          "Dashboard fetch error:",
          serializedError,
          JSON.stringify(serializedError)
        );
        if (!cancelled) {
          setError("We hit a sync issue while loading your command center.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [authLoading, profile, supabase, user]);

  const completeTask = async (taskId: string) => {
    if (!user || actionTaskId) return;

    const previousTasks = tasks;
    const completedAt = new Date().toISOString();
    const nextTasks = tasks.map((task) =>
      task.id === taskId
        ? { ...task, status: "completed" as const, completed_at: completedAt }
        : task
    );

    setActionTaskId(taskId);
    setTasks(nextTasks);

    const nextMetrics = deriveDashboardMetrics({
      profile,
      tasks: nextTasks,
      mission,
      resumeAtsScore,
      interviewAverage,
    });

    if (mission) {
      setMission({ ...mission, progress: nextMetrics.missionProgress });
    }

    try {
      const { error: taskError } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          completed_at: completedAt,
        })
        .eq("id", taskId);

      if (taskError) {
        throw taskError;
      }

      if (mission) {
        const { error: missionError } = await supabase
          .from("missions")
          .update({ progress: nextMetrics.missionProgress })
          .eq("id", mission.id);

        if (missionError) {
          throw missionError;
        }
      }

      const { data: insertedScore, error: scoreError } = await supabase
        .from("hireability_scores")
        .insert({
          user_id: user.id,
          score: nextMetrics.totalScore,
          breakdown: nextMetrics.breakdown,
        })
        .select()
        .single();

      if (scoreError) {
        const serializedError = describeDashboardError(scoreError);
        console.warn("[DASHBOARD] Task completion saved, but score snapshot failed", serializedError);
      } else {
        setScoreSnapshot(insertedScore);
      }
      toast.success("Task completed. Mission momentum increased.");
    } catch (taskUpdateError) {
      const serializedError = describeDashboardError(taskUpdateError);
      console.error("Dashboard task update error:", serializedError);
      setTasks(previousTasks);
      if (mission) {
        setMission(mission);
      }
      toast.error("We could not update that task. Please retry.");
    } finally {
      setActionTaskId(null);
    }
  };

  if (authLoading || loading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return null;
  }

  const firstName = profile?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "there";
  const userName = profile?.full_name || user.email?.split("@")[0] || "Operator";
  const missionTitle = mission?.title || "No active mission yet";
  const profileSummary = [
    profile?.industry ? `Industry: ${profile.industry}` : null,
    profile?.experience ? `Experience: ${profile.experience} years` : null,
    profile?.bio ? `Bio: ${profile.bio}` : null,
    profile?.skills?.length ? `Skills: ${profile.skills.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <div className="mx-auto max-w-7xl space-y-12">
      {/* Welcome Section - Flattened & Minimalist */}
      <section className="relative pt-6 pb-8">
        <div className="pointer-events-none absolute -inset-x-6 top-0 h-[400px] bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.03),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.02),transparent_40%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.14),transparent_20%)]" />
        <div className="relative">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1.2fr)_320px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                <Sparkles className="h-3.5 w-3.5" />
                AI Career Execution Platform
              </div>
              <h1 className="mt-6 text-4xl font-normal tracking-tight text-white sm:text-5xl">
                Welcome back, <span className="font-medium text-gradient-premium">{firstName}</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
                Your command center is live. Track progress, clear today’s execution queue,
                and use the AI mentor to turn momentum into interviews.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Badge variant="outline" className={cn("bg-transparent", mission ? "border-green-400/20 text-green-300" : "border-amber-400/20 text-amber-300")}>
                  {mission ? "Mission active" : "Mission needed"}
                </Badge>
                <span className="text-sm font-medium text-slate-300">
                  Hireability {metrics.totalScore}/100
                </span>
                <span className="text-sm font-medium text-slate-300">
                  {pendingTasks.length} live tasks
                </span>
              </div>

              <div className="mt-10 space-y-4 max-w-xl">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 font-medium">{missionTitle}</span>
                  <span className="text-slate-500">{metrics.missionProgress}% complete</span>
                </div>
                {/* Custom minimalist progress bar */}
                <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${metrics.missionProgress}%` }}
                  />
                </div>
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <Button asChild size="lg" className="rounded-xl shadow-ambient">
                  <Link href={mission ? "/tasks" : "/mission"}>
                    {mission ? "Open execution queue" : "Create your first mission"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="rounded-xl hover:bg-white/[0.03]">
                  <Link href="/resume">
                    Optimize resume
                    <TrendingUp className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <Target className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">Active mission</p>
                    <p className="mt-0.5 text-sm font-medium text-white">{mission ? "Locked in" : "Needs launch"}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <Flame className="h-4 w-4 text-amber-200" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">Streak</p>
                    <p className="mt-0.5 text-sm font-medium text-white">{metrics.streak > 0 ? `${metrics.streak} day run` : "Start today"}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <Brain className="h-4 w-4 text-cyan-200" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">AI mentor</p>
                    <p className="mt-0.5 text-sm font-medium text-white">Streaming live</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-[1.3rem] border border-rose-400/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Hireability"
          value={`${metrics.totalScore}/100`}
          detail="Composite score across profile, tasks, resume, and interview loops."
          icon={TrendingUp}
          accentClassName="bg-emerald-400/10 text-emerald-100"
        />
        <MetricCard
          title="Mission Progress"
          value={`${metrics.missionProgress}%`}
          detail="Completion signal for your current outcome."
          icon={Target}
          accentClassName="bg-violet-500/15 text-violet-100"
        />
        <MetricCard
          title="Execution Queue"
          value={`${metrics.pendingTasks}`}
          detail="Live actions waiting in your priority queue."
          icon={CheckSquare}
          accentClassName="bg-cyan-400/10 text-cyan-100"
        />
        <MetricCard
          title="Streak"
          value={metrics.streak > 0 ? `${metrics.streak}d` : "0d"}
          detail="Consistency score based on recent completed task days."
          icon={Flame}
          accentClassName="bg-amber-300/12 text-amber-100"
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.25fr)_420px]">
        <div className="space-y-8">
          <section>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.04] pb-4">
              <div>
                <h2 className="text-xl font-medium tracking-tight text-white">Execution Queue</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Clear the highest-leverage actions first.
                </p>
              </div>
              <Badge variant="outline" className="bg-white/[0.02] border-white/[0.05] text-slate-400 font-normal">
                {pendingTasks.length} pending
              </Badge>
            </div>
            
            <div className="space-y-1">
              {pendingTasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.05] bg-white/[0.01] px-6 py-12 text-center flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <CheckCircle2 className="h-5 w-5 text-slate-400" />
                  </div>
                  <h3 className="mt-4 text-sm font-medium text-white">Queue cleared</h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm">
                    No pending actions. Generate more tasks to maintain momentum.
                  </p>
                  <Button asChild variant="outline" className="mt-6 bg-transparent border-white/[0.05] hover:bg-white/[0.02] text-white">
                    <Link href={mission ? "/mission" : "/mission"}>
                      Plan next move
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <AnimatePresence initial={false}>
                    {pendingTasks.slice(0, 5).map((task) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        whileHover={{ y: -1 }}
                        transition={{ duration: 0.2 }}
                        className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-white/[0.02] border border-transparent hover:border-white/[0.02]"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h3 className="text-sm font-medium text-slate-200 truncate">
                              {task.title}
                            </h3>
                            <div className="flex shrink-0 items-center gap-2">
                              {task.status === "in_progress" && (
                                <span className="inline-flex items-center rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300">
                                  In progress
                                </span>
                              )}
                              <span className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border",
                                task.priority === "critical" ? "border-red-400/20 text-red-300 bg-red-400/10" :
                                task.priority === "high" ? "border-amber-400/20 text-amber-300 bg-amber-400/10" :
                                "border-white/5 text-slate-400 bg-white/5"
                              )}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                          {task.description && (
                            <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="shrink-0 h-8 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 opacity-0 sm:opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                          disabled={actionTaskId === task.id}
                          onClick={() => void completeTask(task.id)}
                        >
                          {actionTaskId === task.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3 mr-1.5" />
                          )}
                          Done
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <div className="pt-4 mt-2 border-t border-white/[0.03]">
                    <Button asChild variant="ghost" className="w-full text-xs text-slate-400 hover:text-white hover:bg-white/[0.02]">
                      <Link href="/tasks">
                        View all tasks
                        <ArrowRight className="h-3 w-3 ml-1.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <SkillGraph data={metrics.signalGraph} />

            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-white">Project radar</CardTitle>
                    <CardDescription>
                      Portfolio and execution ideas aligned to your current mission.
                    </CardDescription>
                  </div>
                  <Radar className="h-5 w-5 text-cyan-300" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {projectIdeas.map((project, index) => (
                  <motion.div
                    key={project.title}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-slate-300">
                        {project.label}
                      </Badge>
                      <span className="text-xs text-slate-500">0{index + 1}</span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-white">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {project.description}
                    </p>
                    <Button asChild variant="ghost" className="mt-4 h-auto px-0 text-cyan-200">
                      <Link href={project.href}>
                        Open module
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-white">Momentum snapshot</CardTitle>
                  <CardDescription>
                    A live read on execution quality across your career system.
                  </CardDescription>
                </div>
                {scoreSnapshot && (
                  <span className="text-xs uppercase tracking-[0.28em] text-slate-500">
                    latest score saved
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  Profile completion
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {metrics.profileCompletion}%
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Sharpening your profile raises discoverability and AI guidance quality.
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  Completed tasks
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {metrics.completedTasks}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Every finished action increases mission completion and score history.
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  Resume signal
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {resumeAtsScore || 0}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Current ATS score feeds directly into your hireability model.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <MentorPanel
          userId={user.id}
          userName={userName}
          missionTitle={mission?.title}
          profileSummary={profileSummary || "Profile setup is still in progress."}
          score={metrics.totalScore}
          pendingTaskTitles={pendingTasks.map((task) => task.title)}
        />
      </div>
    </div>
  );
}
