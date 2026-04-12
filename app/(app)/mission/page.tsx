"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { shivaBuild, shivaTransform, vishnuContainer, vishnuItem } from "@/lib/motion";
import type { Mission } from "@/types";

const statusColors: Record<Mission["status"], string> = {
  active: "text-emerald-300",
  paused: "text-amber-300",
  completed: "text-cyan-300",
  abandoned: "text-slate-400",
};

export default function MissionPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ target_role: "", target_company: "", goal: "" });

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    supabase.from("missions").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }: { data: Mission[] | null; error: any }) => {
        if (cancelled) return;
        if (error) { logAppError("[MISSION] Failed to fetch missions:", error); toast.error("Could not load your missions."); }
        setMissions(data ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [supabase, user]);

  const activeMission = missions.find((m) => m.status === "active") ?? null;
  const archiveMissions = useMemo(() => missions.filter((m) => m !== activeMission), [missions, activeMission]);

  const handleCreate = useCallback(async (event: React.FormEvent) => {
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
      const missionDescription = plan.mission_description?.trim() || `Focused execution plan for ${form.target_role.trim()} opportunities.`;
      const normalizedTasks = (plan.tasks ?? []).filter((t) => t.title?.trim());
      const { data: newMission, error: missionError } = await supabase.from("missions").insert({
        user_id: user.id, title: missionTitle, description: missionDescription,
        target_role: form.target_role.trim(), target_company: form.target_company.trim() || null,
        status: "active", progress: 0,
      }).select().single();
      if (missionError) throw missionError;
      if (normalizedTasks.length > 0) {
        const tasksToInsert = normalizedTasks.map((t) => ({
          user_id: user.id, mission_id: newMission.id, title: t.title,
          description: t.description, priority: t.priority || "medium", status: "pending",
        }));
        const { error: taskErr } = await supabase.from("tasks").insert(tasksToInsert);
        if (taskErr) logAppWarning("[MISSION] Task persistence failed:", taskErr);
      }
      setMissions((c) => [newMission, ...c]);
      setForm({ target_role: "", target_company: "", goal: "" });
      toast.success("Mission created. Your execution queue is live.");
    } catch (error) {
      logAppError("[MISSION AI] Failed to generate mission:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate your mission.");
    } finally { setCreating(false); }
  }, [form, profile, supabase, user]);

  const updateStatus = useCallback(async (id: string, status: Mission["status"]) => {
    const previous = missions;
    setMissions((c) => c.map((m) => (m.id === id ? { ...m, status } : m)));
    const { error } = await supabase.from("missions").update({ status }).eq("id", id);
    if (error) { setMissions(previous); toast.error(error.message); return; }
    toast.success(`Mission marked ${status}.`);
  }, [missions, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <span className="text-3xl" style={{ color: "hsl(var(--kriya-primary))", animation: "kriya-glyph-pulse 2.4s ease-in-out infinite" }}>◈</span>
          <p className="kriya-label">Loading clarity view</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-0">

      {/* ─── Active Mission Spotlight ───────────────────────────── */}
      {activeMission ? (
        <motion.section
          variants={shivaBuild}
          initial="initial"
          animate="animate"
          className="py-10 sm:py-14"
        >
          <p className="kriya-label">{activeMission.target_role || "Active mission"}</p>
          <h2 className="mt-4 kriya-serif text-3xl sm:text-4xl font-light text-white leading-tight">
            {activeMission.title}
          </h2>
          <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-2xl">
            {activeMission.description}
          </p>

          {/* Progress bar */}
          <div className="mt-8 max-w-lg">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
              <span className="uppercase tracking-widest">Execution progress</span>
              <span className="text-slate-300 font-medium">{activeMission.progress}%</span>
            </div>
            <div className="h-1 w-full rounded-full bg-white/[0.04] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${activeMission.progress}%` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, hsl(var(--kriya-primary) / 0.6), hsl(var(--kriya-accent) / 0.8))" }}
              />
            </div>
          </div>

          {/* Inline details */}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-slate-500">
            <span>Target: <span className="text-slate-300">{activeMission.target_company || "Any strong-fit company"}</span></span>
            <span>·</span>
            <span>Status: <span className={statusColors[activeMission.status]}>{activeMission.status}</span></span>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="sm" onClick={() => updateStatus(activeMission.id, "completed")} className="rounded-xl bg-white text-slate-900 hover:bg-slate-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> Complete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => updateStatus(activeMission.id, "paused")} className="text-slate-400 hover:text-white">
              <Pause className="h-3.5 w-3.5" /> Pause
            </Button>
          </div>
        </motion.section>
      ) : (
        <section className="py-14 text-center">
          <div className="mx-auto max-w-md">
            <Target className="h-8 w-8 mx-auto text-slate-600" />
            <h2 className="mt-4 kriya-serif text-2xl font-light text-white">No active mission</h2>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Define your strategic target below and KRIYA will generate a focused execution plan with AI-generated tasks.
            </p>
          </div>
        </section>
      )}

      <div className="kriya-divider" />

      {/* ─── Mission Builder — Always visible ──────────────────── */}
      <section className="py-10">
        <p className="kriya-label mb-4">Mission builder</p>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={form.target_role}
              onChange={(e) => setForm((c) => ({ ...c, target_role: e.target.value }))}
              placeholder="Target role — e.g. Frontend Engineer"
              className="h-12 bg-white/[0.02] border-white/[0.06] focus:border-white/[0.12]"
              required
            />
            <Input
              value={form.target_company}
              onChange={(e) => setForm((c) => ({ ...c, target_company: e.target.value }))}
              placeholder="Target company — e.g. Stripe"
              className="h-12 bg-white/[0.02] border-white/[0.06] focus:border-white/[0.12]"
            />
          </div>
          <Textarea
            value={form.goal}
            onChange={(e) => setForm((c) => ({ ...c, goal: e.target.value }))}
            placeholder="Additional context, constraints, or timeline..."
            className="min-h-[100px] resize-y bg-white/[0.02] border-white/[0.06] focus:border-white/[0.12]"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={creating} className="rounded-xl">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {creating ? "Generating..." : "Generate AI mission"}
            </Button>
          </div>
        </form>
      </section>

      {/* ─── Mission Archive ───────────────────────────────────── */}
      {archiveMissions.length > 0 && (
        <>
          <div className="kriya-divider" />
          <section className="py-10">
            <p className="kriya-label mb-5">Mission archive</p>
            <motion.div variants={vishnuContainer} initial="hidden" animate="visible" className="space-y-1.5">
              {archiveMissions.map((mission) => {
                const isExpanded = expandedId === mission.id;
                return (
                  <motion.div key={mission.id} variants={vishnuItem}>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : mission.id)}
                      className="w-full flex items-center gap-4 rounded-xl px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-medium text-slate-300 truncate">{mission.title}</p>
                          <span className={cn("text-[10px] uppercase tracking-wider", statusColors[mission.status])}>
                            {mission.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] text-slate-500">{mission.progress}%</span>
                        <div className="h-1 w-16 rounded-full bg-white/[0.04] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-white/20"
                            style={{ width: `${mission.progress}%` }}
                          />
                        </div>
                        <ChevronDown className={cn("h-3.5 w-3.5 text-slate-500 transition-transform", isExpanded && "rotate-180")} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1">
                            <p className="text-sm text-slate-400 leading-relaxed">{mission.description}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                              <span>Role: <span className="text-slate-300">{mission.target_role || "—"}</span></span>
                              <span>·</span>
                              <span>Company: <span className="text-slate-300">{mission.target_company || "Any"}</span></span>
                            </div>
                            <div className="mt-3 flex gap-2">
                              {mission.status !== "active" && (
                                <Button size="sm" variant="ghost" onClick={() => updateStatus(mission.id, "active")}
                                  className="text-xs text-slate-400 hover:text-white">
                                  <ArrowRight className="h-3 w-3" /> Reactivate
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          </section>
        </>
      )}
    </div>
  );
}
