"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Link2, FileText, Loader2, ArrowRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PipelineInputProps {
  onSubmit: (input: { type: "url" | "text"; value: string }) => void;
  isLoading?: boolean;
  className?: string;
}

const PORTAL_PATTERNS: Record<string, string> = {
  "greenhouse.io": "Greenhouse",
  "lever.co": "Lever",
  "ashbyhq.com": "Ashby",
  "linkedin.com": "LinkedIn",
  "workday.com": "Workday",
  "myworkdayjobs": "Workday",
  "smartrecruiters": "SmartRecruiters",
  "icims.com": "iCIMS",
  "bamboohr.com": "BambooHR",
};

function detectPortal(url: string): string | null {
  for (const [pattern, name] of Object.entries(PORTAL_PATTERNS)) {
    if (url.includes(pattern)) return name;
  }
  return null;
}

function isUrl(value: string): boolean {
  return /^https?:\/\/\S+/i.test(value.trim());
}

export function PipelineInput({ onSubmit, isLoading = false, className }: PipelineInputProps) {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<"url" | "text">("url");
  const [detectedPortal, setDetectedPortal] = useState<string | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (isUrl(newValue)) {
      setMode("url");
      setDetectedPortal(detectPortal(newValue));
    } else if (newValue.length > 80) {
      setMode("text");
      setDetectedPortal(null);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSubmit({ type: mode, value: trimmed });
  }, [value, mode, isLoading, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative">
        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === "url"
              ? "Paste a job URL from Greenhouse, Lever, Ashby, LinkedIn..."
              : "Paste job description text here..."
          }
          rows={mode === "text" && value.length > 200 ? 8 : 3}
          disabled={isLoading}
          className={cn(
            "w-full resize-none rounded-xl border bg-white/[0.02] px-4 py-3.5 text-sm text-white placeholder:text-slate-500",
            "border-white/[0.06] focus:border-white/[0.12] focus:outline-none focus:ring-1 focus:ring-white/[0.08]",
            "transition-all duration-200",
            isLoading && "opacity-60 cursor-not-allowed"
          )}
        />

        {/* Portal detection badge */}
        {detectedPortal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.04] px-2 py-1"
          >
            <Globe className="h-3 w-3 text-slate-400" />
            <span className="text-[10px] font-medium text-slate-400">{detectedPortal}</span>
          </motion.div>
        )}
      </div>

      {/* Mode indicator + Submit */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.04] bg-white/[0.02] p-0.5">
            <button
              onClick={() => setMode("url")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-all",
                mode === "url"
                  ? "bg-white/[0.06] text-white"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Link2 className="h-3 w-3" />
              URL
            </button>
            <button
              onClick={() => setMode("text")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-all",
                mode === "text"
                  ? "bg-white/[0.06] text-white"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <FileText className="h-3 w-3" />
              Text
            </button>
          </div>

          <span className="text-[10px] text-slate-600">
            {mode === "url" ? "⌘+Enter to evaluate" : "⌘+Enter to submit"}
          </span>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          className="rounded-lg"
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Evaluating...
            </>
          ) : (
            <>
              Evaluate
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
