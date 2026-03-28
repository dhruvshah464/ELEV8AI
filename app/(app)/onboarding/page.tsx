"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { logAppError } from "@/lib/error-utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const INDUSTRIES = [
  "technology",
  "healthcare",
  "finance",
  "education",
  "marketing",
  "engineering",
  "design",
  "data science",
  "sales",
  "consulting",
  "other",
];

export default function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    industry: "",
    experience: "",
    skills: "",
    bio: "",
  });

  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  useEffect(() => {
    if (profile?.onboarded) {
      router.replace("/dashboard");
    }
  }, [profile, router]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      full_name:
        current.full_name ||
        profile?.full_name ||
        (typeof user?.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : user?.email?.split("@")[0] || ""),
      industry: current.industry || profile?.industry || "technology",
      experience:
        current.experience || (profile?.experience ? String(profile.experience) : ""),
      skills: current.skills || (profile?.skills?.length ? profile.skills.join(", ") : ""),
      bio: current.bio || profile?.bio || "",
    }));
  }, [profile, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setSaving(true);

    try {
      const resolvedName =
        form.full_name.trim() || profile?.full_name || user.email?.split("@")[0] || "Operator";

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: resolvedName,
          industry: form.industry || profile?.industry || "technology",
          experience: Number.parseInt(form.experience, 10) || 0,
          skills: form.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
          bio: form.bio.trim(),
          onboarded: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      await refreshProfile();
      toast.success("Profile complete. Launching your command center.");
      router.push("/dashboard");
    } catch (error) {
      logAppError("[ONBOARDING] Failed to launch command center:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "We could not complete onboarding. Please retry."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-6rem)] items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.14),transparent_22%)]" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-5xl"
      >
        <div className="grid gap-6 xl:grid-cols-[0.95fr_minmax(0,1.05fr)]">
          <Card className="glass-panel-strong border-white/10">
            <CardContent className="p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                Onboarding
              </div>
              <h1 className="mt-5 text-4xl font-semibold text-white">
                Let’s calibrate your
                <span className="text-gradient-premium"> career engine</span>.
              </h1>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                This gives ELEV8 enough signal to personalize your dashboard, task queue,
                mentor guidance, resume analysis, and interview loops from day one.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Map your background into a personalized execution system",
                  "Tune the AI mentor with industry and experience context",
                  "Seed the dashboard with stronger recommendations",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Complete your profile</CardTitle>
              <CardDescription>
                A few signals now makes the whole product feel personal instead of generic.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  value={form.full_name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, full_name: event.target.value }))
                  }
                  placeholder="Full name"
                  className="h-12"
                  required
                />

                <Select
                  value={form.industry}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, industry: value }))
                  }
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select your target industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={form.experience}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, experience: event.target.value }))
                  }
                  placeholder="Years of experience"
                  className="h-12"
                />

                <Input
                  value={form.skills}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, skills: event.target.value }))
                  }
                  placeholder="Skills, separated by commas"
                  className="h-12"
                />

                <Textarea
                  value={form.bio}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, bio: event.target.value }))
                  }
                  placeholder="Brief professional bio or current career context"
                  className="min-h-[140px] resize-y"
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={saving || !user}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {saving ? "Launching..." : "Launch command center"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
