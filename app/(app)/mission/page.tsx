"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Pause,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { logAppError, logAppWarning } from "@/lib/error-utils";
import { createClient } from "@/lib/supabase/client";
import { generateCareerMissionRequest } from "@/lib/ai/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { Mission } from "@/types";

const statusStyles: Record<Mission["status"], string> = {
  active: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  paused: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  completed: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
  abandoned: "border-white/10 bg-white/[0.06] text-slate-300",
};

function MissionSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[220px] rounded-[1.75rem]" />
      <Skeleton className="h-[240px] rounded-[1.5rem]" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[220px] rounded-[1.5rem]" />
        <Skeleton className="h-[220px] rounded-[1.5rem]" />
      </div>
    </div>
  );
}

export default function MissionPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    target_role: "",
    target_company: "",
    goal: "",
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    supabase
      .from("missions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }: { data: Mission[] | null; error: any }) => {
        if (cancelled) return;

        if (error) {
          logAppError("[MISSION] Failed to fetch missions:", error);
          toast.error("We could not load your missions right now.");
          setLoading(false);
          return;
        }

        setMissions(data ?? []);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  const activeMission = missions.find((mission) => mission.status === "active") ?? null;
  const activeCount = missions.filter((mission) => mission.status === "active").length;
  const completedCount = missions.filter((mission) => mission.status === "completed").length;
  const pausedCount = missions.filter((mission) => mission.status === "paused").length;

  const averageProgress = useMemo(() => {
    if (missions.length === 0) return 0;
    return Math.round(
      missions.reduce((total, mission) => total + (mission.progress ?? 0), 0) /
        missions.length
    );
  }, [missions]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !form.target_role.trim()) return;

    setCreating(true);

    try {
      const plan = await generateCareerMissionRequest({
        role: form.target_role.trim(),
        company: form.target_company.trim() || undefined,
        experience: profile?.experience ? `${profile.experience} years` : "Mid-level",
        description: form.goal.trim() || undefined,
      });

      const missionTitle = plan.mission_title?.trim() || `Land a ${form.target_role.trim()} role`;
      const missionDescription =
        plan.mission_description?.trim() ||
        `Focused execution plan for ${form.target_role.trim()} opportunities.`;
      const normalizedTasks = (plan.tasks ?? []).filter((task) => task.title?.trim());

      const { data: newMission, error: missionError } = await supabase
        .from("missions")
        .insert({
          user_id: user.id,
          title: missionTitle,
          description: missionDescription,
          target_role: form.target_role.trim(),
          target_company: form.target_company.trim() || null,
          status: "active",
          progress: 0,
        })
        .select()
        .single();

      if (missionError) {
        throw missionError;
      }

      if (normalizedTasks.length > 0) {
        const tasksToInsert = normalizedTasks.map((task) => ({
          user_id: user.id,
          mission_id: newMission.id,
          title: task.title,
          description: task.description,
          priority: task.priority || "medium",
          status: "pending",
        }));

        const { error: taskInsertError } = await supabase.from("tasks").insert(tasksToInsert);
        if (taskInsertError) {
          logAppWarning(
            "[MISSION] Mission created, but task generation persistence failed:",
            taskInsertError
          );
        }
      }

      setMissions((current) => [newMission, ...current]);
      setShowForm(false);
      setForm({ target_role: "", target_company: "", goal: "" });
      toast.success("AI mission created. Your execution queue is live.");
    } catch (error) {
      logAppError("[MISSION AI] Failed to generate mission:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate your mission."
      );
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (id: string, status: Mission["status"]) => {
    const previous = missions;
    setMissions((current) =>
      current.map((mission) => (mission.id === id ? { ...mission, status } : mission))
    );

    const { error } = await supabase.from("missions").update({ status }).eq("id", id);

    if (error) {
      setMissions(previous);
      toast.error(error.message);
      return;
    }

    toast.success(`Mission marked ${status}.`);
  };

  if (loading) {
    return <MissionSkeleton />;
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
                Mission control
              </div>
              <h1 className="mt-5 text-4xl font-semibold text-white sm:text-5xl">
                Turn ambition into an
                <span className="text-gradient-premium"> execution system</span>.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Define the role you want, let AI structure the path, and keep every
                milestone visible from first signal to final interview loop.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button type="button" size="lg" onClick={() => setShowForm((value) => !value)}>
                  <Plus className="h-4 w-4" />
                  {showForm ? "Hide mission builder" : "Create AI mission"}
                </Button>
                {activeMission ? (
                  <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
                    Active mission:
                    <span className="ml-2 font-medium text-white">{activeMission.title}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {[
                { label: "Active", value: activeCount, tone: "text-cyan-100" },
                { label: "Completed", value: completedCount, tone: "text-emerald-100" },
                { label: "Average progress", value: `${averageProgress}%`, tone: "text-violet-100" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] p-4"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    {item.label}
                  </p>
                  <p className={`mt-3 text-3xl font-semibold ${item.tone}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {showForm ? (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
        >
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-white">AI Mission Builder</CardTitle>
              <CardDescription>
                Tell ELEV8 the outcome you want and it will generate a focused mission
                with tactical tasks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    value={form.target_role}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, target_role: event.target.value }))
                    }
                    placeholder="Target role, e.g. Frontend Engineer"
                    className="h-12"
                    required
                  />
                  <Input
                    value={form.target_company}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        target_company: event.target.value,
                      }))
                    }
                    placeholder="Target company, e.g. Stripe"
                    className="h-12"
                  />
                </div>
                <Textarea
                  value={form.goal}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, goal: event.target.value }))
                  }
                  placeholder="Add context, constraints, timeline, or specific goals."
                  className="min-h-[132px] resize-y"
                />
                <div className="flex flex-wrap justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {creating ? "Generating mission..." : "Generate mission"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      {missions.length === 0 ? (
        <Card className="border-dashed border-white/10 bg-white/[0.03]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-violet-500/20 to-cyan-400/20 text-cyan-100">
              <Target className="h-7 w-7" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-white">No missions yet</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">
              Create your first mission and ELEV8 will turn it into a tactical plan with
              AI-generated next steps, execution momentum, and dashboard telemetry.
            </p>
            <Button type="button" className="mt-6" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              Create your first mission
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {missions.map((mission, index) => (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Card className="h-full border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                        {mission.target_role || "Career mission"}
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-white">{mission.title}</h2>
                      <p className="mt-3 text-sm leading-7 text-slate-400">
                        {mission.description}
                      </p>
                    </div>
                    <Badge className={statusStyles[mission.status]}>{mission.status}</Badge>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.04] p-3">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                        Target
                      </p>
                      <p className="mt-2 text-sm font-medium text-white">
                        {mission.target_company || "Any strong-fit company"}
                      </p>
                    </div>
                    <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.04] p-3">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                        Progress
                      </p>
                      <p className="mt-2 text-sm font-medium text-white">{mission.progress}%</p>
                    </div>
                    <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.04] p-3">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                        Status
                      </p>
                      <p className="mt-2 text-sm font-medium capitalize text-white">
                        {mission.status}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-500">
                      <span>Execution progress</span>
                      <span>{mission.progress}%</span>
                    </div>
                    <Progress value={mission.progress} className="h-2" />
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {mission.status === "active" ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => updateStatus(mission.id, "completed")}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Complete
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(mission.id, "paused")}
                        >
                          <Pause className="h-4 w-4" />
                          Pause
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(mission.id, "active")}
                      >
                        <ArrowRight className="h-4 w-4" />
                        Reactivate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {missions.length > 0 ? (
        <Card className="border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Mission health</CardTitle>
            <CardDescription>
              Keep at least one active mission moving and avoid building a queue of paused work.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Active</p>
              <p className="mt-3 text-3xl font-semibold text-cyan-100">{activeCount}</p>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Paused</p>
              <p className="mt-3 text-3xl font-semibold text-amber-100">{pausedCount}</p>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Completed</p>
              <p className="mt-3 text-3xl font-semibold text-emerald-100">{completedCount}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
