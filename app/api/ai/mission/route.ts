import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { generateCareerMission, getAiDebugInfo } from "@/services/ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          action: "career_mission",
          error: "Unauthorized",
          debug: {
            ...getAiDebugInfo(),
            requestId,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { role, company, experience, description } = body;

    if (!role || !experience) {
      return NextResponse.json(
        {
          ok: false,
          action: "career_mission",
          error: "Role and experience are required.",
          debug: {
            ...getAiDebugInfo(),
            requestId,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    const plan = await generateCareerMission({
      role,
      company,
      experience,
      description,
    });

    return NextResponse.json({
      ok: true,
      action: "career_mission",
      data: plan,
      debug: {
        ...getAiDebugInfo(),
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error("Mission AI Route Error:", error);
    return NextResponse.json(
      {
        ok: false,
        action: "career_mission",
        error: error instanceof Error ? error.message : "Failed to generate mission",
        debug: {
          ...getAiDebugInfo(),
          requestId,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
