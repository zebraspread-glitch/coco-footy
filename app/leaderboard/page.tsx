"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Crown,
  Medal,
  Search,
  Trophy,
} from "lucide-react";

type StatMode = "fantasy" | "sc" | "goals" | "disposals" | "bounces";

type LeaderboardRow = {
  id: string;
  user_id: string;
  username: string;
  score: number | null;
  season: number;
  mode: string;
  team_json?: Record<
  string,
  {
    id: string;
    name: string;
    club: string;
    points: number;
    pos: string[];
  } | null
>;
};

const STAT_OPTIONS: Array<{ key: StatMode; label: string }> = [
  { key: "fantasy", label: "Fantasy Points" },
  { key: "sc", label: "SC Points" },
  { key: "goals", label: "Goals" },
  { key: "disposals", label: "Disposals" },
  { key: "bounces", label: "Bounces" },
];

function dbMode(stat: StatMode) {
  return `unlimited_${stat}`;
}

function formatScore(value: number | null | undefined, stat: StatMode) {
  const num = Number(value ?? 0);
  if (stat === "goals" || stat === "bounces") return String(Math.round(num));
  return num.toFixed(1);
}

function rankColor(rank: number) {
  if (rank === 1) return "text-yellow-300";
  if (rank === 2) return "text-white";
  if (rank === 3) return "text-orange-300";
  return "text-white/70";
}

function scoreColor(rank: number) {
  if (rank <= 2) return "text-cyan-300";
  return "text-fuchsia-400";
}

function rankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-4 w-4 text-yellow-300" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-white" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-orange-300" />;
  return null;
}

export default function LeaderboardPage() {
  const [query, setQuery] = useState("");
  const [stat, setStat] = useState<StatMode>("fantasy");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<LeaderboardRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/leaderboard?season=2026&mode=${dbMode(stat)}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }

        const data = (await response.json()) as LeaderboardRow[];

        if (cancelled) return;
        setRows((data ?? []).filter((row) => row.username));
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to fetch leaderboard."
        );
        setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLeaderboard();
    return () => {
      cancelled = true;
    };
  }, [stat]);

  const filteredRows = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter((r) =>
      r.username.toLowerCase().includes(q)
    );
  }, [rows, query]);

  const topScore = filteredRows[0]?.score ?? 0;

  return (
    <div
      className="min-h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: "url('/coco-footy-bg.png')" }}
    >
      <div className="fixed inset-0 -z-10 bg-black/60" />

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* TOP BAR */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back Home
          </Link>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 h-4 w-4" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search username..."
              className="pl-10 pr-4 py-2 rounded-full bg-black/40 border border-white/10 text-sm"
            />
          </div>
        </div>

        {/* STAT BUTTONS */}
        <div className="mt-6 flex flex-wrap gap-3">
          {STAT_OPTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setStat(s.key)}
              className={`px-5 py-2 rounded-full border text-sm font-bold ${
                stat === s.key
                  ? "bg-white text-black border-white"
                  : "border-white/20 text-white/70 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* HEADER */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-black/60">
          <div className="p-6 border-b border-white/10">
            <div className="flex justify-between">
              <div>
                <div className="text-yellow-300 text-xs tracking-widest">
                  GLOBAL LEADERBOARD
                </div>
                <h1 className="text-3xl font-black mt-2">
                  Unlimited Leaderboard
                </h1>
                <p className="text-white/60 text-sm mt-1">
                  {STAT_OPTIONS.find((s) => s.key === stat)?.label} (2026)
                </p>
              </div>

              <div className="text-right">
                <div className="text-sm text-white/50">TOP SCORE</div>
                <div className="text-2xl font-black text-purple-300">
                  {formatScore(topScore, stat)}
                </div>
              </div>
            </div>
          </div>

          {/* TABLE */}
          {loading ? (
            <div className="p-10 text-center">Loading...</div>
          ) : error ? (
            <div className="p-10 text-center text-red-400">{error}</div>
          ) : (
            <div>
              <div className="grid grid-cols-[80px_1fr_140px_100px] px-4 py-3 text-xs text-white/60 border-b border-white/10">
                <div>RANK</div>
                <div>USER</div>
                <div className="text-center">HIGH SCORE</div>
                <div className="text-right">TEAM</div>
              </div>

              {selectedRow && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div
      className="w-full max-w-6xl rounded-2xl border border-white/10 p-4 sm:p-6 shadow-2xl"
      style={{
        backgroundImage: "url('/coco-footy-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="rounded-2xl bg-black/70 p-4 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-bold tracking-wide text-white/70">
              TEAM VIEW
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {selectedRow.username}
            </h2>
            <div className="mt-1 text-white/70">
              {STAT_OPTIONS.find((s) => s.key === stat)?.label} •{" "}
              {formatScore(selectedRow.score, stat)}{" "}
              {stat === "goals"
                ? "GOALS"
                : stat === "bounces"
                ? "BOUNCES"
                : "PTS"}
            </div>
          </div>

          <button
            onClick={() => setSelectedRow(null)}
            className="rounded-xl border border-white/15 bg-black/30 px-4 py-2 text-sm font-bold text-white/80 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="space-y-3">
          {["fwd1", "fwd2", "mid1", "mid2", "def1", "def2", "ruck", "flex1"].map((slotKey) => {
            const player = selectedRow.team_json?.[slotKey];

            const slotLabel =
              slotKey === "fwd1" || slotKey === "fwd2"
                ? "FWD"
                : slotKey === "mid1" || slotKey === "mid2"
                ? "MID"
                : slotKey === "def1" || slotKey === "def2"
                ? "DEF"
                : slotKey === "ruck"
                ? "RUCK"
                : "FLEX";

            const clubColors: Record<string, { bg: string; text: string }> = {
              Adelaide: { bg: "#002B5C", text: "#E41E2B" },
              Brisbane: { bg: "#7C003E", text: "#FFD200" },
              Carlton: { bg: "#001B4D", text: "#FFFFFF" },
              Collingwood: { bg: "#000000", text: "#FFFFFF" },
              Essendon: { bg: "#C8102E", text: "#FFFFFF" },
              Fremantle: { bg: "#2B0A3D", text: "#FFFFFF" },
              Geelong: { bg: "#0F2A4A", text: "#FFFFFF" },
              "Gold Coast": { bg: "#B30000", text: "#FFD200" },
              GWS: { bg: "#F15A22", text: "#111111" },
              Hawthorn: { bg: "#4B2E1E", text: "#FFFFFF" },
              Melbourne: { bg: "#0A2A5E", text: "#FFFFFF" },
              "North Melbourne": { bg: "#003A70", text: "#FFFFFF" },
              "Port Adelaide": { bg: "#00A1DE", text: "#111111" },
              Richmond: { bg: "#F7B500", text: "#111111" },
              "St Kilda": { bg: "#C8102E", text: "#000000" },
              Sydney: { bg: "#E41E2B", text: "#FFFFFF" },
              "West Coast": { bg: "#002B5C", text: "#FFD200" },
              "Western Bulldogs": { bg: "#0047AB", text: "#FFFFFF" },
            };

            const colors = player?.club
              ? clubColors[player.club] ?? { bg: "#111111", text: "#FFFFFF" }
              : { bg: "#111111", text: "#FFFFFF" };

            return (
              <div key={slotKey} className="flex items-stretch gap-3">
                <div className="flex min-w-[72px] items-center justify-center rounded-xl bg-red-500 px-3 text-base font-black text-white sm:min-w-[84px]">
                  {slotLabel}
                </div>

                <div
                  className="flex flex-1 items-center justify-between rounded-xl border border-white/10 px-4 py-4"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  <div className="min-w-0">
                    <div className="truncate text-xl font-black">
                      {player?.name ?? "-"}
                    </div>
                  </div>

                  <div className="ml-4 rounded-xl bg-black/35 px-4 py-2 text-sm font-black text-white whitespace-nowrap">
                    {player
                      ? `${formatScore(player.points, stat)} ${
                          stat === "goals"
                            ? "GOALS"
                            : stat === "bounces"
                            ? "BOUNCES"
                            : "PTS"
                        }`
                      : "-"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
)}

              {filteredRows.map((row, i) => {
                const rank = i + 1;

                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-[80px_1fr_140px_100px] px-4 py-4 border-b border-white/5 hover:bg-white/5"
                  >
                    <div className={`flex gap-2 ${rankColor(rank)}`}>
                      {rankIcon(rank)}
                      {rank}
                    </div>

                    <div className="font-bold underline">
                      {row.username}
                    </div>

                    <div className={`text-center ${scoreColor(rank)}`}>
                      {formatScore(row.score, stat)}
                    </div>

                    <button
  onClick={() => setSelectedRow(row)}
  className="text-right text-white/50 flex justify-end items-center gap-1 hover:text-white transition"
>
  View <ChevronRight className="h-4 w-4" />
</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}