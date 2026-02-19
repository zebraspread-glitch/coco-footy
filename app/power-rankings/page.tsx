"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/** ================= Types ================= */
type Team = {
  id: string;
  name: string;
  primary: string;
  text: string;
};

/** ================= AFL Teams (18) =================
 * NOTE: Your earlier list includes "GWS" but is missing a few teams (Fitzroy doesn't exist etc)
 * Add/adjust colours any time — this is the structure you need.
 */
const AFL_TEAMS: Team[] = [
  { id: "adel", name: "Adelaide", primary: "#002B5C", text: "#E41E2B" },
  { id: "bris", name: "Brisbane", primary: "#7C003E", text: "#FFD200" },
  { id: "carl", name: "Carlton", primary: "#001B4D", text: "#FFFFFF" },
  { id: "coll", name: "Collingwood", primary: "#000000", text: "#FFFFFF" },
  { id: "ess", name: "Essendon", primary: "#C8102E", text: "#FFFFFF" },
  { id: "fre", name: "Fremantle", primary: "#2B0A3D", text: "#FFFFFF" },
  { id: "gee", name: "Geelong", primary: "#0F2A4A", text: "#FFFFFF" },
  { id: "gcs", name: "Gold Coast", primary: "#B30000", text: "#FFD200" },
  { id: "gws", name: "GWS", primary: "#F15A22", text: "#111111" },
  { id: "haw", name: "Hawthorn", primary: "#4B2E1E", text: "#FFFFFF" },
  { id: "mel", name: "Melbourne", primary: "#0A2A5E", text: "#FFFFFF" },
  { id: "nm", name: "North Melbourne", primary: "#003A70", text: "#FFFFFF" },
  { id: "port", name: "Port Adelaide", primary: "#00A1DE", text: "#111111" },
  { id: "rich", name: "Richmond", primary: "#F7B500", text: "#111111" },
  { id: "stk", name: "St Kilda", primary: "#C8102E", text: "#FFFFFF" },
  { id: "syd", name: "Sydney", primary: "#E41E2B", text: "#FFFFFF" },
  { id: "wc", name: "West Coast", primary: "#002B5C", text: "#FFD200" },
  { id: "wbd", name: "Western Bulldogs", primary: "#0047AB", text: "#FFFFFF" },
];

const LS_KEY = "coco_power_rankings_v1";

/** ranks 1..18 */
const RANKS = Array.from({ length: 18 }, (_, i) => i + 1);

function buildEmptyRankings(): Record<number, string | null> {
  return Object.fromEntries(RANKS.map((r) => [r, null])) as Record<number, string | null>;
}

function getTeamById(id: string | null): Team | null {
  if (!id) return null;
  return AFL_TEAMS.find((t) => t.id === id) ?? null;
}

/** ================= Page ================= */
export default function PowerRankingsPage() {
  const router = useRouter();

  const [rankings, setRankings] = useState<Record<number, string | null>>(buildEmptyRankings());
  const [activeRank, setActiveRank] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  /** load saved */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, string | null>;
      // normalize to number keys 1..18
      const next = buildEmptyRankings();
      for (const r of RANKS) {
        const v = parsed[String(r)];
        next[r] = v ?? null;
      }
      setRankings(next);
    } catch {
      // ignore
    }
  }, []);

  const pickedTeamIds = useMemo(() => {
    return new Set(Object.values(rankings).filter(Boolean) as string[]);
  }, [rankings]);

  const isComplete = useMemo(() => {
    return RANKS.every((r) => Boolean(rankings[r]));
  }, [rankings]);

  const eligibleTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    // show all teams, but in the modal we block duplicates unless it's the same slot team
    return AFL_TEAMS
      .filter((t) => (q ? t.name.toLowerCase().includes(q) : true))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [search]);

  function openRank(rank: number) {
    setActiveRank(rank);
    setSearch("");
  }

  function onPickTeam(teamId: string) {
    if (activeRank == null) return;

    setRankings((prev) => {
      const next: Record<number, string | null> = { ...prev };

      // remove this team from any other rank (no duplicates)
      for (const r of RANKS) {
        if (next[r] === teamId) next[r] = null;
      }

      // set selected rank
      next[activeRank] = teamId;
      return next;
    });

    setActiveRank(null);
    setSearch("");
  }

  function onClearRank(rank: number) {
    setRankings((prev) => ({ ...prev, [rank]: null }));
  }

  function onSave() {
    try {
      // store with string keys for safety
      const payload: Record<string, string | null> = {};
      for (const r of RANKS) payload[String(r)] = rankings[r];
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch {}
  }

  function onReset() {
    setRankings(buildEmptyRankings());
    setActiveRank(null);
    setSearch("");
    try {
      localStorage.removeItem(LS_KEY);
    } catch {}
  }

  return (
    <main className="min-h-screen text-white relative overflow-hidden">
      {/* Background (same vibe as your modes) */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,#ffffff22,transparent_40%),radial-gradient(circle_at_80%_30%,#ffffff15,transparent_35%),radial-gradient(circle_at_30%_80%,#ffffff10,transparent_40%)]" />
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black/70 to-black/90" />

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-wide text-white">POWER RANKINGS</h1>
            <div className="mt-2 text-white/60 font-semibold">
              Rank the AFL teams from <span className="text-white">1</span> to <span className="text-white">18</span>.
            </div>
          </div>

          <button
            className="rounded-xl border border-white/20 px-4 py-2 text-white/80 hover:text-white hover:border-white/40"
            onClick={() => router.push("/")}
          >
            ← Home
          </button>
        </div>

        {/* Status */}
        <div className="mt-6 text-center text-white/60 font-semibold tracking-wide">
          {isComplete ? "All ranks filled. Save your picks." : "Tap a rank to choose a team."}
        </div>

        {/* Grid (2 columns like your screenshot layout) */}
        <div className="mt-8 grid grid-cols-2 gap-8">
          {/* Left: 1-9 */}
          <div className="space-y-3">
            {RANKS.slice(0, 9).map((r) => (
              <RankRow
                key={r}
                rank={r}
                teamId={rankings[r]}
                onOpen={() => openRank(r)}
                onClear={() => onClearRank(r)}
              />
            ))}
          </div>

          {/* Right: 10-18 */}
          <div className="space-y-3">
            {RANKS.slice(9).map((r) => (
              <RankRow
                key={r}
                rank={r}
                teamId={rankings[r]}
                onOpen={() => openRank(r)}
                onClear={() => onClearRank(r)}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            className={`rounded-xl px-6 py-3 font-extrabold tracking-wide border ${
              isComplete ? "border-white/20 text-white hover:border-white/40" : "border-white/10 text-white/40 cursor-not-allowed"
            }`}
            disabled={!isComplete}
            onClick={onSave}
            title={!isComplete ? "Fill all 18 ranks to save" : "Save your power rankings"}
          >
            Save Picks
          </button>

          <button
            className="rounded-xl px-6 py-3 font-extrabold tracking-wide bg-yellow-600/90 hover:bg-yellow-600 text-black"
            onClick={onReset}
          >
            RESET
          </button>
        </div>
      </div>

      {/* Team Picker Modal */}
      {activeRank != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setActiveRank(null)} />

          <div className="relative w-full max-w-xl rounded-2xl border border-white/15 bg-zinc-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-extrabold tracking-wide">
                Select Team <span className="text-white/60 font-bold">• Rank {activeRank}</span>
              </div>

              <button
                className="rounded-xl border border-white/20 px-3 py-2 text-white/80 hover:text-white hover:border-white/40"
                onClick={() => setActiveRank(null)}
              >
                ✕
              </button>
            </div>

            <div className="mt-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search team..."
                className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/40"
                autoFocus
              />
            </div>

            <div className="mt-3 max-h-[420px] overflow-y-auto rounded-xl border border-white/10 bg-black/20">
              {eligibleTeams.map((t) => {
                const alreadyPickedSomewhere = pickedTeamIds.has(t.id);
                const currentlyInThisRank = rankings[activeRank] === t.id;

                const disabled = alreadyPickedSomewhere && !currentlyInThisRank;

                return (
                  <button
                    key={t.id}
                    disabled={disabled}
                    onClick={() => onPickTeam(t.id)}
                    className={`w-full px-4 py-3 text-left border-b border-white/5 last:border-b-0 flex items-center justify-between gap-3 ${
                      disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-white/5"
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <div
                        className="h-6 w-6 rounded-md border border-white/20"
                        style={{ backgroundColor: t.primary }}
                        title="Team colour"
                      />
                      <div className="font-extrabold truncate">{t.name}</div>
                    </div>

                    {disabled && (
                      <div className="text-white/50 text-xs font-bold">Already ranked</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/** ================= UI bits ================= */
function RankRow({
  rank,
  teamId,
  onOpen,
  onClear,
}: {
  rank: number;
  teamId: string | null;
  onOpen: () => void;
  onClear: () => void;
}) {
  const team = getTeamById(teamId);

  return (
    <div className="flex gap-3 items-center">
      <div className="w-20 shrink-0 rounded-md font-extrabold text-center py-2 bg-yellow-600 text-black">
        {rank}
      </div>

      <button
        onClick={onOpen}
        className={`flex-1 border border-white/70 rounded-md px-4 text-left transition flex items-center justify-between h-14 ${
          team ? "hover:brightness-110" : "hover:bg-white/5"
        }`}
        style={
          team
            ? { backgroundColor: team.primary, color: team.text, borderColor: "rgba(255,255,255,0.35)" }
            : { backgroundColor: "rgba(0,0,0,0.30)" }
        }
      >
        <span className={`truncate block ${team ? "font-extrabold" : "font-extrabold text-white/80"}`}>
          {team ? team.name : "+ Select Team"}
        </span>

      </button>

      {/* clear button only if filled */}
      {team ? (
        <button
          onClick={onClear}
          className="rounded-md border border-white/15 px-3 h-14 text-white/70 hover:text-white hover:border-white/30"
          title="Clear this rank"
        >
          ✕
        </button>
      ) : (
        <div className="w-[46px]" />
      )}
    </div>
  );
}
