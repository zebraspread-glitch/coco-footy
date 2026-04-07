"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import players2026 from "../data/public/afl_players26.json";

type PlayerPos = "FWD" | "MID" | "DEF" | "RUCK";
type Position = "FWD" | "MID" | "DEF" | "RUCK" | "FLEX";

type Slot = {
  id: string;
  label: Position;
  allowed: PlayerPos[];
};

type RawPlayer = {
  id: string;
  name: string;
  club: string;
  pos: PlayerPos[];

  points?: number;
  sc_points?: number;
  scPoints?: number;
  supercoach?: number;
  superCoach?: number;
  supercoach_points?: number;
  superCoachPoints?: number;
  disposals?: number;
  disposal?: number;
  goals?: number;
};

type Player = {
  id: string;
  name: string;
  club: string;
  pos: PlayerPos[];
  value: number;
};

type ClubMeta = {
  name: string;
  primary: string;
  text: string;
};

type DailyStatKey = "fantasy" | "sc" | "disposals" | "goals";

type PersonalBestEntry = {
  score: number;
  date: string;
};

type PersonalBestMap = Record<DailyStatKey, PersonalBestEntry | null>;

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
  { name: "Adelaide", primary: "#0F1432", text: "#FFFFFF" },
  { name: "Port Adelaide", primary: "#00A1DE", text: "#111111" },
  { name: "St Kilda", primary: "#C8102E", text: "#FFFFFF" },
  { name: "Western Bulldogs", primary: "#0047AB", text: "#FFFFFF" },
  { name: "North Melbourne", primary: "#003A70", text: "#FFFFFF" },
  { name: "Gold Coast", primary: "#B30000", text: "#FFD200" },
  { name: "GWS", primary: "#F15A22", text: "#111111" },
];

const DAILY_STATS: { key: DailyStatKey; label: string; short: string }[] = [
  { key: "fantasy", label: "Fantasy Points", short: "PTS" },
  { key: "sc", label: "SC Points", short: "SC" },
  { key: "disposals", label: "Disposals", short: "DISP" },
  { key: "goals", label: "Goals", short: "GOALS" },
];

function clampClubsToPlayers(clubs: ClubMeta[], players: RawPlayer[]) {
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

function sumPoints(
  team: Record<string, string | null>,
  getById: (id: string | null) => Player | null
) {
  let total = 0;
  for (const slotId of Object.keys(team)) {
    const p = getById(team[slotId]);
    if (p) total += p.value;
  }
  return total;
}

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
  const rng = mulberry32(hashStringToSeed(`clubs:${dateKey}`));
  const pool = clubs.slice();

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, Math.min(count, pool.length));
}

function pickDailyStatForDate(dateKey: string) {
  const rng = mulberry32(hashStringToSeed(`stat:${dateKey}`));
  const index = Math.floor(rng() * DAILY_STATS.length);
  return DAILY_STATS[index] ?? DAILY_STATS[0];
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function resolvePlayerValue(player: RawPlayer, statKey: DailyStatKey) {
  switch (statKey) {
    case "fantasy":
      return toNumber(player.points);

    case "sc":
      return Math.max(
        toNumber(player.sc_points),
        toNumber(player.scPoints),
        toNumber(player.supercoach),
        toNumber(player.superCoach),
        toNumber(player.supercoach_points),
        toNumber(player.superCoachPoints)
      );

    case "disposals":
      return Math.max(toNumber(player.disposals), toNumber(player.disposal));

    case "goals":
      return toNumber(player.goals);

    default:
      return 0;
  }
}

function mapPlayersForStat(players: RawPlayer[], statKey: DailyStatKey): Player[] {
  return players.map((p) => ({
    id: p.id,
    name: p.name,
    club: p.club,
    pos: p.pos,
    value: resolvePlayerValue(p, statKey),
  }));
}

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
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
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
      bound += top ? top.value : 0;
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
      dfs(idx + 1, curSum + (p.value ?? 0), team);
      team[slot.id] = null;
      used.delete(p.id);
    }
  }

  dfs(0, 0, { ...empty });
  return bestSum === -Infinity ? empty : bestTeam;
}

function makeEmptyPersonalBestMap(): PersonalBestMap {
  return {
    fantasy: null,
    sc: null,
    disposals: null,
    goals: null,
  };
}

function mergePersonalBestMap(value: unknown): PersonalBestMap {
  const empty = makeEmptyPersonalBestMap();

  if (!value || typeof value !== "object") return empty;

  const source = value as Partial<Record<DailyStatKey, PersonalBestEntry | null>>;

  return {
    fantasy: source.fantasy ?? null,
    sc: source.sc ?? null,
    disposals: source.disposals ?? null,
    goals: source.goals ?? null,
  };
}

export default function DailyPage() {
  const router = useRouter();

  const RAW_PLAYERS: RawPlayer[] = useMemo(() => players2026 as RawPlayer[], []);
  const AVAILABLE_CLUBS = useMemo(
    () => clampClubsToPlayers(AFL_CLUBS, RAW_PLAYERS),
    [RAW_PLAYERS]
  );

  const emptyTeam: Record<string, string | null> = useMemo(
    () => Object.fromEntries(SLOTS.map((s) => [s.id, null])),
    []
  );

  const todayKey = useMemo(() => getTodayKeyLocal(), []);
  const MIN_DATE = "2026-01-01";

  const LS_DAILY_LOCK_PREFIX = "coco_daily_lock_2026:";
  const LS_PERSONAL_BESTS = "coco_daily_personal_bests_2026";
  const LS_GAMES_PLAYED = "coco_daily_games_played_2026";

  const initialSelectedDate = todayKey < MIN_DATE ? MIN_DATE : todayKey;

  const [selectedDate, setSelectedDate] = useState<string>(initialSelectedDate);
  const [isLockedToday, setIsLockedToday] = useState(false);
  const [team, setTeam] = useState<Record<string, string | null>>(emptyTeam);
  const [perfectTeam, setPerfectTeam] = useState<Record<string, string | null> | null>(null);
  const [showPerfect, setShowPerfect] = useState(false);
  const [personalBests, setPersonalBests] = useState<PersonalBestMap>(makeEmptyPersonalBestMap());
  const [showHighScores, setShowHighScores] = useState(false);
  const [gamesPlayed, setGamesPlayed] = useState<number>(0);
  const [active, setActive] = useState<{
    slotId: string;
    allowed: PlayerPos[];
    slotLabel: Position;
  } | null>(null);
  const [search, setSearch] = useState("");

  const isLiveToday = selectedDate === todayKey;

  const dailyStat = useMemo(() => pickDailyStatForDate(selectedDate), [selectedDate]);

  const ALL_PLAYERS: Player[] = useMemo(
    () => mapPlayersForStat(RAW_PLAYERS, dailyStat.key),
    [RAW_PLAYERS, dailyStat.key]
  );

  const dailyClubs = useMemo(
    () => pickDailyClubsForDate(AVAILABLE_CLUBS, 4, selectedDate),
    [AVAILABLE_CLUBS, selectedDate]
  );

  const dailyPlayers = useMemo(() => {
    const set = new Set(dailyClubs.map((c) => c.name));
    return ALL_PLAYERS.filter((p) => set.has(p.club));
  }, [ALL_PLAYERS, dailyClubs]);

  const lockKey = useMemo(() => `${LS_DAILY_LOCK_PREFIX}${selectedDate}`, [selectedDate]);

  const currentPersonalBest = personalBests[dailyStat.key];

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

  function saveJSON(key: string, value: unknown) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  useEffect(() => {
    setSelectedDate((prev) => {
      if (prev < MIN_DATE) return MIN_DATE;
      if (prev > todayKey) return todayKey;
      return prev;
    });
  }, [MIN_DATE, todayKey]);

  useEffect(() => {
    const locked = loadJSON<{ locked: boolean; team?: Record<string, string | null> }>(lockKey, {
      locked: false,
    });

    setIsLockedToday(Boolean(locked.locked));
    if (locked.team) setTeam(locked.team);
    else setTeam(emptyTeam);

    const storedBestMap = loadJSON<unknown>(LS_PERSONAL_BESTS, makeEmptyPersonalBestMap());
    setPersonalBests(mergePersonalBestMap(storedBestMap));

    const gp = loadJSON<number>(LS_GAMES_PLAYED, 0);
    setGamesPlayed(gp);

    setShowPerfect(false);
    setPerfectTeam(null);
    setShowHighScores(false);
    setActive(null);
    setSearch("");
  }, [lockKey, emptyTeam]);

  const getPlayerById = (pid: string | null) => {
    if (!pid) return null;
    return ALL_PLAYERS.find((p) => p.id === pid) ?? null;
  };

  const gameOver = useMemo(() => SLOTS.every((s) => Boolean(team[s.id])), [team]);
  const activeTeam = showPerfect && perfectTeam ? perfectTeam : team;

  const totalShown = useMemo(() => sumPoints(activeTeam, getPlayerById), [activeTeam, ALL_PLAYERS]);

  const pickedIds = useMemo(
    () => new Set(Object.values(team).filter(Boolean) as string[]),
    [team]
  );

  const eligiblePlayers = useMemo(() => {
    if (!active) return [];
    const q = search.trim().toLowerCase();

    return dailyPlayers
      .filter((p) => !pickedIds.has(p.id))
      .filter((p) => p.value > 0)
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

      setPersonalBests((prev) => {
        const currentBest = prev[dailyStat.key];
        const shouldReplace = !currentBest || score > currentBest.score;

        if (!shouldReplace) return prev;

        const next: PersonalBestMap = {
          ...prev,
          [dailyStat.key]: {
            score,
            date: todayKey,
          },
        };

        saveJSON(LS_PERSONAL_BESTS, next);
        return next;
      });
    }
  }, [gameOver, isLockedToday, isLiveToday, lockKey, team, todayKey, dailyStat.key, ALL_PLAYERS]);

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

  function getPerfectGlow(slotId: string) {
    if (!showPerfect || !perfectTeam) return {};
    const yourPick = team[slotId];
    const perfectPick = perfectTeam[slotId];
    const isCorrect = yourPick && perfectPick && yourPick === perfectPick;

    if (isCorrect) {
      return {
        borderColor: "rgba(34,197,94,0.95)",
        boxShadow:
          "0 0 0 1px rgba(34,197,94,0.95), 0 0 14px rgba(34,197,94,0.85), 0 0 28px rgba(34,197,94,0.45)",
      };
    }

    return {
      borderColor: "rgba(239,68,68,0.95)",
      boxShadow:
        "0 0 0 1px rgba(239,68,68,0.95), 0 0 14px rgba(239,68,68,0.85), 0 0 28px rgba(239,68,68,0.45)",
    };
  }

  const previousBestScore = currentPersonalBest?.score ?? 0;
  const isNewHighScore =
    !showPerfect &&
    isLiveToday &&
    totalShown > 0 &&
    (totalShown > previousBestScore ||
      (gameOver &&
        currentPersonalBest?.date === todayKey &&
        Math.abs(totalShown - previousBestScore) < 0.001));

  const totalNumberClass = isNewHighScore
    ? "bg-gradient-to-r from-[#fff3b0] via-[#ffd54a] to-[#c99200] bg-clip-text text-transparent"
    : "text-white";

  const personalBestNumberClass =
    "bg-gradient-to-r from-[#fff3b0] via-[#ffd54a] to-[#c99200] bg-clip-text text-transparent";

  const goHome = () => {
    router.push("/?season=2026");
  };

  return (
    <main className="min-h-screen text-white relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/13031df3-8bf5-4818-b2a4-5777164a3db9.png')",
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
            <h1 className="text-4xl font-extrabold tracking-wide text-white">DAILY GAME</h1>
            <div className="mt-2 text-white/60 font-semibold">
              Build one lineup per day from today’s 4 random clubs.
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-2 font-bold text-red-100">
                2026
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="text-white/60 text-sm font-semibold">Play date:</div>

              <button
                className="rounded-xl border border-white/20 bg-[#0D0D0D] px-3 py-2 text-white/80 hover:text-white hover:border-white/40 disabled:opacity-40 disabled:cursor-not-allowed"
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
                className="rounded-xl border border-white/15 px-3 py-2 text-white outline-none focus:border-white/40"
                style={{ backgroundColor: "#0D0D0D" }}
              />

              <button
                className="rounded-xl border border-white/20 bg-[#0D0D0D] px-3 py-2 text-white/80 hover:text-white hover:border-white/40 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => setSelectedDate((d) => shiftDateKey(d, +1))}
                disabled={selectedDate >= todayKey}
                title="Next day"
              >
                →
              </button>

              <button
                className="rounded-xl border border-white/20 bg-[#0D0D0D] px-3 py-2 text-white/80 hover:text-white hover:border-white/40"
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
            className="rounded-xl border border-white/20 bg-[#0D0D0D] px-4 py-2 text-white/80 hover:text-white hover:border-white/40"
            onClick={goHome}
          >
            ← Home
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/15 bg-[#0D0D0D] p-5">
            <div className="text-white/60 font-semibold tracking-widest text-xs">
              {isLiveToday ? "TODAY" : "SELECTED DAY"}
            </div>
            <div className="mt-2 font-extrabold text-lg">{selectedDate}</div>
            <div className="mt-1 text-white/60 text-sm">
              {isLiveToday
                ? ""
                : isLockedToday
                  ? "Locked (played on that date)"
                  : "Unplayed archive day"}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowHighScores(true)}
            className="rounded-2xl border border-white/15 bg-[#0D0D0D] p-5 text-left transition hover:border-white/30 hover:bg-[#121212]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-white/60 font-semibold tracking-widest text-xs">
                PERSONAL HIGH SCORE
              </div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/35">
                Click
              </div>
            </div>

            {currentPersonalBest ? (
              <div className="mt-2">
                <div className={`font-extrabold text-lg ${personalBestNumberClass}`}>
                  {currentPersonalBest.score.toFixed(1)} {dailyStat.short}
                </div>
                <div className="text-white/60 text-sm">Set on {currentPersonalBest.date}</div>
              </div>
            ) : (
              <div className="mt-2 text-white/60 text-sm">No {dailyStat.label} high score yet.</div>
            )}

            <div className="mt-2 text-white/35 text-xs">
              Viewing {dailyStat.label} high score. Click to see all stats.
            </div>

            {!isLiveToday && (
              <div className="mt-2 text-white/40 text-xs">
                High score updates only when played live today.
              </div>
            )}
          </button>

          <div className="rounded-2xl border border-white/15 bg-[#0D0D0D] p-5">
            <div className="text-white/60 font-semibold tracking-widest text-xs">
              TOTAL GAMES PLAYED
            </div>
            <div className="mt-2 font-extrabold text-lg">{gamesPlayed}</div>
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

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {dailyClubs.map((c) => (
              <div
                key={c.name}
                className="rounded-2xl px-4 py-4 font-extrabold tracking-wide select-none border border-white/10"
                style={{ backgroundColor: c.primary, color: c.text }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-black/15">
                    <Image
                      src={teamIconUrl(c.name)}
                      alt={c.name}
                      width={48}
                      height={48}
                      className="h-full w-full object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 leading-tight">
                    <div className="text-xs opacity-80">CLUB</div>
                    <div className="truncate">{c.name.toUpperCase()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col xl:flex-row xl:items-stretch xl:justify-between gap-4">
          <div className="grid w-full xl:max-w-3xl grid-cols-1 md:grid-cols-2 gap-3">
            <div className="min-h-[108px] rounded-2xl border border-white/15 bg-[#0D0D0D] p-5 shadow-[0_0_30px_rgba(0,0,0,0.35)] flex flex-col justify-center">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-white/45">
                {showPerfect ? "Perfect Total" : "Your Total"}
              </div>

              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <div className={`text-3xl sm:text-4xl font-black leading-none ${totalNumberClass}`}>
                  {totalShown.toFixed(1)}
                </div>

                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/65">
                  {dailyStat.short}
                </div>

                {gameOver && (
                  <span className="rounded-full border border-green-400/30 bg-green-500/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-green-300">
                    Complete
                  </span>
                )}

                {showPerfect && (
                  <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-blue-300">
                    Viewing Perfect
                  </span>
                )}
              </div>
            </div>

            <div className="min-h-[108px] rounded-2xl border border-white/15 bg-[#0D0D0D] p-5 shadow-[0_0_30px_rgba(0,0,0,0.35)] flex flex-col justify-center">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-white/45">
                Scoring Type
              </div>
              <div className="mt-2 flex items-center min-h-[40px]">
                <div className="text-3xl sm:text-4xl font-black leading-none text-white">
                  {dailyStat.label}
                </div>
              </div>
            </div>
          </div>

          <div className="flex xl:items-center">
            <button
              className={`rounded-xl border px-4 py-3 transition h-full min-h-[56px] ${
                gameOver || showPerfect
                  ? "border-white/20 bg-[#0D0D0D] text-white/80 hover:text-white hover:border-white/40"
                  : "border-white/10 bg-[#0D0D0D] text-white/30 cursor-not-allowed"
              }`}
              onClick={onTogglePerfect}
              disabled={!gameOver && !showPerfect}
            >
              {showPerfect ? "Show My Team" : "Show Perfect Team"}
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {SLOTS.map((slot) => {
            const p = getPlayerById(activeTeam[slot.id]);
            const clubMeta = clubForPlayer(AFL_CLUBS, p);
            const isFilled = Boolean(p);
            const clickable = !isLockedToday && !showPerfect && !isFilled;
            const glowStyle = getPerfectGlow(slot.id);

            return (
              <div key={slot.id} className="flex gap-3 items-center">
                <div className="w-16 sm:w-20 shrink-0 rounded-md bg-white text-black font-extrabold text-center py-2">
                  {slot.label}
                </div>

                <button
                  className={`flex-1 border rounded-md px-4 text-left transition flex items-center justify-between h-[56px] ${
                    clickable ? "hover:brightness-110" : "cursor-not-allowed"
                  }`}
                  style={{
                    backgroundColor: p && clubMeta ? clubMeta.primary : "rgba(0,0,0,0.30)",
                    color: p && clubMeta ? clubMeta.text : "#ffffff",
                    borderColor: p ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.7)",
                    ...glowStyle,
                  }}
                  onClick={() => onOpen(slot)}
                  disabled={!clickable}
                >
                  <div className="flex items-center w-full">
                    <div className="min-w-0 w-[220px] sm:w-[260px]">
                      <span
                        className={`truncate block ${
                          p ? "font-extrabold" : "font-extrabold text-white/80"
                        }`}
                      >
                        {p ? p.name : `+ Select ${slot.label}`}
                      </span>
                    </div>

                    <div className="flex-1 flex justify-end pr-24 h-full">
                      {p && clubMeta && (
                        <div className="h-[48px] w-[140px] overflow-hidden rounded-sm shrink-0">
                          <Image
                            src={teamIconUrl(clubMeta.name)}
                            alt={clubMeta.name}
                            width={140}
                            height={48}
                            className="h-full w-full object-fill"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>

                    <div className="w-[120px] flex justify-end">
                      {p?.value != null && (
                        <span className="hidden sm:inline-flex shrink-0 font-extrabold px-3 py-1 rounded-md bg-black/45 text-white">
                          {p.value.toFixed(1)} {dailyStat.short}
                        </span>
                      )}
                    </div>
                  </div>
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
                className="rounded-xl border border-white/20 bg-[#0D0D0D] px-3 py-2 text-white/80 hover:text-white hover:border-white/40"
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

      {showHighScores && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75" onClick={() => setShowHighScores(false)} />

          <div className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-zinc-950 p-5 shadow-[0_0_40px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold tracking-wide">Personal High Scores</div>
                <div className="mt-1 text-sm text-white/50">
                  Best score for each scoring type and the day it was set.
                </div>
              </div>

              <button
                className="rounded-xl border border-white/20 bg-[#0D0D0D] px-3 py-2 text-white/80 hover:text-white hover:border-white/40"
                onClick={() => setShowHighScores(false)}
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DAILY_STATS.map((stat) => {
                const best = personalBests[stat.key];
                const isActiveStat = stat.key === dailyStat.key;

                return (
                  <div
                    key={stat.key}
                    className={`rounded-2xl border p-4 ${
                      isActiveStat
                        ? "border-yellow-400/30 bg-yellow-500/5"
                        : "border-white/10 bg-[#0D0D0D]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-white/45">
                        {stat.label}
                      </div>

                      {isActiveStat && (
                        <span className="rounded-full border border-yellow-400/25 bg-yellow-500/10 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-yellow-300">
                          Today’s Stat
                        </span>
                      )}
                    </div>

                    {best ? (
                      <>
                        <div
                          className={`mt-3 text-2xl font-black leading-none ${personalBestNumberClass}`}
                        >
                          {best.score.toFixed(1)} {stat.short}
                        </div>
                        <div className="mt-2 text-sm text-white/60">Set on {best.date}</div>
                      </>
                    ) : (
                      <div className="mt-3 text-sm text-white/50">No high score yet.</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}