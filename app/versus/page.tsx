"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import players2025 from "../data/public/afl_players.json";
import players2026 from "../data/public/afl_players26.json";

/** ================= Types ================= */
type Side = "A" | "B";
type PlayerPos = "FWD" | "MID" | "DEF" | "RUCK";
type SlotPos = "FWD" | "MID" | "DEF" | "RUCK" | "FLEX";
type Position = "FWD" | "MID" | "DEF" | "RUCK" | "FLEX";

type Slot = {
  id: string;
  label: Position;
  allowed: PlayerPos[];
};

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
  { name: "Carlton", primary: "#021e2e", text: "#FFFFFF" },
  { name: "Richmond", primary: "#F7B500", text: "#111111" },
  { name: "Essendon", primary: "#C8102E", text: "#FFFFFF" },
  { name: "Geelong", primary: "#0F2A4A", text: "#FFFFFF" },
  { name: "Hawthorn", primary: "#4B2E1E", text: "#FFFFFF" },
  { name: "Melbourne", primary: "#0A2A5E", text: "#FFFFFF" },
  { name: "Sydney", primary: "#E41E2B", text: "#FFFFFF" },
  { name: "Brisbane", primary: "#7C003E", text: "#FFD200" },
  { name: "West Coast", primary: "#002B5C", text: "#FFD200" },
  { name: "Fremantle", primary: "#2B0A3D", text: "#FFFFFF" },
  { name: "Adelaide", primary: "#0f1432", text: "#fed303" },
  { name: "Port Adelaide", primary: "#008bab", text: "#111111" },
  { name: "St Kilda", primary: "#FFFFFF", text: "#C8102E" },
  { name: "Western Bulldogs", primary: "#0047AB", text: "#FFFFFF" },
  { name: "North Melbourne", primary: "#003A70", text: "#FFFFFF" },
  { name: "Gold Coast", primary: "#B30000", text: "#FFD200" },
  { name: "GWS", primary: "#ff7800", text: "#111111" },
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

function teamIconUrl(clubName: string) {
  return `/team-icons/${clubSlug(clubName)}.png`;
}

function VersusDraftPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [season, setSeason] = useState<"2025" | "2026">("2025");
  const [seasonReady, setSeasonReady] = useState(false);

  useEffect(() => {
    const urlSeason = searchParams.get("season");

    if (urlSeason === "2025" || urlSeason === "2026") {
      setSeason(urlSeason);
      try {
        localStorage.setItem("selectedSeason", urlSeason);
      } catch {}
    } else {
      try {
        const savedSeason = localStorage.getItem("selectedSeason");
        if (savedSeason === "2025" || savedSeason === "2026") {
          setSeason(savedSeason);
        }
      } catch {}
    }

    setSeasonReady(true);
  }, [searchParams]);

  const changeSeason = (nextSeason: "2025" | "2026") => {
    setSeason(nextSeason);

    try {
      localStorage.setItem("selectedSeason", nextSeason);
    } catch {}

    router.replace(`/versus?season=${nextSeason}`);
  };

  const goHome = () => {
    router.push(`/?season=${season}`);
  };

  const ALL_PLAYERS: Player[] = useMemo(() => {
    return season === "2026"
      ? (players2026 as Player[])
      : (players2025 as Player[]);
  }, [season]);

  const SPIN_CLUBS = useMemo(
    () => clampClubsToPlayers(AFL_CLUBS, ALL_PLAYERS),
    [ALL_PLAYERS]
  );

  const [club, setClub] = useState<ClubMeta>(AFL_CLUBS[0]);
  const [displayClub, setDisplayClub] = useState<ClubMeta>(AFL_CLUBS[0]);
  const [spinning, setSpinning] = useState(false);

  const [turnIndex, setTurnIndex] = useState(0);

  const turn: Side = (() => {
    if (turnIndex === 0) return "A";
    const block = Math.floor((turnIndex - 1) / 2);
    return block % 2 === 0 ? "B" : "A";
  })();

  const [picksSinceSpin, setPicksSinceSpin] = useState(0);

  const [active, setActive] = useState<{
    side: Side;
    slotId: string;
    allowed: PlayerPos[];
    slotLabel: SlotPos;
  } | null>(null);

  const [search, setSearch] = useState("");

  const [teamA, setTeamA] = useState<Record<string, string | null>>(
    Object.fromEntries(SLOTS.map((s) => [s.id, null]))
  );
  const [teamB, setTeamB] = useState<Record<string, string | null>>(
    Object.fromEntries(SLOTS.map((s) => [s.id, null]))
  );

  const getPlayerById = (pid: string | null) => {
    if (!pid) return null;
    return ALL_PLAYERS.find((p) => p.id === pid) ?? null;
  };

  const pickedIds = useMemo(() => {
    const ids: string[] = [];
    Object.values(teamA).forEach((id) => id && ids.push(id));
    Object.values(teamB).forEach((id) => id && ids.push(id));
    return new Set(ids);
  }, [teamA, teamB]);

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
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .slice();
  }, [active, clubPlayers, pickedIds, search]);

  const teamATotal = useMemo(() => sumPoints(teamA, getPlayerById), [teamA]);
  const teamBTotal = useMemo(() => sumPoints(teamB, getPlayerById), [teamB]);

  const allFilledA = useMemo(() => SLOTS.every((s) => Boolean(teamA[s.id])), [teamA]);
  const allFilledB = useMemo(() => SLOTS.every((s) => Boolean(teamB[s.id])), [teamB]);

  const gameOver = allFilledA && allFilledB;

  const winner = useMemo<"A" | "B" | "DRAW" | null>(() => {
    if (!gameOver) return null;
    if (teamATotal > teamBTotal) return "A";
    if (teamBTotal > teamATotal) return "B";
    return "DRAW";
  }, [gameOver, teamATotal, teamBTotal]);

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
    if (!seasonReady) return;

    const firstClub = SPIN_CLUBS[0] ?? AFL_CLUBS[0];
    setClub(firstClub);
    setDisplayClub(firstClub);
    setTeamA(Object.fromEntries(SLOTS.map((s) => [s.id, null])));
    setTeamB(Object.fromEntries(SLOTS.map((s) => [s.id, null])));
    setTurnIndex(0);
    setPicksSinceSpin(0);
    setActive(null);
    setSearch("");
    cleanupSpinTimers();

    const timeout = window.setTimeout(() => {
      spinToRandomClub();
    }, 50);

    return () => window.clearTimeout(timeout);
  }, [season, SPIN_CLUBS, seasonReady]);

  useEffect(() => {
    if (!gameOver) return;
    cleanupSpinTimers();
    setSpinning(false);
    setActive(null);
    setSearch("");
  }, [gameOver]);

  function slotIsFilled(side: Side, slotId: string) {
    return side === "A" ? Boolean(teamA[slotId]) : Boolean(teamB[slotId]);
  }

  function onOpen(side: Side, slot: Slot) {
    if (gameOver) return;
    if (spinning) return;
    if (side !== turn) return;
    if (slotIsFilled(side, slot.id)) return;

    setSearch("");
    setActive({ side, slotId: slot.id, allowed: slot.allowed, slotLabel: slot.label });
  }

  function onPick(playerId: string) {
    if (gameOver) return;
    if (!active) return;
    if (spinning) return;
    if (active.side !== turn) return;
    if (slotIsFilled(active.side, active.slotId)) return;

    if (active.side === "A") {
      setTeamA((prev) => ({ ...prev, [active.slotId]: playerId }));
    } else {
      setTeamB((prev) => ({ ...prev, [active.slotId]: playerId }));
    }

    setActive(null);
    setSearch("");
    setTurnIndex((prev) => prev + 1);

    setPicksSinceSpin((prev) => {
      const next = prev + 1;

      if (next >= 2) {
        delayedSpinTimeout.current = window.setTimeout(() => {
          if (!gameOver) spinToRandomClub();
        }, 650);
        return 0;
      }

      return next;
    });
  }

  function resetGame() {
    cleanupSpinTimers();

    setTeamA(Object.fromEntries(SLOTS.map((s) => [s.id, null])));
    setTeamB(Object.fromEntries(SLOTS.map((s) => [s.id, null])));
    setTurnIndex(0);
    setPicksSinceSpin(0);
    setActive(null);
    setSearch("");
    setSpinning(false);

    const firstClub = SPIN_CLUBS[0] ?? AFL_CLUBS[0];
    setClub(firstClub);
    setDisplayClub(firstClub);

    window.setTimeout(() => spinToRandomClub(), 50);
  }

  return (
    <main className="min-h-screen text-white relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/versus-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "scroll",
        }}
      />

      <div className="absolute inset-0 bg-black/65" />

      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,#ffffff22,transparent_40%),radial-gradient(circle_at_80%_30%,#ffffff15,transparent_35%),radial-gradient(circle_at_30%_80%,#ffffff10,transparent_40%)]" />

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-wide text-white">
              VERSUS MODE
            </h1>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => changeSeason("2025")}
                className={`rounded-xl border px-4 py-2 font-bold transition ${
                  season === "2025"
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "border-white/20 text-white/80 hover:text-white hover:border-white/40"
                }`}
              >
                2025
              </button>

              <button
                onClick={() => changeSeason("2026")}
                className={`rounded-xl border px-4 py-2 font-bold transition ${
                  season === "2026"
                    ? "bg-red-500 border-red-400 text-white"
                    : "border-white/20 text-white/80 hover:text-white hover:border-white/40"
                }`}
              >
                2026
              </button>
            </div>
          </div>

          <button
            className="rounded-xl border border-white/20 px-4 py-2 text-white/80 hover:text-white hover:border-white/40"
            onClick={goHome}
          >
            ← Home
          </button>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10">
          <div className="text-center text-white/70 font-bold tracking-wide">
            TEAM A: <span className="text-white">{teamATotal.toFixed(1)} PTS</span>
          </div>
          <div className="text-center text-white/70 font-bold tracking-wide">
            TEAM B: <span className="text-white">{teamBTotal.toFixed(1)} PTS</span>
          </div>
        </div>

        <div className="mt-4 text-center text-white/60">
          {gameOver ? (
            <span className="font-semibold tracking-wide">Draft complete.</span>
          ) : spinning ? (
            <span className="font-semibold tracking-wide">Spinning club…</span>
          ) : (
            <span className="font-semibold tracking-wide">
              Turn: <span className="text-white">TEAM {turn}</span>
            </span>
          )}
        </div>

        {gameOver && (
          <div className="mt-6 text-center">
            <div className="text-3xl font-extrabold tracking-wide">
              {winner === "DRAW" ? "IT'S A DRAW!" : `TEAM ${winner} WINS!`}
            </div>
            <div className="mt-2 text-white/70 font-bold">
              Final: A {teamATotal.toFixed(1)} — B {teamBTotal.toFixed(1)}
            </div>

            <button
              className="mt-5 rounded-xl border border-white/20 px-5 py-3 text-white/80 hover:text-white hover:border-white/40"
              onClick={resetGame}
            >
              Play Again
            </button>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          <TeamColumn
            side="A"
            clubs={AFL_CLUBS}
            slots={SLOTS}
            selection={teamA}
            getPlayer={getPlayerById}
            onOpen={onOpen}
            enabled={!gameOver && !spinning && turn === "A"}
            badgeClass={season === "2026" ? "bg-blue-400 text-white" : "bg-blue-600 text-white"}
            gameOver={gameOver}
            winner={winner}
          />

          <TeamColumn
            side="B"
            clubs={AFL_CLUBS}
            slots={SLOTS}
            selection={teamB}
            getPlayer={getPlayerById}
            onOpen={onOpen}
            enabled={!gameOver && !spinning && turn === "B"}
            badgeClass={season === "2026" ? "bg-red-500 text-white" : "bg-red-700 text-white"}
            gameOver={gameOver}
            winner={winner}
          />
        </div>

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

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setActive(null)} />

          <div className="relative w-full max-w-xl rounded-2xl border border-white/15 bg-zinc-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-extrabold tracking-wide">
                Select {active.slotLabel}{" "}
                <span className="text-white/60 font-bold">• TEAM {active.side}</span>
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
                      <div className="text-white/60 text-sm font-bold">
                        {p.pos.join("/")}
                      </div>
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
function TeamColumn({
  side,
  clubs,
  slots,
  selection,
  getPlayer,
  onOpen,
  enabled,
  badgeClass,
  gameOver,
  winner,
}: {
  side: Side;
  clubs: ClubMeta[];
  slots: Slot[];
  selection: Record<string, string | null>;
  getPlayer: (pid: string | null) => Player | null;
  onOpen: (side: Side, slot: Slot) => void;
  enabled: boolean;
  badgeClass: string;
  gameOver: boolean;
  winner: "A" | "B" | "DRAW" | null;
}) {
  const isLoser = gameOver && winner && winner !== "DRAW" && winner !== side;

  return (
    <div className={`space-y-3 ${isLoser ? "opacity-40" : ""}`}>
      {gameOver && winner === side && (
        <div className="text-center text-green-400 font-extrabold tracking-widest mb-3 text-3xl">
          🏆 WINNER
        </div>
      )}

      {slots.map((slot) => {
        const p = getPlayer(selection[slot.id]);
        const clubMeta = clubForPlayer(clubs, p);

        const isFilled = Boolean(p);
        const clickable = enabled && !isFilled;

        return (
          <div key={slot.id} className="flex gap-3 items-center min-w-0">
            <div
              className={`w-20 shrink-0 rounded-md font-extrabold text-center py-2 ${badgeClass}`}
            >
              {slot.label}
            </div>

            <button
              className={`flex-1 min-w-0 border rounded-md px-3 sm:px-4 text-left transition h-[56px] ${
                clickable ? "hover:brightness-110" : "cursor-not-allowed"
              }`}
              style={
                p && clubMeta
                  ? {
                      backgroundColor: clubMeta.primary,
                      color: clubMeta.text,
                      borderColor: "rgba(255,255,255,0.35)",
                    }
                  : {
    backgroundColor: "#0a0a0a",
    borderColor: "rgba(255,255,255,0.15)",
  }
              }
              onClick={() => onOpen(side, slot)}
              disabled={!clickable}
              title={isFilled ? "Locked (cannot be replaced)" : undefined}
            >
              <div className="flex items-center w-full h-full min-w-0 gap-3">
                <div className="min-w-0 flex-[1.2]">
                  <span
                    className={`block truncate ${
                      p ? "font-extrabold" : "font-extrabold text-white/80"
                    }`}
                  >
                    {p ? p.name : `+ Select ${slot.label}`}
                  </span>
                </div>

                <div className="flex justify-center flex-[0.9] min-w-0">
                  {p && clubMeta && (
                    <div className="h-[46px] w-[132px] max-w-full overflow-hidden rounded-sm shrink-0">
                      <Image
                        src={teamIconUrl(clubMeta.name)}
                        alt={clubMeta.name}
                        width={132}
                        height={46}
                        className="h-full w-full object-fill"
                        unoptimized
                      />
                    </div>
                  )}
                </div>

                <div className="w-[96px] shrink-0 flex justify-end">
                  {p?.points != null && (
                    <span className="shrink-0 font-extrabold px-3 py-1 rounded-md bg-black/55 text-white whitespace-nowrap">
                      {p.points.toFixed(1)} PTS
                    </span>
                  )}
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function VersusDraftPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white p-6">Loading...</div>}>
      <VersusDraftPageInner />
    </Suspense>
  );
}