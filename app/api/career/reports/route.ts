import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { listReports, readCareerOpsFile, parseReportMarkdown } from "@/lib/career-ops";

export async function GET(request: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  try {
    if (slug) {
      const content = await readCareerOpsFile("reports", `${slug}.md`);
      if (!content) {
        return NextResponse.json(
          { error: "Report not found" },
          { status: 404 }
        );
      }
      const report = parseReportMarkdown(content, `${slug}.md`);
      return NextResponse.json({ report });
    }

    const reports = await listReports();
    return NextResponse.json({
      reports,
      count: reports.length,
    });
  } catch (error) {
    console.error("[API] career/reports error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
