"use client";

import { useEffect, useMemo, useState, useCallback, useRef, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { shivaBuild, shivaTransform, vishnuContainer, vishnuItem, vishnuList, vishnuListItem } from "@/lib/motion";
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

const ROLE_OPTIONS: Array<{ value: InterviewRole; label: string }> = [
  { value: "sde", label: "SDE" },
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "ml_engineer", label: "ML Engineer" },
  { value: "core_engineering", label: "Core" },
];

const LEVEL_OPTIONS: Array<{ value: InterviewLevel; label: string }> = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const TYPE_OPTIONS: Array<{ value: InterviewType; label: string }> = [
  { value: "dsa", label: "DSA" },
  { value: "system_design", label: "System Design" },
  { value: "behavioral", label: "Behavioral" },
  { value: "project_based", label: "Project" },
  { value: "mixed", label: "Mixed" },
];

function titleCase(value: string) {
  return value.split(/[_\s-]+/).filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

function inferRoleFromProfile(skills: string[]): InterviewRole {
  const n = skills.map((s) => s.toLowerCase());
  if (n.some((s) => ["react", "next.js", "nextjs", "css", "frontend"].includes(s))) return "frontend";
  if (n.some((s) => ["node", "backend", "api", "postgres", "sql"].includes(s))) return "backend";
  if (n.some((s) => ["ml", "machine learning", "pytorch", "tensorflow"].includes(s))) return "ml_engineer";
  if (n.some((s) => ["c++", "operating systems", "core", "computer networks"].includes(s))) return "core_engineering";
  return "sde";
}
function inferLevelFromExperience(exp: number | null | undefined): InterviewLevel {
  if (!exp || exp <= 1) return "beginner"; if (exp >= 4) return "advanced"; return "intermediate";
}
function inferInterviewType(role: InterviewRole): InterviewType {
  if (role === "frontend" || role === "backend") return "project_based";
  if (role === "core_engineering") return "dsa"; return "mixed";
}

/* ─── Pill Selector ───────────────────────────────────────────────── */

const PillSelector = memo(function PillSelector<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="kriya-label">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all duration-200",
                active
                  ? "bg-white/[0.08] text-white border border-white/[0.1]"
                  : "text-slate-500 hover:text-slate-300 border border-transparent hover:border-white/[0.04]"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
});

/* ─── Step Bar ────────────────────────────────────────────────────── */

const StepBar = memo(function StepBar({ phase }: { phase: Phase }) {
  const steps = [
    { key: "configure", label: "Setup" },
    { key: "plan", label: "Plan" },
    { key: "mock", label: "Mock" },
  ] as const;
  const phaseIndex = { configure: 0, plan: 1, mock: 2, result: 2 };
  const current = phaseIndex[phase];

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center gap-2">
          <span className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium transition-colors",
            i < current ? "bg-white/[0.08] text-emerald-300" :
            i === current ? "bg-white/[0.08] text-white" :
            "bg-white/[0.02] text-slate-600"
          )}>
            {i < current ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
          </span>
          <span className={cn("text-[11px] uppercase tracking-wider", i <= current ? "text-slate-300" : "text-slate-600")}>
            {step.label}
          </span>
          {i < steps.length - 1 && <span className="text-slate-700 text-[10px]">→</span>}
        </div>
      ))}
    </div>
  );
});

/* ─── Main Page ───────────────────────────────────────────────────── */

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
    setSelection((c) => ({
      role: c.role || inferRoleFromProfile(profile.skills || []),
      level: c.level || inferLevelFromExperience(profile.experience),
      interviewType: c.interviewType || inferInterviewType(c.role),
    }));
  }, [profile]);

  useEffect(() => {
    if (!user) { setLoadingHistory(false); return; }
    let cancelled = false;
    Promise.all([
      supabase.from("interview_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      supabase.from("interview_preferences").select("*").eq("user_id", user.id).maybeSingle(),
    ]).then(([historyResult, preferenceResult]) => {
      if (cancelled) return;
      if (historyResult.error) { logAppError("[INTERVIEW] history:", historyResult.error); }
      else setHistory(historyResult.data ?? []);
      if (!preferenceResult.error && preferenceResult.data) {
        const p = preferenceResult.data as InterviewPreference;
        setSelection({ role: p.role, level: p.level, interviewType: p.interview_type });
      }
      setLoadingHistory(false);
    });
    return () => { cancelled = true; };
  }, [supabase, user]);

  const averageScore = useMemo(() => {
    if (history.length === 0) return 0;
    return Math.round(history.reduce((s, l) => s + (l.quiz_score ?? 0), 0) / history.length);
  }, [history]);

  const profileSkills = useMemo(() => profile?.skills ?? [], [profile?.skills]);

  const savePreference = useCallback(async () => {
    if (!user) return;
    setSavingPreference(true);
    try {
      const { error } = await supabase.from("interview_preferences").upsert(
        { user_id: user.id, role: selection.role, level: selection.level, interview_type: selection.interviewType, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
      if (error) throw error;
    } catch (e) { logAppError("[INTERVIEW] Save pref failed:", e); throw e; }
    finally { setSavingPreference(false); }
  }, [selection, supabase, user]);

  const generatePlan = useCallback(async () => {
    if (!user) return;
    setGeneratingPlan(true);
    try {
      await savePreference();
      const nextPlan = await generateInterviewPrepPlanRequest({
        role: titleCase(selection.role), level: titleCase(selection.level),
        interviewType: titleCase(selection.interviewType),
        industry: profile?.industry || "technology", skills: profileSkills,
      });
      setPlan(nextPlan); setPhase("plan");
      toast.success("Prep plan generated.");
    } catch (e) {
      logAppError("[INTERVIEW AI] Plan failed:", e);
      toast.error(e instanceof Error ? e.message : "Could not generate plan.");
    } finally { setGeneratingPlan(false); }
  }, [profileSkills, profile, savePreference, selection, user]);

  const startMockInterview = useCallback(async () => {
    setLaunchingMock(true);
    try {
      await savePreference();
      const data = await generateInterviewQuestionsRequest({
        industry: profile?.industry || "technology", skills: profileSkills,
        role: titleCase(selection.role), level: titleCase(selection.level),
        interviewType: titleCase(selection.interviewType),
      });
      setQuestions(data); setCurrentIndex(0); setAnswers({}); setResults(null); setPhase("mock");
      toast.success("Mock interview ready.");
    } catch (e) {
      logAppError("[INTERVIEW AI] Mock failed:", e);
      toast.error(e instanceof Error ? e.message : "Could not start mock.");
    } finally { setLaunchingMock(false); }
  }, [profileSkills, profile, savePreference, selection]);

  const selectAnswer = useCallback((answer: string) => {
    setAnswers((c) => ({ ...c, [currentIndex]: answer }));
  }, [currentIndex]);

  const submitQuizRef = useRef<(() => Promise<void>) | undefined>(undefined);

  const nextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) { setCurrentIndex((i) => i + 1); return; }
    void submitQuizRef.current?.();
  }, [currentIndex, questions.length]);

  const submitQuiz = useCallback(async () => {
    if (!user) return;
    const questionResults: QuestionResult[] = questions.map((q, i) => ({
      question: q.question, options: q.options, correct_answer: q.correctAnswer,
      user_answer: answers[i] || "", is_correct: answers[i] === q.correctAnswer,
      explanation: q.explanation, difficulty: q.difficulty as "easy" | "medium" | "hard",
    }));
    const correctCount = questionResults.filter((e) => e.is_correct).length;
    const score = Math.round((correctCount / questions.length) * 100);
    const log = {
      user_id: user.id, quiz_score: score, questions: questionResults,
      improvement_tip: score < 70
        ? `Focus on ${titleCase(selection.interviewType)} patterns and rehearse project stories with clearer structure.`
        : `Strong performance. Keep sharpening ${titleCase(selection.interviewType)} communication and depth.`,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from("interview_logs").insert(log).select().single();
    if (error) { logAppError("[INTERVIEW] Save failed:", error); toast.error("Results generated but could not save."); setPhase("result"); return; }
    setResults(data); setHistory((c) => [data, ...c].slice(0, 5)); setPhase("result");
  }, [user, questions, answers, selection.interviewType, supabase]);

  // Keep submitQuizRef in sync so nextQuestion always calls the latest version
  useEffect(() => { submitQuizRef.current = submitQuiz; }, [submitQuiz]);

  const question = questions[currentIndex];

  if (loadingHistory) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <span className="text-3xl" style={{ color: "hsl(var(--kriya-primary))", animation: "kriya-glyph-pulse 2.4s ease-in-out infinite" }}>◈</span>
          <p className="kriya-label">Loading interview engine</p>
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
            <p className="kriya-label mb-3">Interview Engine</p>
            <h2 className="kriya-serif text-3xl sm:text-4xl font-light text-white leading-tight">
              Personalized prep with <span className="text-gradient-premium">AI guidance</span>.
            </h2>
          </div>
          <div className="flex items-center gap-x-6 gap-y-2 text-[12px] text-slate-500 shrink-0">
            <span>Sessions: <span className="text-slate-300 font-medium">{history.length}</span></span>
            <span>Avg: <span className="text-slate-300 font-medium">{history.length ? `${averageScore}%` : "—"}</span></span>
          </div>
        </div>
        <div className="mt-5">
          <StepBar phase={phase} />
        </div>
      </section>

      <div className="kriya-divider" />

      {/* ─── CONFIGURE Phase ────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {phase === "configure" && (
          <motion.div key="configure" variants={shivaTransform} initial="initial" animate="animate" exit="exit">
            <section className="py-8 space-y-6">
              {profileSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profileSkills.slice(0, 6).map((s) => (
                    <span key={s} className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[10px] text-slate-400">{s}</span>
                  ))}
                </div>
              )}
              <PillSelector label="Role" options={ROLE_OPTIONS} value={selection.role}
                onChange={(role) => setSelection((c) => ({ ...c, role: role as InterviewRole, interviewType: c.interviewType || inferInterviewType(role as InterviewRole) }))} />
              <PillSelector label="Level" options={LEVEL_OPTIONS} value={selection.level}
                onChange={(level) => setSelection((c) => ({ ...c, level: level as InterviewLevel }))} />
              <PillSelector label="Type" options={TYPE_OPTIONS} value={selection.interviewType}
                onChange={(interviewType) => setSelection((c) => ({ ...c, interviewType: interviewType as InterviewType }))} />
              <div className="flex justify-end pt-2">
                <Button onClick={generatePlan} disabled={savingPreference || generatingPlan} className="rounded-xl">
                  {generatingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                  {generatingPlan ? "Generating..." : "Generate prep plan"}
                </Button>
              </div>
            </section>

            {/* History */}
            {history.length > 0 && (
              <>
                <div className="kriya-divider" />
                <section className="py-8">
                  <p className="kriya-label mb-4">Recent sessions</p>
                  <div className="space-y-1">
                    {history.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-sm font-medium",
                            entry.quiz_score >= 70 ? "text-emerald-300" : entry.quiz_score >= 50 ? "text-amber-200" : "text-rose-200"
                          )}>{entry.quiz_score}%</span>
                          <span className="text-[11px] text-slate-500">{new Date(entry.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </motion.div>
        )}

        {/* ─── PLAN Phase ───────────────────────────────────────── */}
        {phase === "plan" && plan && (
          <motion.div key="plan" variants={shivaTransform} initial="initial" animate="animate" exit="exit">
            <section className="py-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <p className="kriya-label mb-2">Your prep plan</p>
                  <p className="text-sm text-slate-400">{plan.summary}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => setPhase("configure")} className="text-slate-400">
                    <ChevronLeft className="h-3.5 w-3.5" /> Setup
                  </Button>
                  <Button size="sm" onClick={startMockInterview} disabled={launchingMock} className="rounded-xl">
                    {launchingMock ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
                    {launchingMock ? "Launching..." : "Start mock"}
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Topics */}
                <div className="space-y-3">
                  <p className="kriya-label">Topics to study</p>
                  {plan.topics.map((topic) => (
                    <div key={topic.title} className="rounded-xl border border-white/[0.03] bg-white/[0.01] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-medium text-slate-300">{topic.title}</p>
                        <span className={cn(
                          "text-[10px] uppercase tracking-wider",
                          topic.priority === "high" ? "text-rose-300" : topic.priority === "medium" ? "text-cyan-300" : "text-slate-500"
                        )}>{topic.priority}</span>
                      </div>
                      <p className="mt-2 text-[12px] text-slate-500 leading-relaxed">{topic.reason}</p>
                    </div>
                  ))}
                </div>

                {/* Practice Questions */}
                <div className="space-y-3">
                  <p className="kriya-label">Practice questions</p>
                  {plan.practiceQuestions.map((q, i) => (
                    <div key={`${q}-${i}`} className="flex gap-3 rounded-xl border border-white/[0.03] bg-white/[0.01] p-4">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.04] text-[10px] text-slate-500 shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-[12px] text-slate-400 leading-relaxed">{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Timeline */}
            <div className="kriya-divider" />
            <section className="py-8">
              <p className="kriya-label mb-4">Timeline</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {plan.timeline.map((p) => (
                  <div key={p.label} className="rounded-xl border border-white/[0.03] bg-white/[0.01] p-4">
                    <p className="kriya-label">{p.label}</p>
                    <p className="mt-2 text-[12px] text-slate-400 leading-relaxed">{p.focus}</p>
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {/* ─── MOCK Phase ───────────────────────────────────────── */}
        {phase === "mock" && question && (
          <motion.div key={`mock-${currentIndex}`} variants={shivaTransform} initial="initial" animate="animate" exit="exit">
            <section className="py-10">
              {/* Progress */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="uppercase tracking-wider">{titleCase(selection.role)}</span>
                  <span>·</span>
                  <span className="uppercase tracking-wider">{titleCase(selection.level)}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">{currentIndex + 1}/{questions.length}</span>
              </div>
              <div className="h-1 w-full rounded-full bg-white/[0.04] overflow-hidden mb-8">
                <div className="h-full rounded-full bg-white/20" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
              </div>

              {/* Question */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <h3 className="kriya-serif text-xl sm:text-2xl font-light text-white leading-snug flex-1">
                  {question.question}
                </h3>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 shrink-0 mt-1">{question.difficulty}</span>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {question.options.map((option, index) => {
                  const selected = answers[currentIndex] === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => selectAnswer(option)}
                      className={cn(
                        "w-full flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200",
                        selected
                          ? "border-white/[0.12] bg-white/[0.04] text-white"
                          : "border-white/[0.04] bg-white/[0.01] text-slate-400 hover:border-white/[0.08] hover:bg-white/[0.02]"
                      )}
                    >
                      <span className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium shrink-0 mt-0.5",
                        selected ? "bg-white/[0.08] text-white" : "bg-white/[0.03] text-slate-600"
                      )}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <p className="text-[13px] leading-relaxed">{option}</p>
                    </button>
                  );
                })}
              </div>

              {/* Nav */}
              <div className="mt-8 flex justify-between gap-3">
                <Button variant="ghost" size="sm" onClick={() => setPhase("plan")} className="text-slate-400">
                  <ChevronLeft className="h-3.5 w-3.5" /> Plan
                </Button>
                <Button onClick={nextQuestion} disabled={!answers[currentIndex]} className="rounded-xl">
                  {currentIndex === questions.length - 1 ? "Finish" : "Next"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </section>
          </motion.div>
        )}

        {/* ─── RESULT Phase ─────────────────────────────────────── */}
        {phase === "result" && results && (
          <motion.div key="result" variants={shivaBuild} initial="initial" animate="animate">
            <section className="py-14 text-center">
              <Trophy className="mx-auto h-8 w-8 text-amber-300/80" />
              <p className={cn(
                "mt-4 kriya-serif text-5xl font-light",
                results.quiz_score >= 70 ? "text-emerald-300" : results.quiz_score >= 50 ? "text-amber-200" : "text-rose-200"
              )}>
                {results.quiz_score}%
              </p>
              <p className="mt-3 text-sm text-slate-400">
                {(results.questions as QuestionResult[]).filter((e) => e.is_correct).length} of {results.questions.length} correct
              </p>
              {results.improvement_tip && (
                <p className="mt-4 mx-auto max-w-lg text-[13px] text-slate-400 leading-relaxed">{results.improvement_tip}</p>
              )}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setPhase("plan")} className="text-slate-400">
                  <ChevronLeft className="h-3.5 w-3.5" /> Plan
                </Button>
                <Button onClick={startMockInterview} disabled={launchingMock} className="rounded-xl">
                  {launchingMock ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {launchingMock ? "Launching..." : "Run again"}
                </Button>
              </div>
            </section>

            {/* Question breakdown */}
            <div className="kriya-divider" />
            <motion.section variants={vishnuContainer} initial="hidden" animate="visible" className="py-8 space-y-3">
              <p className="kriya-label mb-4">Question breakdown</p>
              {(results.questions as QuestionResult[]).map((entry, index) => (
                <motion.div key={`${entry.question}-${index}`} variants={vishnuItem}
                  className="rounded-xl border border-white/[0.03] bg-white/[0.01] p-5"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="text-[13px] font-medium text-slate-300 leading-relaxed flex-1">{entry.question}</p>
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[10px] uppercase tracking-wider shrink-0",
                      entry.is_correct ? "text-emerald-300" : "text-rose-300"
                    )}>
                      {entry.is_correct ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {entry.is_correct ? "Correct" : "Wrong"}
                    </span>
                  </div>

                  <div className="space-y-2 text-[12px]">
                    <div className="flex gap-2">
                      <span className="text-slate-600 shrink-0 w-16">Your pick:</span>
                      <span className={entry.is_correct ? "text-emerald-300" : "text-rose-300"}>{entry.user_answer || "—"}</span>
                    </div>
                    {!entry.is_correct && (
                      <div className="flex gap-2">
                        <span className="text-slate-600 shrink-0 w-16">Answer:</span>
                        <span className="text-emerald-300">{entry.correct_answer}</span>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-[12px] text-slate-500 leading-relaxed">{entry.explanation}</p>
                </motion.div>
              ))}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
