"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import playersData from "../data/public/afl_players.json";

/** ================= Types ================= */
type PlayerPos = "FWD" | "MID" | "DEF" | "RUCK";

type Player = {
  id: string;
  name: string;
  club: string;
  pos: PlayerPos[];
  points: number;
};

type ClubMeta = {
  name: string;
  primary: string;
  text: string;
};

type Award = {
  id: string;
  label: string;
};

/** ================= Awards ================= */
const AWARDS: Award[] = [
  { id: "brownlow", label: "Brownlow" },
  { id: "coleman", label: "Coleman" },
  { id: "norm_smith", label: "Norm Smith" },
  { id: "rising_star", label: "Rising Star" },
  { id: "goal_year", label: "Goal of the Year" },
  { id: "mark_year", label: "Mark of the Year" },
];

/** ================= Club colours ================= */
const AFL_CLUBS: ClubMeta[] = [
  { name: "Collingwood", primary: "#000000", text: "#FFFFFF" },
  { name: "Carlton", primary: "#001B4D", text: "#FFFFFF" },
  { name: "Richmond", primary: "#F7B500", text: "#111111" },
  { name: "Essendon", primary: "#C8102E", text: "#FFFFFF" },
  { name: "Geelong", primary: "#0F2A4A", text: "#FFFFFF" },
  { name: "Hawthorn", primary: "#4B2E1E", text: "#FFFFFF" },
  { name: "Melbourne", primary: "#0A2A5E", text: "#FFFFFF" },
  { name: "Sydney", primary: "#E41E2B", text: "#FFFFFF" },
  { name: "Brisbane", primary: "#7C003E", text: "#FFD200" },
  { name: "West Coast", primary: "#002B5C", text: "#FFD200" },
  { name: "Fremantle", primary: "#2B0A3D", text: "#FFFFFF" },
  { name: "Adelaide", primary: "#002B5C", text: "#E41E2B" },
  { name: "Port Adelaide", primary: "#00A1DE", text: "#111111" },
  { name: "St Kilda", primary: "#C8102E", text: "#FFFFFF" },
  { name: "Western Bulldogs", primary: "#0047AB", text: "#FFFFFF" },
  { name: "North Melbourne", primary: "#003A70", text: "#FFFFFF" },
  { name: "Gold Coast", primary: "#B30000", text: "#FFD200" },
  { name: "GWS", primary: "#F15A22", text: "#111111" },
];

const LS_KEY = "coco_awards_picks_v1";

function clubForPlayer(clubs: ClubMeta[], player: Player | null): ClubMeta | null {
  if (!player) return null;
  return clubs.find((c) => c.name === player.club) ?? null;
}

function buildEmpty(): Record<string, string | null> {
  return Object.fromEntries(AWARDS.map((a) => [a.id, null])) as Record<string, string | null>;
}

export default function AwardsPage() {
  const router = useRouter();
  const ALL_PLAYERS: Player[] = playersData as Player[];

  const [picks, setPicks] = useState<Record<string, string | null>>(buildEmpty());

  const [active, setActive] = useState<{ awardId: string; awardLabel: string } | null>(null);
  const [search, setSearch] = useState("");

  /** load saved */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, string | null>;
      const next = buildEmpty();
      for (const a of AWARDS) next[a.id] = parsed[a.id] ?? null;
      setPicks(next);
    } catch {}
  }, []);

  const pickedIds = useMemo(() => {
    const ids = Object.values(picks).filter(Boolean) as string[];
    return new Set(ids);
  }, [picks]);

  const eligiblePlayers = useMemo(() => {
    if (!active) return [];
    const q = search.trim().toLowerCase();

    return ALL_PLAYERS
      .filter((p) => {
        // allow picking same player for the currently-filled slot (editing)
        const current = picks[active.awardId];
        if (current && p.id === current) return true;
        return !pickedIds.has(p.id);
      })
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [ALL_PLAYERS, active, pickedIds, picks, search]);

  const allFilled = useMemo(() => AWARDS.every((a) => Boolean(picks[a.id])), [picks]);

  function getPlayerById(pid: string | null) {
    if (!pid) return null;
    return ALL_PLAYERS.find((p) => p.id === pid) ?? null;
  }

  function openAward(a: Award) {
    setActive({ awardId: a.id, awardLabel: a.label });
    setSearch("");
  }

  function pickPlayer(playerId: string) {
    if (!active) return;

    setPicks((prev) => {
      const next = { ...prev };

      // remove duplicates: clear the player from other awards
      for (const a of AWARDS) {
        if (next[a.id] === playerId && a.id !== active.awardId) next[a.id] = null;
      }

      next[active.awardId] = playerId;
      return next;
    });

    setActive(null);
    setSearch("");
  }

  function clearAward(awardId: string) {
    setPicks((prev) => ({ ...prev, [awardId]: null }));
  }

  function save() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(picks));
    } catch {}
  }

  function reset() {
    setPicks(buildEmpty());
    setActive(null);
    setSearch("");
    try {
      localStorage.removeItem(LS_KEY);
    } catch {}
  }

  return (
    <main className="min-h-screen text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,#ffffff22,transparent_40%),radial-gradient(circle_at_80%_30%,#ffffff15,transparent_35%),radial-gradient(circle_at_30%_80%,#ffffff10,transparent_40%)]" />
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black/70 to-black/90" />

      <div className="relative mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-wide text-white">AWARDS</h1>
            <div className="mt-2 text-white/60 font-semibold">Pick a winner for each award.</div>
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
          {allFilled ? "All awards filled. Save your picks." : " "}
        </div>

        {/* 6 award boxes */}
        <div className="mt-8 grid grid-cols-1 gap-4">
          {AWARDS.map((a) => {
            const p = getPlayerById(picks[a.id]);
            const clubMeta = clubForPlayer(AFL_CLUBS, p);

            return (
              <div key={a.id} className="flex gap-3 items-center">
                {/* left blue label */}
                <div className="w-44 shrink-0 rounded-md font-extrabold text-center py-2 bg-blue-600 text-white">
                  {a.label}
                </div>

                {/* pick box */}
                <button
                  className={`flex-1 border border-white/70 rounded-md px-4 text-left transition flex items-center justify-between h-14 ${
                    p ? "hover:brightness-110" : "hover:bg-white/5"
                  }`}
                  style={
                    p && clubMeta
                      ? { backgroundColor: clubMeta.primary, color: clubMeta.text, borderColor: "rgba(255,255,255,0.35)" }
                      : { backgroundColor: "rgba(0,0,0,0.30)" }
                  }
                  onClick={() => openAward(a)}
                >
                  <span className={`truncate block ${p ? "font-extrabold" : "font-extrabold text-white/80"}`}>
                    {p ? p.name : "+ Select Player"}
                  </span>

                  {p?.pos?.length ? (
                    <span className="shrink-0 text-white/80 font-bold">{p.pos.join("/")}</span>
                  ) : null}
                </button>

                {/* clear */}
                {p ? (
                  <button
                    onClick={() => clearAward(a.id)}
                    className="rounded-md border border-white/15 px-3 h-14 text-white/70 hover:text-white hover:border-white/30"
                    title="Clear this award"
                  >
                    ✕
                  </button>
                ) : (
                  <div className="w-[46px]" />
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            className={`rounded-xl px-6 py-3 font-extrabold tracking-wide border ${
              allFilled ? "border-white/20 text-white hover:border-white/40" : "border-white/10 text-white/40 cursor-not-allowed"
            }`}
            disabled={!allFilled}
            onClick={save}
          >
            Save Picks
          </button>

          <button
            className="rounded-xl px-6 py-3 font-extrabold tracking-wide bg-blue-600/90 hover:bg-blue-600 text-white"
            onClick={reset}
          >
            RESET
          </button>
        </div>
      </div>

      {/* Picker Modal */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setActive(null)} />

          <div className="relative w-full max-w-xl rounded-2xl border border-white/15 bg-zinc-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-extrabold tracking-wide">
                Select Player <span className="text-white/60 font-bold">• {active.awardLabel}</span>
              </div>

              <button
                className="rounded-xl border border-white/20 px-3 py-2 text-white/80 hover:text-white hover:border-white/40"
                onClick={() => setActive(null)}
              >
                ✕
              </button>
            </div>

            <div className="mt-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search player..."
                className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/40"
                autoFocus
              />
            </div>

            <div className="mt-3 max-h-[420px] overflow-y-auto rounded-xl border border-white/10 bg-black/20">
              {eligiblePlayers.length === 0 ? (
                <div className="p-4 text-white/60">No players found.</div>
              ) : (
                eligiblePlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => pickPlayer(p.id)}
                    className="w-full px-4 py-3 text-left hover:bg-white/5 border-b border-white/5 last:border-b-0 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="font-extrabold truncate">{p.name}</div>
                      <div className="text-white/55 text-xs">{p.club}</div>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      <div className="text-white/60 text-sm font-bold">{p.pos.join("/")}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
