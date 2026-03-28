"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Sparkles,
  Target,
  Trophy,
  WandSparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { logAppError } from "@/lib/error-utils";
import { createClient } from "@/lib/supabase/client";
import {
  generateInterviewPrepPlanRequest,
  generateInterviewQuestionsRequest,
} from "@/lib/ai/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  InterviewLevel,
  InterviewLog,
  InterviewPreference,
  InterviewRole,
  InterviewType,
  QuestionResult,
} from "@/types";
import type { InterviewPrepPlan } from "@/services/ai";

type Phase = "configure" | "plan" | "mock" | "result";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
}

type InterviewSelection = {
  role: InterviewRole;
  level: InterviewLevel;
  interviewType: InterviewType;
};

const ROLE_OPTIONS: Array<{
  value: InterviewRole;
  label: string;
  description: string;
}> = [
  {
    value: "sde",
    label: "SDE",
    description: "Balanced software engineering preparation across coding, projects, and execution.",
  },
  {
    value: "frontend",
    label: "Frontend",
    description: "UI architecture, state management, browser behavior, and product sense.",
  },
  {
    value: "backend",
    label: "Backend",
    description: "APIs, data systems, scalability, and production engineering tradeoffs.",
  },
  {
    value: "ml_engineer",
    label: "ML Engineer",
    description: "Models, evaluation, data pipelines, and applied ML decision-making.",
  },
  {
    value: "core_engineering",
    label: "Core Engineering",
    description: "Systems, performance, low-level concepts, and engineering rigor.",
  },
];

const LEVEL_OPTIONS: Array<{
  value: InterviewLevel;
  label: string;
  description: string;
}> = [
  {
    value: "beginner",
    label: "Beginner",
    description: "Foundational preparation with guided structure and clear ramp-up.",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Interview-ready practice with realistic problems and sharper expectations.",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "Senior-level pressure testing, tradeoffs, communication, and depth.",
  },
];

const TYPE_OPTIONS: Array<{
  value: InterviewType;
  label: string;
  description: string;
}> = [
  {
    value: "dsa",
    label: "DSA",
    description: "Timed coding, patterns, complexity analysis, and problem-solving fluency.",
  },
  {
    value: "system_design",
    label: "System Design",
    description: "Architecture, scale, tradeoffs, APIs, reliability, and evolution.",
  },
  {
    value: "behavioral",
    label: "HR / Behavioral",
    description: "Stories, leadership, conflict, ownership, and communication under pressure.",
  },
  {
    value: "project_based",
    label: "Project-based",
    description: "Deep dives on your work, decisions, impact, and lessons learned.",
  },
  {
    value: "mixed",
    label: "Mixed",
    description: "A blended loop covering coding, system thinking, and communication.",
  },
];

function InterviewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[220px] rounded-[1.75rem]" />
      <Skeleton className="h-[320px] rounded-[1.5rem]" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[240px] rounded-[1.5rem]" />
        <Skeleton className="h-[240px] rounded-[1.5rem]" />
      </div>
    </div>
  );
}

function titleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferRoleFromProfile(skills: string[]): InterviewRole {
  const normalized = skills.map((skill) => skill.toLowerCase());

  if (normalized.some((skill) => ["react", "next.js", "nextjs", "css", "frontend"].includes(skill))) {
    return "frontend";
  }

  if (normalized.some((skill) => ["node", "backend", "api", "postgres", "sql"].includes(skill))) {
    return "backend";
  }

  if (normalized.some((skill) => ["ml", "machine learning", "pytorch", "tensorflow"].includes(skill))) {
    return "ml_engineer";
  }

  if (normalized.some((skill) => ["c++", "operating systems", "core", "computer networks"].includes(skill))) {
    return "core_engineering";
  }

  return "sde";
}

function inferLevelFromExperience(experience: number | null | undefined): InterviewLevel {
  if (!experience || experience <= 1) return "beginner";
  if (experience >= 4) return "advanced";
  return "intermediate";
}

function inferInterviewType(role: InterviewRole): InterviewType {
  if (role === "frontend" || role === "backend") return "project_based";
  if (role === "core_engineering") return "dsa";
  return "mixed";
}

function StepIndicator({ phase }: { phase: Phase }) {
  const steps: Array<{ key: Phase | "result"; label: string; activeWhen: Phase[] }> = [
    { key: "configure", label: "Setup", activeWhen: ["configure"] },
    { key: "plan", label: "AI Plan", activeWhen: ["plan"] },
    { key: "mock", label: "Mock Loop", activeWhen: ["mock", "result"] },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {steps.map((step, index) => {
        const active = step.activeWhen.includes(phase);
        const complete =
          (phase === "plan" || phase === "mock" || phase === "result") && index === 0 ||
          (phase === "mock" || phase === "result") && index === 1;

        return (
          <div
            key={step.label}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.22em] ${
              active
                ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
                : complete
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                  : "border-white/10 bg-white/[0.04] text-slate-500"
            }`}
          >
            <span>{index + 1}</span>
            <span>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function SelectionGroup<T extends string>({
  title,
  description,
  options,
  value,
  onChange,
}: {
  title: string;
  description: string;
  options: Array<{ value: T; label: string; description: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <motion.button
              key={option.value}
              type="button"
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onChange(option.value)}
              className={`rounded-[1.25rem] border p-4 text-left transition ${
                selected
                  ? "border-cyan-400/30 bg-cyan-400/[0.1] text-white shadow-[0_20px_50px_rgba(34,211,238,0.08)]"
                  : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]"
              }`}
            >
              <p className="text-sm font-semibold">{option.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{option.description}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default function InterviewPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [phase, setPhase] = useState<Phase>("configure");
  const [selection, setSelection] = useState<InterviewSelection>({
    role: inferRoleFromProfile(profile?.skills || []),
    level: inferLevelFromExperience(profile?.experience),
    interviewType: inferInterviewType(inferRoleFromProfile(profile?.skills || [])),
  });
  const [plan, setPlan] = useState<InterviewPrepPlan | null>(null);
  const [savingPreference, setSavingPreference] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [launchingMock, setLaunchingMock] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<InterviewLog | null>(null);
  const [history, setHistory] = useState<InterviewLog[]>([]);

  useEffect(() => {
    if (!profile) return;

    setSelection((current) => ({
      role: current.role || inferRoleFromProfile(profile.skills || []),
      level: current.level || inferLevelFromExperience(profile.experience),
      interviewType: current.interviewType || inferInterviewType(current.role),
    }));
  }, [profile]);

  useEffect(() => {
    if (!user) {
      setLoadingHistory(false);
      return;
    }

    let cancelled = false;

    Promise.all([
      supabase
        .from("interview_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("interview_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]).then(([historyResult, preferenceResult]) => {
      if (cancelled) return;

      if (historyResult.error) {
        logAppError("[INTERVIEW] Failed to load quiz history:", historyResult.error);
        toast.error("We could not load your interview history.");
      } else {
        setHistory(historyResult.data ?? []);
      }

      if (preferenceResult.error) {
        logAppError(
          "[INTERVIEW] Failed to load interview preferences:",
          preferenceResult.error
        );
      } else if (preferenceResult.data) {
        const preference = preferenceResult.data as InterviewPreference;
        setSelection({
          role: preference.role,
          level: preference.level,
          interviewType: preference.interview_type,
        });
      }

      setLoadingHistory(false);
    });

    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  const averageScore = useMemo(() => {
    if (history.length === 0) return 0;
    return Math.round(
      history.reduce((total, log) => total + (log.quiz_score ?? 0), 0) / history.length
    );
  }, [history]);

  const profileSkills = profile?.skills ?? [];

  const savePreference = async () => {
    if (!user) return;

    setSavingPreference(true);
    try {
      const { error } = await supabase.from("interview_preferences").upsert(
        {
          user_id: user.id,
          role: selection.role,
          level: selection.level,
          interview_type: selection.interviewType,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (error) {
        throw error;
      }
    } catch (error) {
      logAppError("[INTERVIEW] Failed to save preferences:", error);
      throw error;
    } finally {
      setSavingPreference(false);
    }
  };

  const generatePlan = async () => {
    if (!user) return;

    setGeneratingPlan(true);

    try {
      await savePreference();
      const nextPlan = await generateInterviewPrepPlanRequest({
        role: titleCase(selection.role),
        level: titleCase(selection.level),
        interviewType: titleCase(selection.interviewType),
        industry: profile?.industry || "technology",
        skills: profileSkills,
      });

      setPlan(nextPlan);
      setPhase("plan");
      toast.success("Personalized interview plan generated.");
    } catch (error) {
      logAppError("[INTERVIEW AI] Failed to generate plan:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "We could not generate your interview plan."
      );
    } finally {
      setGeneratingPlan(false);
    }
  };

  const startMockInterview = async () => {
    setLaunchingMock(true);

    try {
      await savePreference();
      const data = await generateInterviewQuestionsRequest({
        industry: profile?.industry || "technology",
        skills: profileSkills,
        role: titleCase(selection.role),
        level: titleCase(selection.level),
        interviewType: titleCase(selection.interviewType),
      });

      setQuestions(data);
      setCurrentIndex(0);
      setAnswers({});
      setResults(null);
      setPhase("mock");
      toast.success("Mock interview ready.");
    } catch (error) {
      logAppError("[INTERVIEW AI] Failed to generate mock interview:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "We could not start your mock interview."
      );
    } finally {
      setLaunchingMock(false);
    }
  };

  const selectAnswer = (answer: string) => {
    setAnswers((current) => ({ ...current, [currentIndex]: answer }));
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((index) => index + 1);
      return;
    }

    void submitQuiz();
  };

  const submitQuiz = async () => {
    if (!user) return;

    const questionResults: QuestionResult[] = questions.map((question, index) => ({
      question: question.question,
      options: question.options,
      correct_answer: question.correctAnswer,
      user_answer: answers[index] || "",
      is_correct: answers[index] === question.correctAnswer,
      explanation: question.explanation,
      difficulty: question.difficulty as "easy" | "medium" | "hard",
    }));

    const correctCount = questionResults.filter((entry) => entry.is_correct).length;
    const score = Math.round((correctCount / questions.length) * 100);

    const log = {
      user_id: user.id,
      quiz_score: score,
      questions: questionResults,
      improvement_tip:
        score < 70
          ? `Focus on ${titleCase(selection.interviewType)} patterns and rehearse project stories with clearer structure.`
          : `Strong performance. Keep sharpening ${titleCase(selection.interviewType)} communication and depth.`,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("interview_logs").insert(log).select().single();

    if (error) {
      logAppError("[INTERVIEW] Failed to persist quiz log:", error);
      toast.error("Your results were generated, but we could not save the session.");
      setPhase("result");
      return;
    }

    setResults(data);
    setHistory((current) => [data, ...current].slice(0, 5));
    setPhase("result");
  };

  const question = questions[currentIndex];

  if (loadingHistory) {
    return <InterviewSkeleton />;
  }

  return (
    <div className="space-y-6">
      <Card className="glass-panel-strong relative overflow-hidden border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.14),transparent_20%)]" />
        <CardContent className="relative p-6 sm:p-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_320px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                Interview engine
              </div>
              <h1 className="mt-5 text-4xl font-semibold text-white sm:text-5xl">
                Personalized interview prep with
                <span className="text-gradient-premium"> AI guidance</span>.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Configure your target role, current level, and interview focus. ELEV8
                generates a structured prep plan, then launches a contextual mock loop.
              </p>
              <div className="mt-6">
                <StepIndicator phase={phase} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {[
                { label: "Sessions", value: history.length || 0, tone: "text-cyan-100" },
                {
                  label: "Average score",
                  value: history.length ? `${averageScore}%` : "No data",
                  tone: "text-violet-100",
                },
                {
                  label: "Suggested track",
                  value: titleCase(selection.role),
                  tone: "text-slate-100",
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

      {phase === "configure" ? (
        <Card className="border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Configure your interview prep</CardTitle>
            <CardDescription>
              Your choices are saved to Supabase, reused for later sessions, and used to
              generate a custom prep plan and mock interview flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex flex-wrap gap-2">
              {profileSkills.slice(0, 6).map((skill) => (
                <Badge
                  key={skill}
                  className="border-violet-400/20 bg-violet-400/10 text-violet-100"
                >
                  {skill}
                </Badge>
              ))}
              {profileSkills.length === 0 ? (
                <Badge className="border-white/10 bg-white/[0.05] text-slate-300">
                  Add profile skills for stronger recommendations
                </Badge>
              ) : null}
            </div>

            <SelectionGroup
              title="Role"
              description="Choose the role track you want this prep system to optimize for."
              options={ROLE_OPTIONS}
              value={selection.role}
              onChange={(role) =>
                setSelection((current) => ({
                  ...current,
                  role,
                  interviewType:
                    current.interviewType || inferInterviewType(role),
                }))
              }
            />

            <SelectionGroup
              title="Experience level"
              description="This changes the difficulty, communication expectations, and study emphasis."
              options={LEVEL_OPTIONS}
              value={selection.level}
              onChange={(level) => setSelection((current) => ({ ...current, level }))}
            />

            <SelectionGroup
              title="Interview type"
              description="Pick the area you want to prepare for right now."
              options={TYPE_OPTIONS}
              value={selection.interviewType}
              onChange={(interviewType) =>
                setSelection((current) => ({ ...current, interviewType }))
              }
            />

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                onClick={generatePlan}
                disabled={savingPreference || generatingPlan}
              >
                {savingPreference || generatingPlan ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <WandSparkles className="h-4 w-4" />
                )}
                {generatingPlan ? "Generating plan..." : "Generate AI prep plan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {phase === "plan" && plan ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Your personalized prep plan</p>
              <p className="mt-1 text-sm text-slate-400">{plan.summary}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => setPhase("configure")}>
                <ChevronLeft className="h-4 w-4" />
                Back to setup
              </Button>
              <Button
                type="button"
                onClick={startMockInterview}
                disabled={launchingMock || savingPreference}
              >
                {launchingMock ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
                {launchingMock ? "Launching..." : "Start mock interview"}
              </Button>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Topics to study</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.topics.map((topic) => (
                  <div
                    key={topic.title}
                    className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{topic.title}</p>
                      <Badge
                        className={
                          topic.priority === "high"
                            ? "border-rose-400/20 bg-rose-400/10 text-rose-100"
                            : topic.priority === "medium"
                              ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
                              : "border-white/10 bg-white/[0.06] text-slate-300"
                        }
                      >
                        {topic.priority}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-slate-400">{topic.reason}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Practice questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.practiceQuestions.map((question, index) => (
                  <div
                    key={`${question}-${index}`}
                    className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400/12 text-xs font-semibold text-cyan-100">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-7 text-slate-300">{question}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Mock interview tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.mockTasks.map((task, index) => (
                  <div
                    key={`${task}-${index}`}
                    className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex gap-3">
                      <Target className="mt-1 h-4 w-4 text-violet-200" />
                      <p className="text-sm leading-7 text-slate-300">{task}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.timeline.map((phaseItem) => (
                  <div
                    key={phaseItem.label}
                    className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      {phaseItem.label}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      {phaseItem.focus}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {phase === "mock" && question ? (
        <div className="space-y-4">
          <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                  {titleCase(selection.role)}
                </Badge>
                <Badge className="border-violet-400/20 bg-violet-400/10 text-violet-100">
                  {titleCase(selection.level)}
                </Badge>
                <Badge className="border-white/10 bg-white/[0.06] text-slate-300">
                  {titleCase(selection.interviewType)}
                </Badge>
              </div>
              <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
                {currentIndex + 1}/{questions.length}
              </span>
            </div>
            <Progress
              value={((currentIndex + 1) / questions.length) * 100}
              className="h-2"
            />
          </div>

          <Card className="border-white/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Mock interview question
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">
                    {question.question}
                  </h2>
                </div>
                <Badge className="border-violet-400/20 bg-violet-400/10 text-violet-100">
                  {question.difficulty}
                </Badge>
              </div>

              <div className="mt-6 space-y-3">
                {question.options.map((option, index) => {
                  const selected = answers[currentIndex] === option;

                  return (
                    <motion.button
                      key={option}
                      type="button"
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => selectAnswer(option)}
                      className={`w-full rounded-[1.2rem] border p-4 text-left transition ${
                        selected
                          ? "border-cyan-400/30 bg-cyan-400/[0.1] text-white"
                          : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                            selected
                              ? "bg-cyan-400/20 text-cyan-100"
                              : "bg-white/[0.06] text-slate-400"
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </div>
                        <p className="text-sm leading-7">{option}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap justify-between gap-3">
                <Button type="button" variant="outline" onClick={() => setPhase("plan")}>
                  <ChevronLeft className="h-4 w-4" />
                  Back to plan
                </Button>
                <Button type="button" onClick={nextQuestion} disabled={!answers[currentIndex]}>
                  {currentIndex === questions.length - 1 ? "Finish mock loop" : "Next question"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {phase === "result" && results ? (
        <div className="space-y-4">
          <Card className="border-white/10">
            <CardContent className="p-6 text-center">
              <Trophy className="mx-auto h-12 w-12 text-amber-300" />
              <p
                className={`mt-4 text-5xl font-semibold ${
                  results.quiz_score >= 70
                    ? "text-emerald-300"
                    : results.quiz_score >= 50
                      ? "text-amber-200"
                      : "text-rose-200"
                }`}
              >
                {results.quiz_score}%
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                {(results.questions as QuestionResult[]).filter((entry) => entry.is_correct).length} of{" "}
                {results.questions.length} correct
              </p>
              {results.improvement_tip ? (
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                  {results.improvement_tip}
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button type="button" variant="outline" onClick={() => setPhase("plan")}>
                  <ChevronLeft className="h-4 w-4" />
                  Back to plan
                </Button>
                <Button type="button" onClick={startMockInterview} disabled={launchingMock}>
                  {launchingMock ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {launchingMock ? "Launching..." : "Run another mock loop"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {(results.questions as QuestionResult[]).map((entry, index) => (
            <motion.div
              key={`${entry.question}-${index}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="border-white/10">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="max-w-3xl text-sm font-medium leading-7 text-white">
                      {entry.question}
                    </p>
                    <Badge
                      className={
                        entry.is_correct
                          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                          : "border-rose-400/20 bg-rose-400/10 text-rose-100"
                      }
                    >
                      {entry.is_correct ? (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      ) : (
                        <XCircle className="mr-1 h-3 w-3" />
                      )}
                      {entry.is_correct ? "Correct" : "Needs work"}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                        Your answer
                      </p>
                      <p
                        className={`mt-2 text-sm leading-7 ${
                          entry.is_correct ? "text-emerald-100" : "text-rose-100"
                        }`}
                      >
                        {entry.user_answer || "No answer submitted"}
                      </p>
                    </div>

                    {!entry.is_correct ? (
                      <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                          Stronger answer
                        </p>
                        <p className="mt-2 text-sm leading-7 text-emerald-100">
                          {entry.correct_answer}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-[1.15rem] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      AI feedback
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{entry.explanation}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : null}

      {phase === "configure" && history.length > 0 ? (
        <Card className="border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Recent mock loops</CardTitle>
            <CardDescription>
              Your most recent interview sessions so you can track momentum over time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-4"
              >
                <div>
                  <p className="text-sm font-medium text-white">{entry.quiz_score}% score</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">
                    {new Date(entry.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge
                  className={
                    entry.quiz_score >= 70
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                      : entry.quiz_score >= 50
                        ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
                        : "border-rose-400/20 bg-rose-400/10 text-rose-100"
                  }
                >
                  score signal
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
