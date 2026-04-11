import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ScoreRow = {
  id: string;
  user_id: string;
  username: string;
  score: number | null;
  season: number;
  mode: string;
  team_json?: Record<string, any> | null;
};

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
      .eq("mode", mode);

    if (error) {
      console.error("SUPABASE ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as ScoreRow[];

    const bestByUser = new Map<string, ScoreRow>();

    for (const row of rows) {
      if (!row.user_id || !row.username) continue;

      const existing = bestByUser.get(row.user_id);

      if (!existing || Number(row.score ?? 0) > Number(existing.score ?? 0)) {
        bestByUser.set(row.user_id, row);
      }
    }

    const leaderboard = Array.from(bestByUser.values())
      .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))
      .slice(0, 100);

    return NextResponse.json(leaderboard);
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