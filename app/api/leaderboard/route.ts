import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const season = Number(req.nextUrl.searchParams.get("season") ?? "2026");
    const mode = req.nextUrl.searchParams.get("mode") ?? "unlimited_fantasy";

    const { data, error } = await supabase
      .from("global_scores")
      .select("id, user_id, username, score, season, mode, team_json")
      .eq("season", season)
      .eq("mode", mode)
      .order("score", { ascending: false })
      .limit(100);

    if (error) {
      console.error("SUPABASE ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("API /leaderboard crash:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load leaderboard.",
      },
      { status: 500 }
    );
  }
}