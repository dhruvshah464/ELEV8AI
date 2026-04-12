"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Copy, CheckCheck, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoreDisplay } from "./score-display";
import type { CareerReport } from "@/types";

interface ReportViewerProps {
  report: CareerReport;
  className?: string;
}

export function ReportViewer({ report, className }: ReportViewerProps) {
  const [copied, setCopied] = useState(false);

  const keywords = extractKeywords(report.content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(report.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Report Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--kriya-gradient-start),transparent_50%)]" />

        <div className="relative flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Evaluation Report
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              {report.company}
            </h1>
            <p className="mt-1 text-lg text-slate-400">{report.role}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>{report.date}</span>
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5">
                {report.archetype}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              <span>{report.fileName}</span>
            </div>
          </div>

          <ScoreDisplay score={report.score} maxScore={5} size="lg" />
        </div>
      </motion.div>

      {/* Keywords */}
      {keywords.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs font-medium text-slate-400">
              Extracted Keywords
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[11px] text-slate-400"
              >
                {kw}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Full Report Content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-white/[0.04] bg-white/[0.02] overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-white/[0.04] px-6 py-3">
          <span className="text-xs font-medium text-slate-400">Full Report</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-all"
          >
            {copied ? (
              <>
                <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
        </div>

        <div className="p-6">
          <div
            className="prose prose-invert prose-sm max-w-none
              prose-headings:text-slate-200 prose-headings:font-medium prose-headings:tracking-tight
              prose-h1:text-2xl prose-h2:text-lg prose-h2:border-b prose-h2:border-white/[0.04] prose-h2:pb-2 prose-h2:mt-8
              prose-p:text-slate-400 prose-p:leading-relaxed
              prose-strong:text-slate-200
              prose-td:text-slate-400 prose-th:text-slate-300 prose-th:text-xs prose-th:uppercase prose-th:tracking-wider
              prose-table:border-collapse
              prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
              prose-li:text-slate-400
              prose-code:text-slate-300 prose-code:bg-white/[0.04] prose-code:px-1 prose-code:rounded"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(report.content) }}
          />
        </div>
      </motion.div>
    </div>
  );
}

function extractKeywords(content: string): string[] {
  const kwSection = content.match(/## Keywords?\s*(?:extraídas?)?\s*\n([\s\S]*?)(?=\n##|\n---|\Z)/i);
  if (!kwSection) return [];

  return kwSection[1]
    .split(/\n/)
    .map((l) => l.replace(/^[-*]\s+/, "").trim())
    .filter((l) => l.length > 0 && l.length < 60)
    .slice(0, 25);
}

/** Strip dangerous HTML to prevent XSS from untrusted report content */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\bon\w+\s*=\s*\S+/gi, "")
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"')
    .replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src=""');
}

function markdownToHtml(md: string): string {
  let html = md
    // Headers
    .replace(/^#### (.+)$/gm, '<h4 class="text-base font-medium text-slate-300 mt-4 mb-2">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-medium text-slate-200 mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Code
    .replace(/`(.+?)`/g, "<code>$1</code>")
    // Tables (basic support)
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split("|").filter(Boolean).map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) return ""; // separator row
      const tag = cells.every((c) => c === c.toUpperCase() && c.length < 30) ? "th" : "td";
      return `<tr>${cells.map((c) => `<${tag} class="px-3 py-2 border border-white/[0.04]">${c}</${tag}>`).join("")}</tr>`;
    })
    // Lists
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\.\s(.+)$/gm, "<li>$1</li>")
    // Horizontal rules
    .replace(/^---+$/gm, '<hr class="border-white/[0.04] my-6">');

  // Wrap adjacent li in ul
  html = html.replace(/(<li>.*?<\/li>\n?)+/g, (match) => `<ul class="space-y-1">${match}</ul>`);

  // Wrap table rows
  html = html.replace(
    /(<tr>.*?<\/tr>\n?)+/g,
    (match) => `<table class="w-full text-sm border border-white/[0.04] rounded-lg overflow-hidden">${match}</table>`
  );

  // Paragraphs for remaining text
  html = html
    .split("\n\n")
    .map((block) => {
      if (
        block.startsWith("<h") ||
        block.startsWith("<ul") ||
        block.startsWith("<table") ||
        block.startsWith("<hr") ||
        block.trim() === ""
      ) {
        return block;
      }
      return `<p>${block}</p>`;
    })
    .join("\n");

  return sanitizeHtml(html);
}
