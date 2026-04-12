"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CheckSquare, Loader2, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { logAppError } from "@/lib/error-utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shivaDissolve, shivaBuild, vishnuList, vishnuListItem } from "@/lib/motion";
import type { Task } from "@/types";

export default function TasksPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    supabase.from("tasks").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }: { data: Task[] | null; error: any }) => {
        if (cancelled) return;
        if (error) { logAppError("[TASKS] Failed to load tasks:", error); toast.error("Could not load your execution queue."); }
        setTasks(data ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [supabase, user]);

  const pendingTasks = useMemo(
    () => tasks.filter((t) => t.status === "pending" || t.status === "in_progress"),
    [tasks]
  );
  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === "completed"),
    [tasks]
  );
  const completionRate = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const topTask = pendingTasks[0] ?? null;
  const queueTasks = pendingTasks.slice(1);

  const updateTask = useCallback(async (id: string, status: Task["status"]) => {
    const payload: Partial<Task> = { status };
    if (status === "completed") payload.completed_at = new Date().toISOString();
    const previousTasks = tasks;
    setUpdatingId(id);
    setTasks((c) => c.map((t) => t.id === id ? { ...t, status, completed_at: payload.completed_at ?? t.completed_at } : t));
    const { error } = await supabase.from("tasks").update(payload).eq("id", id);
    if (error) { setTasks(previousTasks); setUpdatingId(null); toast.error(error.message); return; }
    setUpdatingId(null);
    toast.success(status === "completed" ? "Action completed." : "Action skipped.");
  }, [tasks, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <span className="text-3xl" style={{ color: "hsl(var(--kriya-primary))", animation: "kriya-glyph-pulse 2.4s ease-in-out infinite" }}>◈</span>
          <p className="kriya-label">Loading action engine</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-0">

      {/* ─── Completion progress ────────────────────────────────── */}
      {tasks.length > 0 && (
        <div className="py-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
            <span className="uppercase tracking-widest">Queue completion</span>
            <span className="text-slate-300 font-medium">{completionRate}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/[0.04] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(var(--kriya-primary) / 0.6), hsl(var(--kriya-accent) / 0.8))" }}
            />
          </div>
        </div>
      )}

      {/* ─── Focus Zone — THE current task ──────────────────────── */}
      <AnimatePresence mode="wait">
        {topTask ? (
          <motion.section
            key={topTask.id}
            variants={shivaBuild}
            initial="initial"
            animate="animate"
            exit={shivaDissolve.exit as any}
            className="py-14 sm:py-20 text-center"
          >
            <p className="kriya-label mb-6">Current action</p>
            <h2 className="kriya-serif text-2xl sm:text-3xl md:text-4xl font-light text-white leading-tight max-w-2xl mx-auto">
              {topTask.title}
            </h2>
            {topTask.description && (
              <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
                {topTask.description}
              </p>
            )}

            <div className="mt-3 flex justify-center">
              <span className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider border",
                topTask.priority === "critical" ? "border-red-400/20 text-red-300 bg-red-400/8" :
                topTask.priority === "high" ? "border-amber-400/20 text-amber-300 bg-amber-400/8" :
                "border-white/[0.06] text-slate-400 bg-white/[0.03]"
              )}>
                {topTask.priority}
              </span>
            </div>

            <div className="mt-8 flex items-center justify-center gap-3">
              <Button
                onClick={() => void updateTask(topTask.id, "completed")}
                disabled={updatingId === topTask.id}
                className="rounded-xl bg-white text-slate-900 hover:bg-slate-200 shadow-sm px-6"
              >
                {updatingId === topTask.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Complete
              </Button>
              <Button
                variant="ghost"
                onClick={() => void updateTask(topTask.id, "skipped")}
                disabled={updatingId === topTask.id}
                className="text-slate-400 hover:text-white"
              >
                <SkipForward className="h-3.5 w-3.5" /> Skip
              </Button>
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="empty"
            variants={shivaBuild}
            initial="initial"
            animate="animate"
            className="py-16 text-center"
          >
            <CheckSquare className="h-8 w-8 mx-auto text-slate-600" />
            <h2 className="mt-4 kriya-serif text-2xl font-light text-white">Queue complete</h2>
            <p className="mt-3 text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              All actions cleared. Create a mission to generate new execution tasks.
            </p>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ─── Queue Preview ──────────────────────────────────────── */}
      {queueTasks.length > 0 && (
        <>
          <div className="kriya-divider" />
          <section className="py-8">
            <p className="kriya-label mb-4">Up next · {queueTasks.length} remaining</p>
            <motion.div variants={vishnuList} initial="hidden" animate="visible" className="space-y-0.5">
              {queueTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  variants={vishnuListItem}
                  className="group flex items-center gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
                >
                  <span className="text-[11px] text-slate-600 font-mono w-5 text-right shrink-0">
                    {String(index + 2).padStart(2, "0")}
                  </span>
                  <span className="text-[13px] text-slate-400 flex-1 truncate group-hover:text-slate-200 transition-colors">
                    {task.title}
                  </span>
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider shrink-0",
                    task.priority === "critical" ? "text-red-400/70" :
                    task.priority === "high" ? "text-amber-400/70" :
                    "text-slate-600"
                  )}>
                    {task.priority}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </section>
        </>
      )}

      {/* ─── Completed History ──────────────────────────────────── */}
      {completedTasks.length > 0 && (
        <>
          <div className="kriya-divider" />
          <section className="py-8">
            <p className="kriya-label mb-4">Completed · {completedTasks.length}</p>
            <div className="space-y-0.5 opacity-50 hover:opacity-80 transition-opacity duration-500">
              {completedTasks.slice(0, 8).map((task) => (
                <div key={task.id} className="flex items-center gap-4 rounded-lg px-3 py-2">
                  <CheckCircle2 className="h-3 w-3 text-slate-600 shrink-0" />
                  <span className="text-[13px] text-slate-500 line-through decoration-slate-700 truncate">
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
