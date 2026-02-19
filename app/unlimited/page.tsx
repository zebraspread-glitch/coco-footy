"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import playersData from "../data/public/afl_players.json";

/** ================= Types ================= */
type PlayerPos = "FWD" | "MID" | "DEF" | "RUCK";
type SlotPos = "FWD" | "MID" | "DEF" | "RUCK" | "FLEX";
type Position = "FWD" | "MID" | "DEF" | "RUCK" | "FLEX";

type Slot = {
  id: string;
  label: Position; // slots can be FLEX
  allowed: PlayerPos[]; // allowed player positions (no FLEX)
};

type Player = {
  id: string;
  name: string;
  club: string;
  pos: PlayerPos[]; // array
  points: number;
};

type ClubMeta = {
  name: string;
  primary: string;
  text: string;
};

/** ================= Slots (AFL) ================= */
const SLOTS: Slot[] = [
  { id: "fwd1", label: "FWD", allowed: ["FWD"] },
  { id: "fwd2", label: "FWD", allowed: ["FWD"] },
  { id: "mid1", label: "MID", allowed: ["MID"] },
  { id: "mid2", label: "MID", allowed: ["MID"] },
  { id: "def1", label: "DEF", allowed: ["DEF"] },
  { id: "def2", label: "DEF", allowed: ["DEF"] },
  { id: "ruck", label: "RUCK", allowed: ["RUCK"] },
  { id: "flex1", label: "FLEX", allowed: ["FWD", "MID", "DEF"] },
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
  { name: "St Kilda", primary: "#C8102E", text: "#000000" },
  { name: "Western Bulldogs", primary: "#0047AB", text: "#FFFFFF" },
  { name: "North Melbourne", primary: "#003A70", text: "#FFFFFF" },
  { name: "Gold Coast", primary: "#B30000", text: "#FFD200" },
  { name: "GWS", primary: "#F15A22", text: "#111111" },
];

/** ================= Helpers ================= */
function sumPoints(
  team: Record<string, string | null>,
  getById: (id: string | null) => Player | null
) {
  let total = 0;
  for (const slotId of Object.keys(team)) {
    const p = getById(team[slotId]);
    if (p) total += p.points;
  }
  return total;
}

function clampClubsToPlayers(clubs: ClubMeta[], players: Player[]) {
  const available = new Set(players.map((p) => p.club));
  return clubs.filter((c) => available.has(c.name));
}

function clubForPlayer(clubs: ClubMeta[], player: Player | null): ClubMeta | null {
  if (!player) return null;
  return clubs.find((c) => c.name === player.club) ?? null;
}
function clubSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function patternUrlForClub(clubName: string) {
  return `/patterns/${clubSlug(clubName)}.svg`;
}


/** ================= Page ================= */
export default function UnlimitedDraftPage() {
  const router = useRouter();

  const ALL_PLAYERS: Player[] = playersData as Player[];
  const SPIN_CLUBS = useMemo(
    () => clampClubsToPlayers(AFL_CLUBS, ALL_PLAYERS),
    [ALL_PLAYERS]
  );

  const [club, setClub] = useState<ClubMeta>(SPIN_CLUBS[0] ?? AFL_CLUBS[0]);
  const [displayClub, setDisplayClub] = useState<ClubMeta>(club);
  const [spinning, setSpinning] = useState(false);

  // Spin after every 2 picks
  const [picksSinceSpin, setPicksSinceSpin] = useState(0);

  // Picker modal state
  const [active, setActive] = useState<{
    slotId: string;
    allowed: PlayerPos[];
    slotLabel: SlotPos;
  } | null>(null);

  // Search for list picker
  const [search, setSearch] = useState("");

  // Single Team
  const [team, setTeam] = useState<Record<string, string | null>>(
    Object.fromEntries(SLOTS.map((s) => [s.id, null]))
  );

  const getPlayerById = (pid: string | null) => {
    if (!pid) return null;
    return ALL_PLAYERS.find((p) => p.id === pid) ?? null;
  };

  const pickedIds = useMemo(() => {
    const ids: string[] = [];
    Object.values(team).forEach((id) => id && ids.push(id));
    return new Set(ids);
  }, [team]);

  const clubPlayers = useMemo(
    () => ALL_PLAYERS.filter((p) => p.club === club.name),
    [ALL_PLAYERS, club.name]
  );

  const eligiblePlayers = useMemo(() => {
    if (!active) return [];
    const q = search.trim().toLowerCase();

    return clubPlayers
      .filter((p) => !pickedIds.has(p.id))
      .filter((p) => p.pos.some((pos) => active.allowed.includes(pos)))
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true));
  }, [active, clubPlayers, pickedIds, search]);

  const currentScore = useMemo(() => sumPoints(team, getPlayerById), [team]);

  const allFilled = useMemo(() => SLOTS.every((s) => Boolean(team[s.id])), [team]);
  const gameOver = allFilled;

  /** ===== High score (localStorage) ===== */
  const [highScore, setHighScore] = useState<number>(0);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem("unlimited_highscore") ?? 0);
      setHighScore(Number.isFinite(saved) ? saved : 0);
    } catch {
      setHighScore(0);
    }
  }, []);

  useEffect(() => {
    if (currentScore > highScore) {
      setHighScore(currentScore);
      try {
        localStorage.setItem("unlimited_highscore", String(currentScore));
      } catch {}
    }
  }, [currentScore, highScore]);

  /** ===== Spinner effect ===== */
  const spinTimer = useRef<number | null>(null);
  const spinTimeout = useRef<number | null>(null);
  const delayedSpinTimeout = useRef<number | null>(null);

  function cleanupSpinTimers() {
    if (spinTimer.current) window.clearInterval(spinTimer.current);
    if (spinTimeout.current) window.clearTimeout(spinTimeout.current);
    if (delayedSpinTimeout.current) window.clearTimeout(delayedSpinTimeout.current);
    spinTimer.current = null;
    spinTimeout.current = null;
    delayedSpinTimeout.current = null;
  }

  function spinToRandomClub() {
    if (gameOver) return;
    if (spinning || SPIN_CLUBS.length === 0) return;

    setSpinning(true);
    setActive(null);
    setSearch("");
    setPicksSinceSpin(0);

    let i = 0;
    cleanupSpinTimers();

    spinTimer.current = window.setInterval(() => {
      i = (i + 1) % SPIN_CLUBS.length;
      setDisplayClub(SPIN_CLUBS[i]);
    }, 60);

    spinTimeout.current = window.setTimeout(() => {
      cleanupSpinTimers();
      let final = club;
if (SPIN_CLUBS.length > 1) {
  do {
    final = SPIN_CLUBS[Math.floor(Math.random() * SPIN_CLUBS.length)];
  } while (final.name === club.name);
} else {
  final = SPIN_CLUBS[0];
}

      setClub(final);
      setDisplayClub(final);
      setSpinning(false);
    }, 1200);
  }

  useEffect(() => {
    spinToRandomClub();
    return () => cleanupSpinTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!gameOver) return;
    cleanupSpinTimers();
    setSpinning(false);
    setActive(null);
    setSearch("");
  }, [gameOver]);

  function slotIsFilled(slotId: string) {
    return Boolean(team[slotId]);
  }

  function onOpen(slot: Slot) {
    if (gameOver) return;
    if (spinning) return;

    // LOCKED: can't replace once filled
    if (slotIsFilled(slot.id)) return;

    setSearch("");
    setActive({ slotId: slot.id, allowed: slot.allowed, slotLabel: slot.label });
  }

  function onPick(playerId: string) {
    if (gameOver) return;
    if (!active) return;
    if (spinning) return;

    // Double-check lock
    if (slotIsFilled(active.slotId)) return;

    setTeam((prev) => ({ ...prev, [active.slotId]: playerId }));

    setActive(null);
    setSearch("");

    // spin after every 2 picks total
   delayedSpinTimeout.current = window.setTimeout(() => {
  if (!gameOver) spinToRandomClub();
}, 650);

  }

  function resetGame() {
    cleanupSpinTimers();
    setSpinning(false);
    setActive(null);
    setSearch("");
    setPicksSinceSpin(0);
    setTeam(Object.fromEntries(SLOTS.map((s) => [s.id, null])));
    // kick off a new spin
    window.setTimeout(() => spinToRandomClub(), 50);
  }

  return (
    <main className="min-h-screen text-white relative overflow-hidden">
{/* Background image */}
<div
  className="absolute inset-0"
  style={{
    backgroundImage: "url('/versus-bg.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
  }}
/>

{/* Overlay (controls darkness) */}
<div className="absolute inset-0 bg-black/35" />


      <div className="relative mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-wide text-white">
              UNLIMITED MODE
            </h1>
          </div>

          <button
            className="rounded-xl border border-white/20 px-4 py-2 text-white/80 hover:text-white hover:border-white/40"
            onClick={() => router.push("/")}
          >
            ← Home
          </button>
        </div>

        {/* Scores */}
        <div className="mt-10 text-center">
          <div className="text-white/70 font-bold tracking-wide">
            HIGH SCORE:{" "}
            <span className="text-white">{highScore.toFixed(1)} PTS</span>
          </div>
          <div className="mt-2 text-white/70 font-bold tracking-wide">
            CURRENT SCORE:{" "}
            <span className="text-white">{currentScore.toFixed(1)} PTS</span>
          </div>
        </div>

        {/* Status */}
        <div className="mt-4 text-center text-white/60">
          {gameOver ? (
            <span className="font-semibold tracking-wide">Run complete.</span>
          ) : spinning ? (
            <span className="font-semibold tracking-wide">Spinning club…</span>
          ) : (
            <span className="font-semibold tracking-wide">Pick a player.</span>
          )}
        </div>

        {gameOver && (
          <div className="mt-6 text-center">
            <div className="text-3xl font-extrabold tracking-wide">RUN COMPLETE</div>
            <div className="mt-2 text-white/70 font-bold">
              Final Score: {currentScore.toFixed(1)} PTS
            </div>

            <button
              className="mt-5 rounded-xl border border-white/20 px-5 py-3 text-white/80 hover:text-white hover:border-white/40"
              onClick={resetGame}
            >
              Play Again
            </button>
          </div>
        )}

        {/* Single column */}
        <div className="mt-8">
          <SingleTeamColumn
            clubs={AFL_CLUBS}
            slots={SLOTS}
            selection={team}
            getPlayer={getPlayerById}
            onOpen={onOpen}
            enabled={!gameOver && !spinning}
            badgeClass="bg-blue-600 text-white"
          />
        </div>

        {/* Drafting from */}
        <div className="mt-12 text-center">
          <div className="text-white/60 font-semibold tracking-widest">DRAFTING FROM:</div>

          <div className="mt-5 flex items-center justify-center">
            <div
              className={`inline-flex items-center justify-center rounded-2xl px-10 py-4 font-extrabold text-xl select-none ${
                spinning ? "opacity-90" : ""
              }`}
              style={{ backgroundColor: displayClub.primary, color: displayClub.text }}
              title="Auto-spins after every 2 picks"
            >
              {displayClub.name.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Picker Modal */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setActive(null)} />

          <div className="relative w-full max-w-xl rounded-2xl border border-white/15 bg-zinc-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-extrabold tracking-wide">
                Select {active.slotLabel}
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
                placeholder={`Search ${active.slotLabel}...`}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/40"
                autoFocus
              />
            </div>

            <div className="mt-3 max-h-[360px] overflow-y-auto rounded-xl border border-white/10 bg-black/20">
              {eligiblePlayers.length === 0 ? (
                <div className="p-4 text-white/60">No eligible players found.</div>
              ) : (
                eligiblePlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onPick(p.id)}
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

/** ================= Column UI ================= */
function SingleTeamColumn({
  clubs,
  slots,
  selection,
  getPlayer,
  onOpen,
  enabled,
  badgeClass,
}: {
  clubs: ClubMeta[];
  slots: Slot[];
  selection: Record<string, string | null>;
  getPlayer: (pid: string | null) => Player | null;
  onOpen: (slot: Slot) => void;
  enabled: boolean;
  badgeClass: string;
}) {
  return (
    <div className="space-y-3">
      {slots.map((slot) => {
        const p = getPlayer(selection[slot.id]);
        const clubMeta = clubForPlayer(clubs, p);

        const isFilled = Boolean(p);
        const clickable = enabled && !isFilled;

        return (
          <div key={slot.id} className="flex gap-3 items-center">
            <div className={`w-20 shrink-0 rounded-md font-extrabold text-center py-2 ${badgeClass}`}>
              {slot.label}
            </div>

            <button
              className={`flex-1 border border-white/70 rounded-md px-4 text-left transition flex items-center justify-between h-14 ${
                clickable ? "hover:brightness-110" : "cursor-not-allowed"
              }`}
             style={
  p && clubMeta
    ? {
        // 👇 pattern background
        backgroundImage: `url(${patternUrlForClub(clubMeta.name)})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",

        // keep your text + border
        color: clubMeta.text,
        borderColor: "rgba(255,255,255,0.35)",
      }
    : { backgroundColor: "rgba(0,0,0,0.30)" }
}

              onClick={() => onOpen(slot)}
              disabled={!clickable}
              title={isFilled ? "Locked (cannot be replaced)" : undefined}
            >
              <span className={`truncate block ${p ? "font-extrabold" : "font-extrabold text-white/80"}`}>
                {p ? p.name : `+ Select ${slot.label}`}
              </span>

              {p?.points != null && (
  <span className="shrink-0 font-extrabold px-3 py-1 rounded-md bg-black/50 text-white backdrop-blur-sm border border-white/15">
    {p.points.toFixed(1)} PTS
  </span>
)}

            </button>
          </div>
        );
      })}
    </div>
  );
}
