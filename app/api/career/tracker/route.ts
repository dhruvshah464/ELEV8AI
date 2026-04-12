import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getTrackerEntries } from "@/lib/career-ops";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entries = await getTrackerEntries();
    return NextResponse.json({
      entries,
      count: entries.length,
      summary: {
        total: entries.length,
        evaluated: entries.filter((e) => e.status === "Evaluated").length,
        applied: entries.filter((e) => e.status === "Applied").length,
        interviewing: entries.filter((e) => e.status === "Interview").length,
        offers: entries.filter((e) => e.status === "Offer").length,
        rejected: entries.filter((e) => e.status === "Rejected").length,
        avgScore:
          entries.length > 0
            ? (
                entries.reduce((sum, e) => sum + (parseFloat(e.score) || 0), 0) /
                entries.length
              ).toFixed(1)
            : "0.0",
      },
    });
  } catch (error) {
    console.error("[API] career/tracker error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracker data" },
      { status: 500 }
    );
  }
}
