"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useCallback, memo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Brain,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Compass,
  FileText,
  Gauge,
  GitBranch,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Target,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { ModeSwitcher } from "@/components/core/mode-switcher";
import { cn } from "@/lib/utils";
import { kriyaEase } from "@/lib/motion";

/* ─── Navigation Data ─────────────────────────────────────────────── */

const navSections = [
  {
    label: "Core",
    items: [
      {
        href: "/dashboard",
        label: "Command",
        description: "Decision interface",
        icon: LayoutDashboard,
      },
      {
        href: "/mission",
        label: "Clarity",
        description: "Strategic vision",
        icon: Target,
      },
      {
        href: "/tasks",
        label: "Action",
        description: "Execution engine",
        icon: CheckSquare,
      },
      {
        href: "/resume",
        label: "Signal",
        description: "Resume intelligence",
        icon: FileText,
      },
      {
        href: "/interview",
        label: "Prepare",
        description: "Interview mastery",
        icon: Brain,
      },
    ],
  },
  {
    label: "Career Engine",
    items: [
      {
        href: "/career",
        label: "Career",
        description: "AI career operations",
        icon: Compass,
      },
      {
        href: "/career/pipeline",
        label: "Pipeline",
        description: "Opportunity flow",
        icon: GitBranch,
      },
      {
        href: "/career/evaluate",
        label: "Evaluate",
        description: "Deep analysis",
        icon: Gauge,
      },
      {
        href: "/career/tracker",
        label: "Tracker",
        description: "Application intel",
        icon: BarChart3,
      },
    ],
  },
];

const allNavItems = navSections.flatMap((s) => s.items);

function isActivePath(pathname: string, href: string) {
  if (href === "/career") return pathname === "/career";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* ─── Section Header Mapping ──────────────────────────────────────── */

const sectionMeta: Record<string, { title: string; sanskrit?: string }> = {
  "/dashboard": { title: "Command", sanskrit: "आदेश" },
  "/mission": { title: "Clarity", sanskrit: "स्पष्टता" },
  "/tasks": { title: "Action", sanskrit: "कर्म" },
  "/resume": { title: "Signal", sanskrit: "संकेत" },
  "/interview": { title: "Prepare", sanskrit: "तैयारी" },
  "/career": { title: "Career", sanskrit: "मार्ग" },
  "/career/pipeline": { title: "Pipeline", sanskrit: "प्रवाह" },
  "/career/evaluate": { title: "Evaluate", sanskrit: "मूल्यांकन" },
  "/career/tracker": { title: "Tracker", sanskrit: "अनुसरण" },
};

/* ─── Mobile Sidebar ──────────────────────────────────────────────── */

const MobileSidebar = memo(function MobileSidebar({
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
            transition={{ duration: 0.28, ease: kriyaEase as [number, number, number, number] }}
            className="glass-panel-strong fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-sm flex-col px-5 py-5 lg:hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-lg" style={{ color: "hsl(var(--kriya-primary))" }}>◈</span>
                <div>
                  <p className="text-sm font-semibold text-gradient-premium tracking-wide">KRIYA</p>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Decision OS</p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-5">
              <ModeSwitcher />
            </div>

            <nav className="mt-5 space-y-5 flex-1 overflow-y-auto">
              {navSections.map((section) => (
                <div key={section.label}>
                  <p className="px-3 text-[9px] uppercase tracking-[0.2em] text-slate-600 mb-2">
                    {section.label}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActivePath(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                            active ? "bg-white/[0.06] text-white" : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <div>
                            <p className="text-[13px] font-medium">{item.label}</p>
                            <p className="text-[10px] text-slate-500">{item.description}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-auto border-t border-white/[0.04] pt-4">
              <div className="flex items-center gap-3 rounded-lg p-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white">
                  {userName.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{userName}</p>
                  <p className="truncate text-[10px] text-slate-500">{userEmail}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full justify-center bg-transparent border-white/[0.06] hover:bg-white/[0.03] text-slate-300"
                onClick={onSignOut}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
});

/* ─── Desktop Sidebar — ChatGPT-style collapsible ─────────────────── */

const DesktopSidebar = memo(function DesktopSidebar({
  pathname,
  userName,
  collapsed,
  onToggle,
  onSignOut,
}: {
  pathname: string;
  userName: string;
  collapsed: boolean;
  onToggle: () => void;
  onSignOut: () => void;
}) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 260 }}
      transition={{ duration: 0.3, ease: kriyaEase as [number, number, number, number] }}
      className="glass-panel-strong sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/[0.04] lg:flex overflow-hidden"
    >
      <div className="flex flex-col h-full">
        {/* Brand + Collapse Toggle */}
        <div className={cn("flex items-center px-4 py-4", collapsed ? "justify-center" : "justify-between")}>
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <span
              className="text-lg transition-transform group-hover:scale-110"
              style={{ color: "hsl(var(--kriya-primary))" }}
            >
              ◈
            </span>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm font-semibold text-gradient-premium tracking-wide whitespace-nowrap">KRIYA</p>
              </motion.div>
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={onToggle}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.04] transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Mode Switcher */}
        {!collapsed && (
          <div className="px-3 pb-2">
            <ModeSwitcher compact />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-2 mb-1.5 text-[9px] uppercase tracking-[0.2em] text-slate-600">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group flex items-center rounded-lg transition-all duration-200",
                        collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-2.5 py-2",
                        active
                          ? "bg-white/[0.06] text-white"
                          : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center justify-center rounded-md shrink-0 transition-all",
                          collapsed ? "h-8 w-8" : "h-7 w-7",
                          active ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                        )}
                      >
                        <Icon className={cn(collapsed ? "h-4 w-4" : "h-3.5 w-3.5")} />
                      </span>
                      {!collapsed && (
                        <span className={cn(
                          "text-[13px] font-medium whitespace-nowrap",
                          active ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                        )}>
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom area */}
        <div className="border-t border-white/[0.03] px-2 py-3 space-y-2">
          {/* Expand button when collapsed */}
          {collapsed && (
            <button
              onClick={onToggle}
              className="flex h-8 w-full items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.04] transition-colors"
              title="Expand sidebar"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}

          {/* User */}
          <button
            onClick={onSignOut}
            className={cn(
              "group flex w-full items-center rounded-lg hover:bg-white/[0.03] transition-colors",
              collapsed ? "justify-center p-2" : "gap-2.5 p-2"
            )}
            title={collapsed ? `Sign out (${userName})` : undefined}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[11px] font-medium text-white shrink-0">
              {userName.slice(0, 1).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-[12px] font-medium text-slate-300">{userName}</p>
                <p className="truncate text-[10px] text-slate-500">Sign out</p>
              </div>
            )}
            {!collapsed && (
              <LogOut className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
            )}
          </button>
        </div>
      </div>
    </motion.aside>
  );
});

/* ─── Page Header ─────────────────────────────────────────────────── */

const PageHeader = memo(function PageHeader({
  pathname,
  onMobileMenuOpen,
}: {
  pathname: string;
  onMobileMenuOpen: () => void;
}) {
  const meta = useMemo(() => {
    // Find the matching section metadata
    const exactMatch = sectionMeta[pathname];
    if (exactMatch) return exactMatch;
    // Check prefix matches for nested routes
    const prefixMatch = Object.entries(sectionMeta)
      .filter(([key]) => pathname.startsWith(key))
      .sort(([a], [b]) => b.length - a.length)[0];
    return prefixMatch ? prefixMatch[1] : { title: "KRIYA" };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.03] bg-slate-950/60 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={onMobileMenuOpen}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex items-baseline gap-3">
            <h2 className="kriya-serif text-lg font-normal text-white tracking-tight">
              {meta.title}
            </h2>
            {meta.sanskrit && (
              <span className="hidden sm:inline text-[11px] text-slate-600 font-normal">
                {meta.sanskrit}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full bg-white/[0.02] border border-white/[0.03] px-3 py-1.5 md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
            <span className="text-[10px] font-medium text-slate-500">
              System Active
            </span>
          </div>
        </div>
      </div>
    </header>
  );
});

/* ─── App Layout ──────────────────────────────────────────────────── */

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, profile, signOut, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const userName = profile?.full_name || user?.email?.split("@")[0] || "Operator";

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.replace("/login");
  }, [signOut, router]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const openMobileMenu = useCallback(() => {
    setMobileMenuOpen(true);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  if (loading || !user) {
    return (
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="flex flex-col items-center gap-5">
          <span
            className="text-3xl"
            style={{
              color: "hsl(var(--kriya-primary))",
              animation: "kriya-glyph-pulse 2.4s ease-in-out infinite",
            }}
          >
            ◈
          </span>
          <div className="text-center">
            <p className="kriya-label">Initializing</p>
            <p className="mt-1 text-xs text-slate-500">
              Restoring KRIYA operating system
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
        onClose={closeMobileMenu}
        onSignOut={handleSignOut}
      />

      <div className="flex min-h-screen">
        <DesktopSidebar
          pathname={pathname}
          userName={userName}
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          onSignOut={handleSignOut}
        />

        <div className="flex min-h-screen flex-1 flex-col min-w-0">
          <PageHeader
            pathname={pathname}
            onMobileMenuOpen={openMobileMenu}
          />

          <main className="flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
