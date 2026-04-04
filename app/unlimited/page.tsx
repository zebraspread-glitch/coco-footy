"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import players2025 from "../data/public/afl_players.json";
import goals2025 from "../data/public/afl_goals.json";
import disposals2025 from "../data/public/afl_disposals.json";
import bounces2025 from "../data/public/afl_bounces.json";
import players2026 from "../data/public/afl_players26.json";

/** ================= Types ================= */
type PlayerPos = "FWD" | "MID" | "DEF" | "RUCK";
type SlotPos = "FWD" | "MID" | "DEF" | "RUCK" | "FLEX";
type Position = "FWD" | "MID" | "DEF" | "RUCK" | "FLEX";
type GameMode = "fantasy" | "goals" | "disposals" | "bounces";

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
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function patternUrlForClub(clubName: string) {
  return `/patterns/${clubSlug(clubName)}.svg`;
}

function modeLabel(mode: GameMode) {
  switch (mode) {
    case "goals":
      return "GOALS";
    case "disposals":
      return "DISPOSALS";
    case "bounces":
      return "BOUNCES";
    default:
      return "PTS";
  }
}

function formatStatValue(value: number, statLabel: string) {
  if (statLabel === "GOALS" || statLabel === "BOUNCES") {
    return String(Math.round(value));
  }
  return value.toFixed(1);
}

function UnlimitedDraftPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [season, setSeason] = useState<"2025" | "2026">("2025");
  const [seasonReady, setSeasonReady] = useState(false);
  const [mode, setMode] = useState<GameMode>("fantasy");

  useEffect(() => {
    const urlSeason = searchParams.get("season");
    const urlMode = searchParams.get("mode");

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

    if (
      urlMode === "fantasy" ||
      urlMode === "goals" ||
      urlMode === "disposals" ||
      urlMode === "bounces"
    ) {
      setMode(urlMode);
      try {
        localStorage.setItem("selectedUnlimitedMode", urlMode);
      } catch {}
    } else {
      try {
        const savedMode = localStorage.getItem("selectedUnlimitedMode");
        if (
          savedMode === "fantasy" ||
          savedMode === "goals" ||
          savedMode === "disposals" ||
          savedMode === "bounces"
        ) {
          setMode(savedMode);
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

    const params = new URLSearchParams();
    params.set("season", nextSeason);
    if (nextSeason === "2025") {
      params.set("mode", mode);
    }

    router.replace(`/unlimited?${params.toString()}`);
  };

  const changeMode = (nextMode: GameMode) => {
    if (season !== "2025") return;

    setMode(nextMode);

    try {
      localStorage.setItem("selectedUnlimitedMode", nextMode);
    } catch {}

    router.replace(`/unlimited?season=2025&mode=${nextMode}`);
  };

  const goHome = () => {
    if (season === "2025") {
      router.push(`/?season=${season}&mode=${mode}`);
    } else {
      router.push(`/?season=${season}`);
    }
  };

  const ALL_PLAYERS: Player[] = useMemo(() => {
    if (season === "2026") {
      return players2026 as Player[];
    }

    if (mode === "goals") return goals2025 as Player[];
    if (mode === "disposals") return disposals2025 as Player[];
    if (mode === "bounces") return bounces2025 as Player[];

    return players2025 as Player[];
  }, [season, mode]);

  const SPIN_CLUBS = useMemo(
    () => clampClubsToPlayers(AFL_CLUBS, ALL_PLAYERS),
    [ALL_PLAYERS]
  );

  const [club, setClub] = useState<ClubMeta>(AFL_CLUBS[0]);
  const [displayClub, setDisplayClub] = useState<ClubMeta>(AFL_CLUBS[0]);
  const [spinning, setSpinning] = useState(false);

  const [active, setActive] = useState<{
    slotId: string;
    allowed: PlayerPos[];
    slotLabel: SlotPos;
  } | null>(null);

  const [search, setSearch] = useState("");

  const [team, setTeam] = useState<Record<string, string | null>>(
    Object.fromEntries(SLOTS.map((s) => [s.id, null]))
  );

  useEffect(() => {
    if (!seasonReady) return;

    const firstClub = SPIN_CLUBS[0] ?? AFL_CLUBS[0];
    setClub(firstClub);
    setDisplayClub(firstClub);
    setTeam(Object.fromEntries(SLOTS.map((s) => [s.id, null])));
    setActive(null);
    setSearch("");
    setSpinning(false);
  }, [season, mode, SPIN_CLUBS, seasonReady]);

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
  () =>
    ALL_PLAYERS
      .filter((p) => p.club === club.name)
      .filter((p) => p.points > 0),
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
      let key = "unlimited_highscore_2025";

      if (season === "2026") {
        key = "unlimited_highscore_2026";
      } else if (mode === "goals") {
        key = "unlimited_highscore_2025_goals";
      } else if (mode === "disposals") {
        key = "unlimited_highscore_2025_disposals";
      } else if (mode === "bounces") {
        key = "unlimited_highscore_2025_bounces";
      } else {
        key = "unlimited_highscore_2025_fantasy";
      }

      const saved = Number(localStorage.getItem(key) ?? 0);
      setHighScore(Number.isFinite(saved) ? saved : 0);
    } catch {
      setHighScore(0);
    }
  }, [season, mode]);

  useEffect(() => {
    if (currentScore > highScore) {
      setHighScore(currentScore);
      try {
        let key = "unlimited_highscore_2025";

        if (season === "2026") {
          key = "unlimited_highscore_2026";
        } else if (mode === "goals") {
          key = "unlimited_highscore_2025_goals";
        } else if (mode === "disposals") {
          key = "unlimited_highscore_2025_disposals";
        } else if (mode === "bounces") {
          key = "unlimited_highscore_2025_bounces";
        } else {
          key = "unlimited_highscore_2025_fantasy";
        }

        localStorage.setItem(key, String(currentScore));
      } catch {}
    }
  }, [currentScore, highScore, season, mode]);

  /** ===== Spinner effect ===== */
  const spinTimer = useRef<number | null>(null);
  const spinTimeout = useRef<number | null>(null);
  const delayedSpinTimeout = useRef<number | null>(null);
  const hasInitialSpun = useRef(false);

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
    if (SPIN_CLUBS.length === 0) return;
    if (hasInitialSpun.current) return;

    hasInitialSpun.current = true;
    spinToRandomClub();

    return () => cleanupSpinTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SPIN_CLUBS, seasonReady]);

  useEffect(() => {
    if (!seasonReady) return;

    hasInitialSpun.current = false;
    cleanupSpinTimers();

    const timeout = window.setTimeout(() => {
      hasInitialSpun.current = true;
      spinToRandomClub();
    }, 50);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season, mode, seasonReady]);

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
    if (slotIsFilled(slot.id)) return;

    setSearch("");
    setActive({ slotId: slot.id, allowed: slot.allowed, slotLabel: slot.label });
  }

  function onPick(playerId: string) {
    if (gameOver) return;
    if (!active) return;
    if (spinning) return;
    if (slotIsFilled(active.slotId)) return;

    setTeam((prev) => ({ ...prev, [active.slotId]: playerId }));
    setActive(null);
    setSearch("");

    delayedSpinTimeout.current = window.setTimeout(() => {
      if (!gameOver) spinToRandomClub();
    }, 650);
  }

  function resetGame() {
    cleanupSpinTimers();
    setSpinning(false);
    setActive(null);
    setSearch("");
    setTeam(Object.fromEntries(SLOTS.map((s) => [s.id, null])));

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
          backgroundImage: "url('/vbg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      />

      <div className="absolute inset-0 bg-black/35" />

      <div className="relative mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-wide text-white">
              UNLIMITED MODE
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

            {season === "2025" && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => changeMode("fantasy")}
                  className={`rounded-xl border px-4 py-2 font-bold transition ${
                    mode === "fantasy"
                      ? "bg-white text-black border-white"
                      : "border-white/20 text-white/80 hover:text-white hover:border-white/40"
                  }`}
                >
                  Fantasy Points
                </button>

                <button
                  onClick={() => changeMode("goals")}
                  className={`rounded-xl border px-4 py-2 font-bold transition ${
                    mode === "goals"
                      ? "bg-white text-black border-white"
                      : "border-white/20 text-white/80 hover:text-white hover:border-white/40"
                  }`}
                >
                  Goals
                </button>

                <button
                  onClick={() => changeMode("disposals")}
                  className={`rounded-xl border px-4 py-2 font-bold transition ${
                    mode === "disposals"
                      ? "bg-white text-black border-white"
                      : "border-white/20 text-white/80 hover:text-white hover:border-white/40"
                  }`}
                >
                  Disposals
                </button>

                <button
                  onClick={() => changeMode("bounces")}
                  className={`rounded-xl border px-4 py-2 font-bold transition ${
                    mode === "bounces"
                      ? "bg-white text-black border-white"
                      : "border-white/20 text-white/80 hover:text-white hover:border-white/40"
                  }`}
                >
                  Bounces
                </button>
              </div>
            )}
          </div>

          <button
            className="rounded-xl border border-white/20 px-4 py-2 text-white/80 hover:text-white hover:border-white/40"
            onClick={goHome}
          >
            ← Home
          </button>
        </div>

        <div className="mt-10 text-center">
          <div className="text-white/70 font-bold tracking-wide">
            HIGH SCORE:{" "}
            <span className="text-white">
              {formatStatValue(highScore, modeLabel(season === "2026" ? "fantasy" : mode))}{" "}
{modeLabel(season === "2026" ? "fantasy" : mode)}
            </span>
          </div>
          <div className="mt-2 text-white/70 font-bold tracking-wide">
  CURRENT SCORE:{" "}
  <span className="text-white">
    {formatStatValue(currentScore, modeLabel(season === "2026" ? "fantasy" : mode))}{" "}
    {modeLabel(season === "2026" ? "fantasy" : mode)}
  </span>
</div>
        </div>

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
  Final Score: {formatStatValue(currentScore, modeLabel(season === "2026" ? "fantasy" : mode))}{" "}
  {modeLabel(season === "2026" ? "fantasy" : mode)}
</div>

            <button
              className="mt-5 rounded-xl border border-white/20 px-5 py-3 text-white/80 hover:text-white hover:border-white/40"
              onClick={resetGame}
            >
              Play Again
            </button>
          </div>
        )}

        <div className="mt-8">
          <SingleTeamColumn
            clubs={AFL_CLUBS}
            slots={SLOTS}
            selection={team}
            getPlayer={getPlayerById}
            onOpen={onOpen}
            enabled={!gameOver && !spinning}
            badgeClass={season === "2026" ? "bg-red-500 text-white" : "bg-blue-600 text-white"}
            statLabel={modeLabel(season === "2026" ? "fantasy" : mode)}
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
              <div className="font-extrabold tracking-wide">Select {active.slotLabel}</div>

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
  statLabel,
}: {
  clubs: ClubMeta[];
  slots: Slot[];
  selection: Record<string, string | null>;
  getPlayer: (pid: string | null) => Player | null;
  onOpen: (slot: Slot) => void;
  enabled: boolean;
  badgeClass: string;
  statLabel: string;
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
                      backgroundImage: `url(${patternUrlForClub(clubMeta.name)})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      color: clubMeta.text,
                      borderColor: "rgba(255,255,255,0.35)",
                    }
                  : { backgroundColor: "rgba(0,0,0,0.30)" }
              }
              onClick={() => onOpen(slot)}
              disabled={!clickable}
              title={isFilled ? "Locked (cannot be replaced)" : undefined}
            >
              <span
                className={`truncate block ${
                  p ? "font-extrabold" : "font-extrabold text-white/80"
                }`}
              >
                {p ? p.name : `+ Select ${slot.label}`}
              </span>

              {p?.points != null && (
                <span className="shrink-0 font-extrabold px-3 py-1 rounded-md bg-black/50 text-white backdrop-blur-sm border border-white/15">
                  {formatStatValue(p.points, statLabel)} {statLabel}
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function UnlimitedDraftPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white p-6">Loading...</div>}>
      <UnlimitedDraftPageInner />
    </Suspense>
  );
}