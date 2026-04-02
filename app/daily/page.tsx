"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import players2025 from "../data/public/afl_players.json";
import players2026 from "../data/public/afl_players26.json";

/** ================= Types ================= */
type PlayerPos = "FWD" | "MID" | "DEF" | "RUCK";
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

/** Seeded RNG so daily clubs are stable per date */
function hashStringToSeed(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formatDateKeyLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function getTodayKeyLocal() {
  return formatDateKeyLocal(new Date());
}

function shiftDateKey(dateKey: string, deltaDays: number) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() + deltaDays);
  return formatDateKeyLocal(dt);
}

function pickDailyClubsForDate(clubs: ClubMeta[], count: number, dateKey: string) {
  const rng = mulberry32(hashStringToSeed(dateKey));
  const pool = clubs.slice();

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, Math.min(count, pool.length));
}

/** Perfect team solver */
function buildPerfectTeam(
  slots: Slot[],
  players: Player[],
  topKPerSlot = 35
): Record<string, string | null> {
  const empty: Record<string, string | null> = Object.fromEntries(
    slots.map((s) => [s.id, null])
  );

  const cand: Record<string, Player[]> = {};
  for (const slot of slots) {
    cand[slot.id] = players
      .filter((p) => p.pos.some((pos) => slot.allowed.includes(pos)))
      .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
      .slice(0, topKPerSlot);
  }

  const ordered = slots
    .slice()
    .sort((a, b) => (cand[a.id]?.length ?? 0) - (cand[b.id]?.length ?? 0));

  let bestSum = -Infinity;
  let bestTeam: Record<string, string | null> = { ...empty };
  const used = new Set<string>();

  const upperBound = (idx: number) => {
    let bound = 0;
    for (let k = idx; k < ordered.length; k++) {
      const top = cand[ordered[k].id]?.[0];
      bound += top ? top.points : 0;
    }
    return bound;
  };

  function dfs(idx: number, curSum: number, team: Record<string, string | null>) {
    if (idx >= ordered.length) {
      if (curSum > bestSum) {
        bestSum = curSum;
        bestTeam = { ...team };
      }
      return;
    }

    if (curSum + upperBound(idx) <= bestSum) return;

    const slot = ordered[idx];
    const options = cand[slot.id] || [];
    if (options.length === 0) return;

    for (const p of options) {
      if (used.has(p.id)) continue;

      used.add(p.id);
      team[slot.id] = p.id;
      dfs(idx + 1, curSum + (p.points ?? 0), team);
      team[slot.id] = null;
      used.delete(p.id);
    }
  }

  dfs(0, 0, { ...empty });
  return bestSum === -Infinity ? empty : bestTeam;
}

/** ================= Page ================= */
export default function DailyPage() {
  const router = useRouter();

  const [season, setSeason] = useState<"2025" | "2026">("2025");

  const ALL_PLAYERS: Player[] = useMemo(() => {
    return season === "2026"
      ? (players2026 as Player[])
      : (players2025 as Player[]);
  }, [season]);

  const AVAILABLE_CLUBS = useMemo(
    () => clampClubsToPlayers(AFL_CLUBS, ALL_PLAYERS),
    [ALL_PLAYERS]
  );

  const emptyTeam: Record<string, string | null> = useMemo(
    () => Object.fromEntries(SLOTS.map((s) => [s.id, null])),
    []
  );

  const MIN_DATE = season === "2026" ? "2026-01-01" : "2026-02-18";

  /** ================= LocalStorage keys ================= */
  const LS_DAILY_LOCK_PREFIX = `coco_daily_lock_${season}:`;
  const LS_PERSONAL_BEST = `coco_daily_personal_best_${season}`;
  const LS_GAMES_PLAYED = `coco_daily_games_played_${season}`;

  const todayKey = useMemo(() => getTodayKeyLocal(), []);
  const initialSelectedDate =
    todayKey < MIN_DATE ? MIN_DATE : todayKey;

  const [selectedDate, setSelectedDate] = useState<string>(initialSelectedDate);

  useEffect(() => {
    setSelectedDate((prev) => {
      if (prev < MIN_DATE) return MIN_DATE;
      if (prev > todayKey) return todayKey;
      return prev;
    });
  }, [MIN_DATE, todayKey]);

  const isLiveToday = selectedDate === todayKey;

  const dailyClubs = useMemo(
    () => pickDailyClubsForDate(AVAILABLE_CLUBS, 4, selectedDate),
    [AVAILABLE_CLUBS, selectedDate]
  );

  const dailyPlayers = useMemo(() => {
    const set = new Set(dailyClubs.map((c) => c.name));
    return ALL_PLAYERS.filter((p) => set.has(p.club));
  }, [ALL_PLAYERS, dailyClubs]);

  const lockKey = useMemo(
    () => `${LS_DAILY_LOCK_PREFIX}${selectedDate}`,
    [LS_DAILY_LOCK_PREFIX, selectedDate]
  );

  const [isLockedToday, setIsLockedToday] = useState(false);
  const [team, setTeam] = useState<Record<string, string | null>>(emptyTeam);

  const [perfectTeam, setPerfectTeam] = useState<Record<string, string | null> | null>(null);
  const [showPerfect, setShowPerfect] = useState(false);

  const [personalBest, setPersonalBest] = useState<{ score: number; date: string } | null>(null);
  const [gamesPlayed, setGamesPlayed] = useState<number>(0);

  const [active, setActive] = useState<{
    slotId: string;
    allowed: PlayerPos[];
    slotLabel: Position;
  } | null>(null);
  const [search, setSearch] = useState("");

  function loadJSON<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  function saveJSON(key: string, value: any) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  useEffect(() => {
    const locked = loadJSON<{ locked: boolean; team?: Record<string, string | null> }>(lockKey, {
      locked: false,
    });

    setIsLockedToday(Boolean(locked.locked));
    if (locked.team) setTeam(locked.team);
    else setTeam(emptyTeam);

    const pb = loadJSON<{ score: number; date: string } | null>(LS_PERSONAL_BEST, null);
    setPersonalBest(pb);

    const gp = loadJSON<number>(LS_GAMES_PLAYED, 0);
    setGamesPlayed(gp);

    setShowPerfect(false);
    setPerfectTeam(null);
    setActive(null);
    setSearch("");
  }, [lockKey, emptyTeam, LS_PERSONAL_BEST, LS_GAMES_PLAYED]);

  const getPlayerById = (pid: string | null) => {
    if (!pid) return null;
    return ALL_PLAYERS.find((p) => p.id === pid) ?? null;
  };

  const gameOver = useMemo(() => SLOTS.every((s) => Boolean(team[s.id])), [team]);

  const activeTeam = showPerfect && perfectTeam ? perfectTeam : team;

  const yourTotal = useMemo(() => sumPoints(team, getPlayerById), [team]);
  const totalShown = useMemo(() => sumPoints(activeTeam, getPlayerById), [activeTeam]);

  const pickedIds = useMemo(
    () => new Set(Object.values(team).filter(Boolean) as string[]),
    [team]
  );

  const isInYourTeam = (playerId: string | null) => {
    if (!playerId) return false;
    return pickedIds.has(playerId);
  };

  const eligiblePlayers = useMemo(() => {
    if (!active) return [];
    const q = search.trim().toLowerCase();

    return dailyPlayers
      .filter((p) => !pickedIds.has(p.id))
      .filter((p) => p.pos.some((pos) => active.allowed.includes(pos)))
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [active, dailyPlayers, pickedIds, search]);

  function onOpen(slot: Slot) {
    if (isLockedToday) return;
    if (showPerfect) return;
    if (team[slot.id]) return;

    setSearch("");
    setActive({ slotId: slot.id, allowed: slot.allowed, slotLabel: slot.label });
  }

  function onPick(playerId: string) {
    if (isLockedToday) return;
    if (showPerfect) return;
    if (!active) return;
    if (team[active.slotId]) return;

    setTeam((prev) => ({ ...prev, [active.slotId]: playerId }));
    setActive(null);
    setSearch("");
  }

  useEffect(() => {
    if (!gameOver) return;
    if (isLockedToday) return;

    saveJSON(lockKey, { locked: true, team });
    setIsLockedToday(true);

    if (isLiveToday) {
      setGamesPlayed((prev) => {
        const next = prev + 1;
        saveJSON(LS_GAMES_PLAYED, next);
        return next;
      });

      const score = sumPoints(team, getPlayerById);
      setPersonalBest((prev) => {
        const next = !prev || score > prev.score ? { score, date: todayKey } : prev;
        saveJSON(LS_PERSONAL_BEST, next);
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver]);

  function onTogglePerfect() {
    if (!gameOver) return;

    if (!perfectTeam) {
      const best = buildPerfectTeam(SLOTS, dailyPlayers, 35);
      setPerfectTeam(best);
    }

    setShowPerfect((prev) => !prev);
    setActive(null);
    setSearch("");
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
          backgroundAttachment: "fixed",
        }}
      />

      <div className="absolute inset-0 bg-black/35" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-wide text-white">
              DAILY GAME
            </h1>
            <div className="mt-2 text-white/60 font-semibold">
              Build one lineup per day from today’s 4 random clubs.
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setSeason("2025")}
                className={`rounded-xl border px-4 py-2 font-bold transition ${
                  season === "2025"
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "border-white/20 text-white/80 hover:text-white hover:border-white/40"
                }`}
              >
                2025
              </button>

              <button
                onClick={() => setSeason("2026")}
                className={`rounded-xl border px-4 py-2 font-bold transition ${
                  season === "2026"
                    ? "bg-red-500 border-red-400 text-white"
                    : "border-white/20 text-white/80 hover:text-white hover:border-white/40"
                }`}
              >
                2026
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="text-white/60 text-sm font-semibold">Play date:</div>

              <button
                className="rounded-xl border border-white/20 px-3 py-2 text-white/80 hover:text-white hover:border-white/40 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() =>
                  setSelectedDate((d) => {
                    const prev = shiftDateKey(d, -1);
                    return prev < MIN_DATE ? MIN_DATE : prev;
                  })
                }
                disabled={selectedDate <= MIN_DATE}
                title="Previous day"
              >
                ←
              </button>

              <input
                type="date"
                value={selectedDate}
                min={MIN_DATE}
                max={todayKey}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val < MIN_DATE) setSelectedDate(MIN_DATE);
                  else if (val > todayKey) setSelectedDate(todayKey);
                  else setSelectedDate(val);
                }}
                className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:border-white/40"
              />

              <button
                className="rounded-xl border border-white/20 px-3 py-2 text-white/80 hover:text-white hover:border-white/40 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setSelectedDate((d) => shiftDateKey(d, +1))}
                disabled={selectedDate >= todayKey}
                title="Next day"
              >
                →
              </button>

              <button
                className="rounded-xl border border-white/20 px-3 py-2 text-white/80 hover:text-white hover:border-white/40"
                onClick={() => setSelectedDate(todayKey < MIN_DATE ? MIN_DATE : todayKey)}
                title="Jump to today"
              >
                Today
              </button>

              {!isLiveToday && (
                <div className="text-yellow-300/90 text-xs font-extrabold tracking-wide">
                  ARCHIVE DAY — stats won’t count
                </div>
              )}
            </div>
          </div>

          <button
            className="rounded-xl border border-white/20 px-4 py-2 text-white/80 hover:text-white hover:border-white/40"
            onClick={() => router.push("/")}
          >
            ← Home
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/15 bg-black/30 p-5">
            <div className="text-white/60 font-semibold tracking-widest text-xs">
              {isLiveToday ? "TODAY" : "SELECTED DAY"}
            </div>
            <div className="mt-2 font-extrabold text-lg">{selectedDate}</div>
            <div className="mt-1 text-white/60 text-sm">
              {isLiveToday
                ? isLockedToday
                  ? "Locked (already played today)"
                  : "Not played yet"
                : isLockedToday
                ? "Locked (played on that date)"
                : "Unplayed archive day"}
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-black/30 p-5">
            <div className="text-white/60 font-semibold tracking-widest text-xs">
              PERSONAL HIGH SCORE
            </div>
            {personalBest ? (
              <div className="mt-2">
                <div className="font-extrabold text-lg">
                  {personalBest.score.toFixed(1)} PTS
                </div>
                <div className="text-white/60 text-sm">Set on {personalBest.date}</div>
              </div>
            ) : (
              <div className="mt-2 text-white/60 text-sm">No score yet.</div>
            )}
            {!isLiveToday && (
              <div className="mt-2 text-white/40 text-xs">
                High score updates only when played live today.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/15 bg-black/30 p-5">
            <div className="text-white/60 font-semibold tracking-widest text-xs">
              TOTAL GAMES PLAYED
            </div>
            <div className="mt-2 font-extrabold text-lg">{gamesPlayed}</div>
            <div className="text-white/60 text-sm">Total across all time</div>
            {!isLiveToday && (
              <div className="mt-2 text-white/40 text-xs">
                Only live plays count toward this total.
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <div className="text-white/60 font-semibold tracking-widest text-sm">
            {isLiveToday ? "TODAY’S CLUBS" : "CLUBS FOR THIS DAY"}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {dailyClubs.map((c) => (
              <div
                key={c.name}
                className="rounded-2xl px-5 py-3 font-extrabold tracking-wide select-none"
                style={{ backgroundColor: c.primary, color: c.text }}
              >
                {c.name.toUpperCase()}
              </div>
            ))}
          </div>
          <div className="mt-2 text-white/40 text-xs">
            Same clubs for this date — changes when you change the date.
          </div>
        </div>

        <div className="mt-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-white/70 font-bold tracking-wide">
            {showPerfect ? "PERFECT TOTAL" : "YOUR TOTAL"}:{" "}
            <span className="text-white">{totalShown.toFixed(1)} PTS</span>
            {gameOver && <span className="ml-3 text-green-400 font-extrabold">• COMPLETE</span>}
            {showPerfect && (
              <span className="ml-2 text-blue-300 font-extrabold">• VIEWING PERFECT</span>
            )}
          </div>

          <button
            className={`rounded-xl border px-4 py-2 transition ${
              gameOver || showPerfect
                ? "border-white/20 text-white/80 hover:text-white hover:border-white/40"
                : "border-white/10 text-white/30 cursor-not-allowed"
            }`}
            onClick={onTogglePerfect}
            disabled={!gameOver && !showPerfect}
            title={
              showPerfect
                ? "Switch back to your team"
                : gameOver
                ? "Switch to perfect team"
                : "Finish your team first"
            }
          >
            {showPerfect ? "Show My Team" : "Show Perfect Team"}
          </button>
        </div>

        {gameOver && (
          <div className="mt-6 rounded-2xl border border-white/15 bg-black/30 p-6">
            <div className="text-2xl font-extrabold tracking-wide">
              {isLiveToday ? "Locked in for today." : "Locked in for this day."}
            </div>
            <div className="mt-1 text-white/60 font-semibold">
              Your score: {yourTotal.toFixed(1)} points
            </div>
            {perfectTeam && (
              <div className="mt-1 text-white/60 font-semibold">
                Perfect score: {sumPoints(perfectTeam, getPlayerById).toFixed(1)} points
              </div>
            )}
            <div className="mt-2 text-white/40 text-xs">
              {isLiveToday
                ? "Come back tomorrow for new clubs."
                : "Archive play — stats don’t count."}
            </div>
          </div>
        )}

        <div className="mt-8 space-y-3">
          {SLOTS.map((slot) => {
            const p = getPlayerById(activeTeam[slot.id]);
            const clubMeta = clubForPlayer(AFL_CLUBS, p);
            const isFilled = Boolean(p);
            const clickable = !isLockedToday && !showPerfect && !isFilled;

            return (
              <div key={slot.id} className="flex gap-3 items-center">
                <div
                  className={`w-16 sm:w-20 shrink-0 rounded-md font-extrabold text-center py-2 ${
                    season === "2026" ? "bg-red-500 text-white" : "bg-blue-600 text-white"
                  }`}
                >
                  {slot.label}
                </div>

                <button
                  className={`flex-1 border border-white/70 rounded-md px-4 text-left transition flex items-center justify-between py-3 sm:h-14 ${
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
                  title={
                    showPerfect
                      ? "Viewing perfect team (switch back to edit)"
                      : isLockedToday
                      ? "Locked for this date"
                      : isFilled
                      ? "Locked (cannot be replaced)"
                      : undefined
                  }
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <span
                      className={`truncate block ${
                        p ? "font-extrabold" : "font-extrabold text-white/80"
                      }`}
                    >
                      {p ? p.name : `+ Select ${slot.label}`}
                    </span>

                    {showPerfect && p && isInYourTeam(p.id) && (
                      <span className="shrink-0 text-green-400 font-extrabold">✓</span>
                    )}
                  </div>

                  {p?.points != null && (
                    <span className="hidden sm:inline-flex shrink-0 font-extrabold px-3 py-1 rounded-md bg-black/55 text-white">
                      {p.points.toFixed(1)} PTS
                    </span>
                  )}
                </button>
              </div>
            );
          })}
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