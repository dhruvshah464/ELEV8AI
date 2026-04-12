import { NextResponse } from "next/server";
import { appendFile, mkdir } from "fs/promises";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPipelineEntries, getCareerOpsPath } from "@/lib/career-ops";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entries = await getPipelineEntries();
    return NextResponse.json({
      entries,
      count: entries.length,
    });
  } catch (error) {
    console.error("[API] career/pipeline error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pipeline" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url, text } = body;

    if (!url && !text) {
      return NextResponse.json(
        { error: "Provide a job URL or job description text" },
        { status: 400 }
      );
    }

    // Write to career-ops/data/pipeline.md so the CLI agent can process it
    const dataDir = getCareerOpsPath("data");
    await mkdir(dataDir, { recursive: true });

    const pipelinePath = getCareerOpsPath("data", "pipeline.md");
    const entry = url || text;
    const timestamp = new Date().toISOString().split("T")[0];
    const newLine = `- ${entry}  <!-- added ${timestamp} -->\n`;

    await appendFile(pipelinePath, newLine);

    return NextResponse.json({
      status: "queued",
      message: url
        ? `Job URL added to pipeline: ${url}`
        : "Job description added to pipeline",
      input: { type: url ? "url" : "text", value: url || text },
    });
  } catch (error) {
    console.error("[API] career/pipeline POST error:", error);
    return NextResponse.json(
      { error: "Failed to process pipeline input" },
      { status: 500 }
    );
  }
}
