import Link from "next/link";
import { ArrowRight, Sparkles, Target, TrendingUp, Zap, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPostAuthPath } from "@/lib/auth/routes";

const features = [
  {
    icon: Target,
    title: "Mission System",
    description: "Set career goals. Let AI plan the path. Execute daily.",
    color: "text-violet-500 bg-violet-500/10",
  },
  {
    icon: Brain,
    title: "AI Career Engine",
    description: "Powered by Gemini - resume optimization, interview prep, roadmaps.",
    color: "text-indigo-500 bg-indigo-500/10",
  },
  {
    icon: TrendingUp,
    title: "Hireability Score",
    description: "A real-time 0-100 metric tracking how hire-ready you are.",
    color: "text-emerald-500 bg-emerald-500/10",
  },
  {
    icon: Zap,
    title: "Daily Action Tasks",
    description: "AI-generated daily tasks that move the needle on your career.",
    color: "text-amber-500 bg-amber-500/10",
  },
];

const stats = [
  { value: "10K+", label: "Careers Accelerated" },
  { value: "85%", label: "Interview Success Rate" },
  { value: "3x", label: "Faster Job Placement" },
];

export default async function LandingPage() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const ctaLink = user
    ? getPostAuthPath({ onboarded: profile?.onboarded })
    : "/signup";
  const secondaryLink = user ? "/dashboard" : "/login";
  const ctaTextMain = user ? "Continue" : "Get Started";
  const ctaTextHero = user ? "Continue Your Mission" : "Start Your Mission";
  const ctaTextFooter = user ? "Open ELEV8" : "Get Started - It's Free";

  return (
    <div className="relative z-10 min-h-screen">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1220]/72 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span className="text-xl font-bold text-gradient-premium">ELEV8.AI</span>
          <div className="flex items-center gap-2">
            {!user && (
              <Link href={secondaryLink}>
                <Button variant="outline">Log In</Button>
              </Link>
            )}
            <Link href={ctaLink}>
              <Button>
                {ctaTextMain}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              AI career execution platform
            </div>

            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] text-white md:text-6xl">
              Build your
              <span className="text-gradient-premium"> career operating system</span>,
              not another static profile.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              ELEV8.AI turns career ambition into an execution engine with AI mission planning,
              live mentoring, task orchestration, resume optimization, and interview prep in one
              premium workspace.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={ctaLink}>
                <Button size="lg" className="w-full sm:w-auto">
                  {ctaTextHero}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              {!user && (
                <Link href={secondaryLink}>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Existing user? Log in
                  </Button>
                </Link>
              )}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-5"
                >
                  <p className="text-3xl font-semibold text-white">{stat.value}</p>
                  <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel-strong relative overflow-hidden rounded-[1.8rem] p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.14),transparent_20%)]" />
            <div className="relative space-y-5">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                      AI Mentor
                    </p>
                    <p className="mt-2 text-xl font-semibold text-white">Streaming live guidance</p>
                  </div>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                    Online
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Ask for strategy, refine your next move, or convert goals into tactical steps.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5">
                  <Target className="h-5 w-5 text-violet-200" />
                  <p className="mt-4 text-sm font-semibold text-white">Mission-first flow</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    New users move from onboarding into action, not an empty dashboard.
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5">
                  <Brain className="h-5 w-5 text-cyan-200" />
                  <p className="mt-4 text-sm font-semibold text-white">Gemini-powered modules</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Resume optimization, interview drills, roadmaps, and daily task generation.
                  </p>
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                      Execution signal
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-white">92%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-emerald-300" />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Premium interface, intelligent routing, and real AI interactions working end to end.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:border-cyan-400/20 hover:bg-white/[0.06]"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${feature.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-3">
          <div className="glass-panel rounded-[1.6rem] p-6 lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
              Product flow
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              From landing page to execution engine in minutes.
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">1. Join</p>
                <p className="mt-2 text-sm text-slate-400">Password, OTP, or Google auth.</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">2. Onboard</p>
                <p className="mt-2 text-sm text-slate-400">Set context, goals, and skills.</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">3. Execute</p>
                <p className="mt-2 text-sm text-slate-400">Run tasks with AI feedback loops.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-violet-500/10 via-white/[0.04] to-cyan-400/10 p-6">
            <h2 className="text-2xl font-semibold text-white">
              Ready to elevate your career?
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Get the productized workflow, AI tooling, and premium UX that turns career work into a repeatable system.
            </p>
            <Link href={ctaLink}>
              <Button size="lg" className="mt-6 w-full">
                {ctaTextFooter}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 text-sm text-slate-500 sm:px-6 lg:px-8">
          <span className="font-semibold text-gradient-premium">ELEV8.AI</span>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
