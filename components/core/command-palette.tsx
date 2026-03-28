"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";

type CommandItem = {
  label: string;
  href: string;
  description: string;
  protected?: boolean;
};

const commands: CommandItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    description: "Jump into your command center",
    protected: true,
  },
  {
    label: "Mission",
    href: "/mission",
    description: "Create or refine your career mission",
    protected: true,
  },
  {
    label: "Tasks",
    href: "/tasks",
    description: "Review today’s execution queue",
    protected: true,
  },
  {
    label: "Resume",
    href: "/resume",
    description: "Open the AI resume optimizer",
    protected: true,
  },
  {
    label: "Interview",
    href: "/interview",
    description: "Run a fresh AI mock interview",
    protected: true,
  },
  {
    label: "Login",
    href: "/login",
    description: "Sign into ELEV8.AI",
  },
  {
    label: "Sign Up",
    href: "/signup",
    description: "Create a new account",
  },
];

export function CommandPalette() {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const shortcutLabel =
    typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac")
      ? "⌘K"
      : "Ctrl K";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isShortcut) return;
      event.preventDefault();
      setOpen((current) => !current);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredCommands = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return commands.filter((command) => {
      if (command.protected && !user) return false;
      if (!needle) return true;
      return (
        command.label.toLowerCase().includes(needle) ||
        command.description.toLowerCase().includes(needle)
      );
    });
  }, [query, user]);

  const navigate = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs text-slate-300 shadow-[0_18px_60px_rgba(7,11,20,0.55)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:text-white md:flex"
      >
        <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
        Command
        <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
          {shortcutLabel}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl overflow-hidden border-white/10 bg-[#0f1728]/90 p-0 text-slate-100 backdrop-blur-2xl">
          <DialogHeader className="border-b border-white/10 px-6 py-5">
            <DialogTitle className="text-xl text-white">Command Palette</DialogTitle>
            <DialogDescription className="text-slate-400">
              Jump anywhere in ELEV8.AI with one command.
            </DialogDescription>
          </DialogHeader>

          <div className="border-b border-white/10 px-6 py-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search dashboard, mission, interview..."
                className="h-12 border-white/10 bg-white/[0.04] pl-11 text-sm text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="max-h-[28rem] overflow-y-auto p-3">
            <div className="space-y-2">
              {filteredCommands.map((command) => (
                <button
                  key={command.href}
                  type="button"
                  onClick={() => navigate(command.href)}
                  className="group flex w-full items-center justify-between rounded-[1.1rem] border border-transparent bg-white/[0.03] px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/20 hover:bg-white/[0.06]"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{command.label}</p>
                    <p className="text-xs text-slate-400">{command.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:text-cyan-300" />
                </button>
              ))}

              {filteredCommands.length === 0 && (
                <div className="rounded-[1.1rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-slate-400">
                  No commands matched that search.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
