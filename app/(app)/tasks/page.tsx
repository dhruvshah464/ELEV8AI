"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, CheckSquare, Clock, Loader2, SkipForward, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { logAppError } from "@/lib/error-utils";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-6">
      <Card className="glass-panel-strong relative overflow-hidden border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.14),transparent_20%)]" />
        <CardContent className="relative p-6 sm:p-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_340px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                Execution queue
              </div>
              <h1 className="mt-5 text-4xl font-semibold text-white sm:text-5xl">
                Operate your
                <span className="text-gradient-premium"> daily momentum</span>.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Clear the tasks that move your hiring signal forward, skip low-value work,
                and keep the mission engine pointed at outcomes instead of busyness.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {[
                { label: "Pending", value: pendingTasks.length, tone: "text-cyan-100" },
                { label: "Completed", value: completedTasks.length, tone: "text-emerald-100" },
                { label: "Completion", value: `${completionRate}%`, tone: "text-violet-100" },
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

      {tasks.length === 0 ? (
        <Card className="border-dashed border-white/10 bg-white/[0.03]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-violet-500/20 to-cyan-400/20 text-cyan-100">
              <CheckSquare className="h-7 w-7" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-white">No tasks in the queue</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">
              Create a mission first and ELEV8 will generate actionable tasks you can
              complete, skip, and track from the dashboard.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {tasks.length > 0 ? (
        <Card className="border-white/10">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-500">
              <span>Queue completion</span>
              <span>{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </CardContent>
        </Card>
      ) : null}

      {pendingTasks.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Clock className="h-4 w-4 text-cyan-300" />
            Today’s priority work
          </div>

          {pendingTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Card className="border-white/10">
                <CardContent className="flex flex-wrap items-center gap-4 p-5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-slate-400 hover:text-emerald-200"
                    disabled={updatingId === task.id}
                    onClick={() => updateTask(task.id, "completed")}
                  >
                    {updatingId === task.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5" />
                    )}
                  </Button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-white">{task.title}</p>
                      <Badge className={priorityStyles[task.priority]}>{task.priority}</Badge>
                    </div>
                    {task.description ? (
                      <p className="mt-2 text-sm leading-7 text-slate-400">{task.description}</p>
                    ) : null}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={updatingId === task.id}
                    onClick={() => updateTask(task.id, "skipped")}
                  >
                    <SkipForward className="h-4 w-4" />
                    Skip
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : null}

      {completedTasks.length > 0 ? (
        <Card className="border-white/10">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Completed momentum
            </div>
            <div className="space-y-3">
              {completedTasks.slice(0, 10).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-[1.15rem] border border-white/10 bg-white/[0.04] px-4 py-3"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-300 line-through">{task.title}</p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    done
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
