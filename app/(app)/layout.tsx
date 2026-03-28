"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  CheckSquare,
  Command,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Rocket,
  Sparkles,
  Target,
  Trophy,
  X,
  FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    label: "Command Center",
    description: "Mission telemetry and AI mentor",
    icon: LayoutDashboard,
  },
  {
    href: "/mission",
    label: "Mission",
    description: "Define your target outcome",
    icon: Target,
  },
  {
    href: "/tasks",
    label: "Execution Queue",
    description: "Run today’s high-value actions",
    icon: CheckSquare,
  },
  {
    href: "/resume",
    label: "Resume Lab",
    description: "Optimize your signal for ATS",
    icon: FileText,
  },
  {
    href: "/interview",
    label: "Interview Prep",
    description: "Train with AI-led question loops",
    icon: Brain,
  },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MobileSidebar({
  pathname,
  userName,
  userEmail,
  open,
  onClose,
  onSignOut,
}: {
  pathname: string;
  userName: string;
  userEmail?: string;
  open: boolean;
  onClose: () => void;
  onSignOut: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: -320, opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0.8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel-strong fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-sm flex-col px-5 py-5 lg:hidden"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
                  ELEV8.AI
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Career OS</h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <nav className="mt-8 space-y-2">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);

                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "block rounded-[1.25rem] border px-4 py-3 transition",
                        active
                          ? "border-cyan-400/25 bg-cyan-400/[0.12] text-white"
                          : "border-white/5 bg-white/[0.03] text-slate-300 hover:border-white/10 hover:bg-white/[0.06] hover:text-white"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border",
                            active
                              ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-200"
                              : "border-white/10 bg-white/[0.04] text-slate-400"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className="mt-1 text-xs text-slate-400">{item.description}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <div className="mt-auto rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/25 to-cyan-400/25 text-sm font-semibold text-white">
                  {userName.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{userName}</p>
                  <p className="truncate text-xs text-slate-400">{userEmail}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full justify-center"
                onClick={onSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, profile, signOut, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const currentSection = useMemo(
    () => navItems.find((item) => isActivePath(pathname, item.href)) ?? navItems[0],
    [pathname]
  );

  const userName =
    profile?.full_name || user?.email?.split("@")[0] || "Operator";

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  if (loading || !user) {
    return (
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="glass-panel-strong flex items-center gap-4 rounded-[1.5rem] px-6 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-400/20">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-200" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
              Initializing
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Restoring your career operating system.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (pathname === "/onboarding") {
    return <div className="relative z-10">{children}</div>;
  }

  return (
    <div className="relative z-10 min-h-screen">
      <MobileSidebar
        pathname={pathname}
        userName={userName}
        userEmail={user.email}
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onSignOut={handleSignOut}
      />

      <div className="mx-auto flex min-h-screen max-w-[1680px]">
        <aside className="glass-panel-strong sticky top-0 hidden h-screen w-[300px] shrink-0 flex-col border-r border-white/10 px-6 py-6 lg:flex">
          <Link href="/dashboard" className="group">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] px-5 py-5 transition group-hover:border-cyan-400/25 group-hover:bg-white/[0.06]">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/25 via-blue-500/20 to-cyan-400/20 text-cyan-100 shadow-[0_12px_40px_rgba(34,211,238,0.18)]">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">
                    ELEV8.AI
                  </p>
                  <h1 className="mt-1 text-xl font-semibold text-white">Career OS</h1>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                A futuristic execution layer for landing your next role with AI.
              </p>
            </div>
          </Link>

          <nav className="mt-8 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);

              return (
                <motion.div key={item.href} whileHover={{ x: 4 }}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block rounded-[1.25rem] border px-4 py-3 transition",
                      active
                        ? "border-cyan-400/20 bg-cyan-400/[0.1] text-white shadow-[0_18px_40px_rgba(34,211,238,0.08)]"
                        : "border-white/5 bg-white/[0.03] text-slate-300 hover:border-white/10 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border",
                          active
                            ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                            : "border-white/10 bg-white/[0.04] text-slate-400"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="mt-1 text-xs text-slate-400">{item.description}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <div className="mt-8 rounded-[1.4rem] border border-white/10 bg-gradient-to-br from-violet-500/[0.1] via-transparent to-cyan-400/[0.08] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-cyan-100">
                <Command className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Command Palette</p>
                <p className="text-xs text-slate-400">Search any workspace instantly.</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs text-slate-300">
              <span>Launch palette</span>
              <span className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-slate-400">
                ⌘K / Ctrl K
              </span>
            </div>
          </div>

          <div className="mt-auto rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/25 via-blue-500/20 to-cyan-400/20 text-sm font-semibold text-white">
                {userName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{userName}</p>
                <p className="truncate text-xs text-slate-400">{user.email}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Trophy className="h-3.5 w-3.5 text-cyan-300" />
                {profile?.onboarded ? "Mission-ready" : "Needs onboarding"}
              </div>
              <Rocket className="h-3.5 w-3.5 text-violet-300" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-4 w-full justify-center"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b1220]/72 backdrop-blur-xl">
            <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
                    Career Operating System
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-white">
                    {currentSection.label}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 md:flex">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.9)]" />
                  <span className="text-xs text-slate-300">
                    AI services online
                  </span>
                </div>
                <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-400 sm:block">
                  {currentSection.description}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
