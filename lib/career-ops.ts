import { readFile, readdir } from "fs/promises";
import { join, basename } from "path";
import type { CareerTrackerEntry, CareerOpsStatus, CareerReport, PipelineEntry } from "@/types";

const CAREER_OPS_DIR = process.env.CAREER_OPS_DIR || "./career-ops";

/**
 * Parse career-ops applications.md tracker into structured array
 */
export function parseApplicationsMarkdown(md: string): CareerTrackerEntry[] {
  const lines = md.split("\n").filter((line) => line.trim().startsWith("|"));

  // Skip header rows (first 2 lines: header + separator)
  const dataLines = lines.slice(2);

  return dataLines
    .map((line) => {
      const cells = line
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);

      if (cells.length < 7) return null;

      const number = parseInt(cells[0], 10);
      if (isNaN(number)) return null;

      // Extract report link: [001](reports/001-company-2026-01-01.md)
      const reportMatch = cells[7]?.match(/\[.*?\]\((.*?)\)/);
      const reportLink = reportMatch?.[1] ?? "";

      return {
        number,
        date: cells[1] || "",
        company: cells[2] || "",
        role: cells[3] || "",
        score: cells[4] || "0/5",
        status: (cells[5] || "Evaluated") as CareerOpsStatus,
        hasPdf: cells[6]?.includes("✅") ?? false,
        reportLink,
        notes: cells[8] || "",
      } satisfies CareerTrackerEntry;
    })
    .filter((entry): entry is CareerTrackerEntry => Boolean(entry));
}

/**
 * Parse evaluation report markdown into structured blocks
 */
export function parseReportMarkdown(md: string, fileName: string): CareerReport {
  const slug = fileName.replace(/\.md$/, "");

  // Extract header metadata
  const dateMatch = md.match(/\*\*Fecha:\*\*\s*(\S+)/i) || md.match(/\*\*Date:\*\*\s*(\S+)/i);
  const scoreMatch = md.match(/\*\*Score:\*\*\s*([\d.]+)/);
  const archetypeMatch = md.match(/\*\*Arquetipo:\*\*\s*(.+)/i) || md.match(/\*\*Archetype:\*\*\s*(.+)/i);

  // Extract company + role from title: # Evaluación: {Company} — {Role}
  const titleMatch = md.match(/^#\s*(?:Evaluación|Evaluation):\s*(.+?)\s*[—–-]\s*(.+)/m);
  const company = titleMatch?.[1]?.trim() ?? slug.split("-").slice(1, -3).join(" ");
  const role = titleMatch?.[2]?.trim() ?? "";

  // Parse date from filename if not in content: {num}-{company-slug}-{YYYY-MM-DD}.md
  const filenameDateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})/);

  return {
    slug,
    fileName,
    company,
    role,
    date: dateMatch?.[1] ?? filenameDateMatch?.[1] ?? "",
    score: scoreMatch ? parseFloat(scoreMatch[1]) : 0,
    archetype: archetypeMatch?.[1]?.trim() ?? "Unknown",
    content: md,
  };
}

/**
 * Parse pipeline.md into pending URLs
 */
export function parsePipelineMarkdown(md: string): PipelineEntry[] {
  const lines = md.split("\n");
  const entries: PipelineEntry[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Accept lines that start with - or * followed by a URL
    const urlMatch = trimmed.match(/^[-*]\s+(https?:\/\/\S+)/);
    if (urlMatch) {
      const url = urlMatch[1];
      // Try to detect source from URL
      let source = "unknown";
      if (url.includes("greenhouse")) source = "Greenhouse";
      else if (url.includes("lever.co")) source = "Lever";
      else if (url.includes("ashbyhq")) source = "Ashby";
      else if (url.includes("linkedin")) source = "LinkedIn";
      else if (url.includes("workday")) source = "Workday";
      else if (url.includes("jobs.")) source = "Company Portal";

      entries.push({
        url,
        source,
        status: "pending",
        addedAt: new Date().toISOString(),
      });
    }
  }

  return entries;
}

/**
 * Get the career-ops directory path
 */
export function getCareerOpsPath(...segments: string[]) {
  return join(process.cwd(), CAREER_OPS_DIR, ...segments);
}

/**
 * Read a career-ops file safely
 */
export async function readCareerOpsFile(
  ...pathSegments: string[]
): Promise<string | null> {
  try {
    const filePath = getCareerOpsPath(...pathSegments);
    return await readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

/**
 * List all evaluation reports
 */
export async function listReports(): Promise<CareerReport[]> {
  try {
    const reportsDir = getCareerOpsPath("reports");
    const files = await readdir(reportsDir);
    const mdFiles = files.filter((f) => f.endsWith(".md")).sort();

    const reports: CareerReport[] = [];
    for (const file of mdFiles) {
      const content = await readFile(join(reportsDir, file), "utf-8");
      reports.push(parseReportMarkdown(content, file));
    }

    return reports;
  } catch {
    return [];
  }
}

/**
 * Get tracker entries from applications.md
 */
export async function getTrackerEntries(): Promise<CareerTrackerEntry[]> {
  const content = await readCareerOpsFile("data", "applications.md");
  if (!content) return [];
  return parseApplicationsMarkdown(content);
}

/**
 * Get pipeline entries from pipeline.md
 */
export async function getPipelineEntries(): Promise<PipelineEntry[]> {
  const content = await readCareerOpsFile("data", "pipeline.md");
  if (!content) return [];
  return parsePipelineMarkdown(content);
}
