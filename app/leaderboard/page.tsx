"use client";

import React, { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";

type LeaderboardRow = {
  id: string;
  user: string;
  highScore: number;
  teamId?: string;
};

/** Demo data — replace with your real API/data later */
const DEMO_ROWS: LeaderboardRow[] = [
  { id: "1", user: "azamat7", highScore: 3003.3, teamId: "t1" },
  { id: "2", user: "Logixaal", highScore: 3001.1, teamId: "t2" },
  { id: "3", user: "alexlog12", highScore: 2988.3, teamId: "t3" },
  { id: "4", user: "Roryd", highScore: 2988.3, teamId: "t4" },
  { id: "5", user: "Dylanvan", highScore: 2986.3, teamId: "t5" },
  { id: "6", user: "jpjuno28", highScore: 2984.7, teamId: "t6" },
  { id: "7", user: "Otabek1210", highScore: 2984.1, teamId: "t7" },
  { id: "8", user: "BrodyThomas", highScore: 2982.3, teamId: "t8" },
  { id: "9", user: "solosky", highScore: 2979.2, teamId: "t9" },
  { id: "10", user: "Jrsk", highScore: 2979.2, teamId: "t10" },
  { id: "11", user: "MJthegoat", highScore: 2978.8, teamId: "t11" },
  { id: "12", user: "Cmerenda4", highScore: 2977.8, teamId: "t12" },
  { id: "13", user: "luhjacob2x", highScore: 2977.8, teamId: "t13" },
  { id: "14", user: "dwyrich", highScore: 2975.9, teamId: "t14" },
];

function rankBadgeClass(rank: number) {
  if (rank === 1) return "text-yellow-300";
  if (rank === 2) return "text-slate-200";
  if (rank === 3) return "text-amber-500";
  return "text-white/70";
}

export default function LeaderboardPage() {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DEMO_ROWS;
    return DEMO_ROWS.filter((r) => r.user.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="min-h-screen text-white bg-black">
      {/* Background texture */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_600px_at_55%_35%,rgba(59,130,246,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_600px_at_40%_70%,rgba(168,85,247,0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
      </div>

      {/* Top bar */}
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <div className="flex items-center justify-between gap-4">
          <a
            href="/unlimited"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Game
          </a>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/45" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search user…"
                className="w-[240px] rounded-full border border-white/10 bg-black/30 pl-9 pr-4 py-2 text-sm text-white/90 placeholder:text-white/40 outline-none focus:border-white/25"
              />
            </div>
          </div>
        </div>

        {/* Leaderboard card */}
        <div className="mt-8 mx-auto max-w-3xl rounded-2xl border border-white/10 bg-black/35 backdrop-blur shadow-[0_0_0_1px_rgba(255,255,255,0.02)] overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[90px_1fr_140px_110px] gap-0 px-6 py-4 text-xs font-bold tracking-widest text-white/70 bg-white/5 border-b border-white/10">
            <div>RANK</div>
            <div>USER</div>
            <div className="text-center">HIGH SCORE</div>
            <div className="text-right">TEAM</div>
          </div>

          {/* Rows */}
          <div>
            {rows.map((r, idx) => {
              const rank = idx + 1;
              return (
                <div
                  key={r.id}
                  className="grid grid-cols-[90px_1fr_140px_110px] items-center px-6 py-5 border-b border-white/10 last:border-b-0 hover:bg-white/5 transition"
                >
                  <div className={`font-extrabold ${rankBadgeClass(rank)}`}>
                    {rank}
                  </div>

                  <div className="font-semibold">{r.user}</div>

                  <div className="text-center font-extrabold text-purple-400 tabular-nums">
                    {r.highScore.toFixed(1)}
                  </div>

                  <div className="text-right">
                    <a
                      href={r.teamId ? `/team/${encodeURIComponent(r.teamId)}` : "#"}
                      className="inline-flex items-center justify-end gap-2 text-sm text-white/60 hover:text-white transition"
                      onClick={(e) => {
                        if (!r.teamId) e.preventDefault();
                      }}
                    >
                      View <ChevronRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              );
            })}

            {rows.length === 0 && (
              <div className="px-6 py-10 text-center text-white/60">
                No users found.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-white/35">
          Coco Footy • Leaderboard
        </div>
      </div>
    </div>
  );
}
