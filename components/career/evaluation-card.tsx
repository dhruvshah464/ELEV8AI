"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, FileText, Target, TrendingUp, Users, DollarSign, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoreDisplay } from "./score-display";
import type { CareerReport } from "@/types";

const BLOCK_CONFIG: Record<string, { icon: typeof FileText; label: string }> = {
  A: { icon: FileText, label: "Role Summary" },
  B: { icon: Target, label: "CV Match" },
  C: { icon: TrendingUp, label: "Level & Strategy" },
  D: { icon: DollarSign, label: "Comp & Demand" },
  E: { icon: Edit3, label: "Personalization Plan" },
  F: { icon: Users, label: "Interview Plan" },
};

interface EvaluationCardProps {
  report: CareerReport;
  className?: string;
  defaultExpanded?: boolean;
}

export function EvaluationCard({ report, className, defaultExpanded = false }: EvaluationCardProps) {
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(
    defaultExpanded ? new Set(Object.keys(BLOCK_CONFIG)) : new Set()
  );

  const toggleBlock = (blockId: string) => {
    setExpandedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) {
        next.delete(blockId);
      } else {
        next.add(blockId);
      }
      return next;
    });
  };

  // Parse blocks from content
  const blocks = parseBlocksFromContent(report.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "rounded-2xl border border-white/[0.04] bg-white/[0.02] overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              {report.archetype}
            </p>
            <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-white truncate">
              {report.company}
            </h3>
            <p className="mt-0.5 text-sm text-slate-400 truncate">{report.role}</p>
          </div>
          <ScoreDisplay score={report.score} maxScore={5} size="sm" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span>{report.date}</span>
          <span className="h-1 w-1 rounded-full bg-slate-600" />
          <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5">
            {report.archetype}
          </span>
        </div>
      </div>

      {/* Evaluation Blocks */}
      <div className="border-t border-white/[0.04]">
        {blocks.map((block) => {
          const config = BLOCK_CONFIG[block.id] ?? { icon: FileText, label: block.title };
          const Icon = config.icon;
          const isExpanded = expandedBlocks.has(block.id);

          return (
            <div key={block.id} className="border-b border-white/[0.03] last:border-b-0">
              <button
                onClick={() => toggleBlock(block.id)}
                className="flex w-full items-center gap-3 px-6 py-3.5 text-left transition-colors hover:bg-white/[0.02]"
              >
                <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="flex-1 text-sm font-medium text-slate-300">
                  <span className="text-slate-500 mr-1.5">{block.id})</span>
                  {config.label}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-slate-500 transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )}
                />
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 pt-0">
                      <div className="rounded-xl border border-white/[0.03] bg-white/[0.01] p-4">
                        <div
                          className="prose prose-invert prose-sm max-w-none
                            prose-headings:text-slate-200 prose-headings:font-medium
                            prose-p:text-slate-400 prose-p:leading-relaxed
                            prose-strong:text-slate-200
                            prose-td:text-slate-400 prose-th:text-slate-300
                            prose-a:text-blue-400"
                          dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(block.content) }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function parseBlocksFromContent(content: string) {
  const blockIds = ["A", "B", "C", "D", "E", "F", "G"];
  const blocks: { id: string; title: string; content: string }[] = [];

  for (let i = 0; i < blockIds.length; i++) {
    const id = blockIds[i];
    // Match headers like: ## A) Resumen del Rol or ## A — Role Summary
    const pattern = new RegExp(
      `^##\\s*${id}[)\\s—–-]\\s*(.+)$`,
      "m"
    );
    const match = content.match(pattern);
    if (!match) continue;

    const startIdx = content.indexOf(match[0]) + match[0].length;

    // Find the next block header or end of content
    let endIdx = content.length;
    for (let j = i + 1; j < blockIds.length; j++) {
      const nextPattern = new RegExp(`^##\\s*${blockIds[j]}[)\\s—–-]`, "m");
      const nextMatch = content.slice(startIdx).match(nextPattern);
      if (nextMatch?.index !== undefined) {
        endIdx = startIdx + nextMatch.index;
        break;
      }
    }

    // Also check for other ## headers
    const otherHeaderMatch = content.slice(startIdx, endIdx).match(/^##\s/m);
    if (otherHeaderMatch?.index !== undefined) {
      endIdx = Math.min(endIdx, startIdx + otherHeaderMatch.index);
    }

    blocks.push({
      id,
      title: match[1].trim(),
      content: content.slice(startIdx, endIdx).trim(),
    });
  }

  return blocks;
}

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

function simpleMarkdownToHtml(md: string): string {
  const html = md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/^(?!<[hup]|<li|<ul)/gm, "<p>")
    .replace(/(?<![>])$/gm, "</p>")
    .replace(/<p><\/p>/g, "")
    .replace(/\n/g, "<br>");
  return sanitizeHtml(html);
}
