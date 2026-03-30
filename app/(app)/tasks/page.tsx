"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, CheckSquare, Clock, Loader2, SkipForward, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { logAppError } from "@/lib/error-utils";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { Task } from "@/types";

const priorityStyles: Record<Task["priority"], string> = {
  critical: "border-rose-400/20 bg-rose-400/10 text-rose-100",
  high: "border-amber-300/20 bg-amber-300/10 text-amber-100",
  medium: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
  low: "border-white/10 bg-white/[0.06] text-slate-300",
};

function TasksSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[220px] rounded-[1.75rem]" />
      <Skeleton className="h-[300px] rounded-[1.5rem]" />
      <Skeleton className="h-[260px] rounded-[1.5rem]" />
    </div>
  );
}

export default function TasksPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }: { data: Task[] | null; error: any }) => {
        if (cancelled) return;

        if (error) {
          logAppError("[TASKS] Failed to load tasks:", error);
          toast.error("We could not load your execution queue.");
          setLoading(false);
          return;
        }

        setTasks(data ?? []);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  const pendingTasks = useMemo(
    () => tasks.filter((task) => task.status === "pending" || task.status === "in_progress"),
    [tasks]
  );
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === "completed"),
    [tasks]
  );

  const completionRate = tasks.length
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;

  const updateTask = async (id: string, status: Task["status"]) => {
    const payload: Partial<Task> = { status };
    if (status === "completed") {
      payload.completed_at = new Date().toISOString();
    }

    const previousTasks = tasks;
    setUpdatingId(id);
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? {
              ...task,
              status,
              completed_at: payload.completed_at ?? task.completed_at,
            }
          : task
      )
    );

    const { error } = await supabase.from("tasks").update(payload).eq("id", id);

    if (error) {
      setTasks(previousTasks);
      setUpdatingId(null);
      toast.error(error.message);
      return;
    }

    setUpdatingId(null);
    toast.success(status === "completed" ? "Task completed." : "Task skipped.");
  };

  if (loading) {
    return <TasksSkeleton />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-12 pb-16">
      {/* Header Section */}
      <section className="relative pt-6">
        <div className="pointer-events-none absolute -inset-x-6 top-0 h-[300px] bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.02),transparent_50%)]" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">
            <Sparkles className="h-3.5 w-3.5" />
            Execution System
          </div>
          <h1 className="mt-6 text-4xl font-normal tracking-tight text-white sm:text-5xl">
            Focus on <span className="font-medium text-gradient-premium">momentum</span>.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
            Clear the tasks that move your hiring signal forward, skip low-value work,
            and keep your mission engine pointed at outcomes instead of busyness.
          </p>

          <div className="mt-10 flex gap-8">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Pending</p>
              <p className="mt-1 text-2xl font-medium text-white">{pendingTasks.length}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Completed</p>
              <p className="mt-1 text-2xl font-medium text-emerald-100">{completedTasks.length}</p>
            </div>
            <div className="flex-1 max-w-xs ml-auto self-end">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                <span>Queue completion</span>
                <span>{completionRate}%</span>
              </div>
              <div className="h-1 w-full bg-white/[0.05] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Task List Section */}
      <section className="pt-8 border-t border-white/[0.04]">
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.05] bg-white/[0.01] px-6 py-16 text-center flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <CheckSquare className="h-5 w-5 text-slate-400" />
            </div>
            <h2 className="mt-6 text-lg font-medium tracking-tight text-white">Queue is empty</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Create a mission first and ELEV8 will generate actionable tasks for you.
            </p>
          </div>
        ) : null}

        {pendingTasks.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-slate-500 mb-6">
              <Clock className="h-3.5 w-3.5" />
              Today’s Priorities
            </div>

            <div className="space-y-1">
              {pendingTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -1 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-white/[0.02] border border-transparent hover:border-white/[0.02]"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-slate-500 hover:text-white border border-white/10 hover:border-white/20 bg-white/[0.01] hover:bg-white/[0.05] rounded-lg transition-all"
                    disabled={updatingId === task.id}
                    onClick={() => updateTask(task.id, "completed")}
                  >
                    {updatingId === task.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                  </Button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm font-medium text-slate-200">{task.title}</p>
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border",
                        task.priority === "critical" ? "border-red-400/20 text-red-300 bg-red-400/10" :
                        task.priority === "high" ? "border-amber-400/20 text-amber-300 bg-amber-400/10" :
                        "border-white/5 text-slate-400 bg-white/5"
                      )}>
                        {task.priority}
                      </span>
                    </div>
                    {task.description ? (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2 pr-12">{task.description}</p>
                    ) : null}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 h-8 text-xs font-medium text-slate-500 hover:text-white opacity-0 sm:opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                    disabled={updatingId === task.id}
                    onClick={() => updateTask(task.id, "skipped")}
                  >
                    <SkipForward className="h-3.5 w-3.5 mr-1.5" />
                    Skip
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        ) : null}

        {completedTasks.length > 0 ? (
          <div className="mt-16 space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-slate-500 mb-6 border-t border-white/[0.04] pt-8">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed History
            </div>
            <div className="space-y-1 opacity-60 hover:opacity-100 transition-opacity duration-500">
              {completedTasks.slice(0, 10).map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl px-4 py-2.5 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-slate-500">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-400 line-through decoration-slate-600">{task.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
