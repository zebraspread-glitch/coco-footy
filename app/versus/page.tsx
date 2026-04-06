"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import players2025 from "../data/public/afl_players.json";
import players2026 from "../data/public/afl_players26.json";
import goals2025 from "../data/public/afl_goals.json";
import bounces2025 from "../data/public/afl_bounces.json";
import disposals2025 from "../data/public/afl_disposals.json";

type Side = "A" | "B";
type PlayerPos = "FWD" | "MID" | "DEF" | "RUCK";
type SlotPos = "FWD" | "MID" | "DEF" | "RUCK" | "FLEX";
type Position = "FWD" | "MID" | "DEF" | "RUCK" | "FLEX";
type Season = "2025" | "2026";
type StatMode =
  | "fantasy"
  | "supercoach"
  | "goals"
  | "bounces"
  | "disposals";

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
  supercoachPoints?: number;
  goals?: number;
  bounces?: number;
  disposals?: number;
};

type ClubMeta = {
  name: string;
  primary: string;
  text: string;
};

type AiMove = {
  slotId: string;
  player: Player;
};

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

const TURN_ORDER: Side[] = [
  "A", "B", "B", "A",
  "A", "B", "B", "A",
  "A", "B", "B", "A",
  "A", "B", "B", "A",
];

function getPlayerStatValue(
  player: Player | null,
  statMode: StatMode,
  season: Season
) {
  if (!player) return 0;

  if (statMode === "supercoach") {
    return Number(player.supercoachPoints ?? 0);
  }

  if (statMode === "goals") {
    return Number(season === "2025" ? player.points ?? 0 : player.goals ?? 0);
  }

  if (statMode === "bounces") {
    return Number(season === "2025" ? player.points ?? 0 : player.bounces ?? 0);
  }

  if (statMode === "disposals") {
    return Number(
      season === "2025" ? player.points ?? 0 : player.disposals ?? 0
    );
  }

  return Number(player.points ?? 0);
}

function sumStatTotal(
  team: Record<string, string | null>,
  slots: Slot[],
  getById: (id: string | null) => Player | null,
  statMode: StatMode,
  season: Season
) {
  let total = 0;
  for (const slot of slots) {
    total += getPlayerStatValue(getById(team[slot.id]), statMode, season);
  }
  return total;
}

function clampClubsToPlayers(clubs: ClubMeta[], players: Player[]) {
  const available = new Set(players.map((p) => p.club));
  return clubs.filter((c) => available.has(c.name));
}

function clubForPlayer(
  clubs: ClubMeta[],
  player: Player | null
): ClubMeta | null {
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

function getStatTitle(statMode: StatMode) {
  if (statMode === "supercoach") return "SC POINTS MODE";
  if (statMode === "goals") return "GOALS MODE";
  if (statMode === "bounces") return "BOUNCES MODE";
  if (statMode === "disposals") return "DISPOSALS MODE";
  return "FANTASY POINTS MODE";
}

function formatStatValue(value: number, statMode: StatMode) {
  if (statMode === "supercoach") return `${value.toFixed(1)} SC`;
  if (statMode === "goals") return `${Math.round(value)} GOALS`;
  if (statMode === "bounces") return `${Math.round(value)} BOUNCES`;
  if (statMode === "disposals") return `${value.toFixed(1)} DISP`;
  return `${value.toFixed(1)} PTS`;
}

function getActiveSlots(statMode: StatMode) {
  if (statMode === "bounces") {
    return SLOTS.filter((slot) => slot.id !== "ruck");
  }
  return SLOTS;
}

function createEmptyTeam(slots: Slot[]) {
  return Object.fromEntries(
    slots.map((s) => [s.id, null])
  ) as Record<string, string | null>;
}

function getWinnerAccent(winner: "A" | "B" | "DRAW" | null) {
  if (winner === "A") {
    return {
      ring: "border-blue-400/35",
      glow: "shadow-[0_20px_70px_rgba(59,130,246,0.24)]",
      from: "from-blue-500/18",
      via: "via-cyan-400/8",
      to: "to-white/5",
      badge: "text-blue-200",
    };
  }

  if (winner === "B") {
    return {
      ring: "border-red-400/35",
      glow: "shadow-[0_20px_70px_rgba(239,68,68,0.24)]",
      from: "from-red-500/18",
      via: "via-orange-400/8",
      to: "to-white/5",
      badge: "text-red-200",
    };
  }

  return {
    ring: "border-white/20",
    glow: "shadow-[0_20px_70px_rgba(255,255,255,0.08)]",
    from: "from-white/10",
    via: "via-white/5",
    to: "to-white/0",
    badge: "text-white/85",
  };
}

function isRealPlayer(player: Player) {
  const name = String(player.name ?? "").trim();
  const club = String(player.club ?? "").trim();

  if (!name || !club) return false;
  if (name.length < 3) return false;

  const blocked = [
    "Appearance",
    "Register New Account",
    "Reset Password",
    "Change Password",
    "Manage Settings",
    "League Total",
    "Rankings",
    "getPlugContent",
    "Use device theme",
    "Dark theme",
    "Light theme",
    "Year",
    "Position",
    "Sort By",
  ];

  return !blocked.some((bad) => name.includes(bad) || club.includes(bad));
}

function chooseAiPlayer(
  players: Player[],
  statMode: StatMode,
  season: Season,
  difficulty: number
) {
  if (players.length === 0) return null;

  const sorted = [...players].sort((a, b) => {
    return (
      getPlayerStatValue(b, statMode, season) -
      getPlayerStatValue(a, statMode, season)
    );
  });

  const d = Math.min(10, Math.max(1, difficulty));

  // Difficulty 10 = always best
  if (d === 10) return sorted[0];

  // Difficulty 1 = worst players
  if (d === 1) {
    const worstPool = sorted.slice(-Math.ceil(sorted.length * 0.3));
    return worstPool[Math.floor(Math.random() * worstPool.length)];
  }

  // Scale between best and random
  const topPercent = 1 - (d - 1) / 9; 
  const poolSize = Math.max(1, Math.floor(sorted.length * topPercent));

  const pool = sorted.slice(0, poolSize);
  return pool[Math.floor(Math.random() * pool.length)];
}

function chooseAiMove(
  moves: AiMove[],
  statMode: StatMode,
  season: Season,
  difficulty: number
) {
  if (moves.length === 0) return null;

  const sorted = [...moves].sort((a, b) => {
    return (
      getPlayerStatValue(b.player, statMode, season) -
      getPlayerStatValue(a.player, statMode, season)
    );
  });

  const d = Math.min(10, Math.max(1, difficulty));

  // PERFECT AI
  if (d === 10) return sorted[0];

  // TERRIBLE AI
  if (d === 1) {
    const worstPool = sorted.slice(-Math.ceil(sorted.length * 0.3));
    return worstPool[Math.floor(Math.random() * worstPool.length)];
  }

  // Scaling difficulty
  const topPercent = 1 - (d - 1) / 9;
  const poolSize = Math.max(1, Math.floor(sorted.length * topPercent));

  const pool = sorted.slice(0, poolSize);
  return pool[Math.floor(Math.random() * pool.length)];
}

type TeamColumnProps = {
  side: Side;
  clubs: ClubMeta[];
  slots: Slot[];
  selection: Record<string, string | null>;
  getPlayer: (id: string | null) => Player | null;
  onOpen: (side: Side, slot: Slot) => void;
  enabled: boolean;
  badgeClass: string;
  gameOver: boolean;
  winner: "A" | "B" | "DRAW" | null;
  statMode: StatMode;
  season: Season;
  aiControlled?: boolean;
};

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
  statMode,
  season,
  aiControlled = false,
}: TeamColumnProps) {
  return (
    <div className="space-y-3">
      {slots.map((slot) => {
        const p = getPlayer(selection[slot.id]);
        const clubMeta = clubForPlayer(clubs, p);
        const isFilled = Boolean(p);
        const clickable = enabled && !isFilled;

        return (
          <div key={`${side}-${slot.id}`} className="flex items-center gap-3">
            <div
              className={`w-[76px] shrink-0 h-[44px] rounded-xl flex items-center justify-center font-black tracking-wide text-sm shadow-[0_10px_24px_rgba(0,0,0,0.28)] ${badgeClass}`}
            >
              {slot.label}
            </div>

            <button
              onClick={() => clickable && onOpen(side, slot)}
              disabled={!clickable}
              className={`flex-1 min-w-0 h-[58px] rounded-xl border px-3 text-left transition ${
                isFilled
                  ? "shadow-[0_10px_28px_rgba(0,0,0,0.28)]"
                  : clickable
                  ? side === "A"
                    ? "border-2 border-blue-400/80 bg-blue-500/10 shadow-[0_0_22px_rgba(59,130,246,0.35)] animate-pulse"
                    : "border-2 border-red-400/80 bg-red-500/10 shadow-[0_0_22px_rgba(239,68,68,0.35)] animate-pulse"
                  : "border-white/10 bg-white/[0.02] opacity-70 cursor-not-allowed"
              }`}
              style={
                isFilled && clubMeta
                  ? {
                      backgroundColor: clubMeta.primary,
                      color: clubMeta.text,
                      borderColor: `${clubMeta.text}22`,
                    }
                  : undefined
              }
              title={
                clickable
                  ? `Select ${slot.label}`
                  : isFilled
                  ? "Locked (cannot be replaced)"
                  : aiControlled && side === "B" && !gameOver
                  ? "AI is controlling Team B"
                  : undefined
              }
            >
              <div className="flex items-center justify-between w-full h-full min-w-0 gap-3 overflow-hidden">
                <div className="min-w-0 flex-[1.2]">
                  <span
                    className={`block truncate font-extrabold ${
                      p ? "" : "text-white/80"
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

                <div className="w-[130px] shrink-0 flex justify-end">
                  {p && (
                    <span
                      className="shrink-0 font-extrabold px-3 py-1 rounded-md whitespace-nowrap"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.28)",
                        color: clubMeta?.text ?? "#fff",
                      }}
                    >
                      {formatStatValue(
                        getPlayerStatValue(p, statMode, season),
                        statMode
                      )}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </div>
        );
      })}

      {aiControlled && side === "B" && !gameOver && (
        <div className="pt-1 text-right text-[11px] font-bold uppercase tracking-[0.3em] text-red-200/70">
          AI Controlled
        </div>
      )}

      {gameOver && winner === side && (
        <div
          className={`pt-1 text-right text-[11px] font-black uppercase tracking-[0.3em] ${
            side === "A" ? "text-blue-200/85" : "text-red-200/85"
          }`}
        >
          Winner
        </div>
      )}
    </div>
  );
}

function VersusDraftPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [season, setSeason] = useState<Season>("2025");
  const [statMode, setStatMode] = useState<StatMode>("fantasy");
  const [seasonReady, setSeasonReady] = useState(false);

  const [aiMode, setAiMode] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState(7);

  const ACTIVE_SLOTS = useMemo(() => getActiveSlots(statMode), [statMode]);

  const [teamA, setTeamA] = useState<Record<string, string | null>>(
    createEmptyTeam(SLOTS)
  );
  const [teamB, setTeamB] = useState<Record<string, string | null>>(
    createEmptyTeam(SLOTS)
  );

  const [club, setClub] = useState<ClubMeta>(AFL_CLUBS[0]);
  const [displayClub, setDisplayClub] = useState<ClubMeta>(AFL_CLUBS[0]);
  const [spinning, setSpinning] = useState(false);

  const [turnIndex, setTurnIndex] = useState(0);
  const turn: Side = TURN_ORDER[turnIndex] ?? "A";

  const [picksSinceSpin, setPicksSinceSpin] = useState(0);

  const [active, setActive] = useState<{
    side: Side;
    slotId: string;
    allowed: PlayerPos[];
    slotLabel: SlotPos;
  } | null>(null);

  const [search, setSearch] = useState("");

  const spinTimer = useRef<number | null>(null);
  const spinTimeout = useRef<number | null>(null);
  const delayedSpinTimeout = useRef<number | null>(null);
  const aiPickTimeout = useRef<number | null>(null);
  const pickLockRef = useRef(false);
  const pendingSpinRef = useRef(false);

  useEffect(() => {
    const urlSeason = searchParams.get("season");
    const urlStat = searchParams.get("stat");

    let nextSeason: Season = "2025";
    let nextStat: StatMode = "fantasy";

    if (urlSeason === "2025" || urlSeason === "2026") {
      nextSeason = urlSeason;
    } else {
      try {
        const savedSeason = localStorage.getItem("selectedSeason");
        if (savedSeason === "2025" || savedSeason === "2026") {
          nextSeason = savedSeason;
        }
      } catch {}
    }

    if (
      urlStat === "fantasy" ||
      urlStat === "supercoach" ||
      urlStat === "goals" ||
      urlStat === "bounces" ||
      urlStat === "disposals"
    ) {
      nextStat = urlStat;
    } else {
      try {
        const savedStat = localStorage.getItem("selectedStatMode");
        if (
          savedStat === "fantasy" ||
          savedStat === "supercoach" ||
          savedStat === "goals" ||
          savedStat === "bounces" ||
          savedStat === "disposals"
        ) {
          nextStat = savedStat as StatMode;
        }
      } catch {}
    }

    if (nextSeason === "2025" && nextStat === "supercoach") {
      nextStat = "fantasy";
    }

    setSeason(nextSeason);
    setStatMode(nextStat);

    try {
      localStorage.setItem("selectedSeason", nextSeason);
      localStorage.setItem("selectedStatMode", nextStat);
    } catch {}

    setSeasonReady(true);
  }, [searchParams]);

  const updateRoute = (nextSeason: Season, nextStat: StatMode) => {
    router.replace(`/versus?season=${nextSeason}&stat=${nextStat}`);
  };

  const changeSeason = (nextSeason: Season) => {
    const nextStat =
      nextSeason === "2025" && statMode === "supercoach"
        ? "fantasy"
        : statMode;

    setSeason(nextSeason);
    setStatMode(nextStat);

    try {
      localStorage.setItem("selectedSeason", nextSeason);
      localStorage.setItem("selectedStatMode", nextStat);
    } catch {}

    updateRoute(nextSeason, nextStat);
  };

  const changeStatMode = (nextStat: StatMode) => {
    if (season === "2025" && nextStat === "supercoach") return;

    setStatMode(nextStat);

    try {
      localStorage.setItem("selectedStatMode", nextStat);
    } catch {}

    updateRoute(season, nextStat);
  };

  const goHome = () => {
    router.push(`/?season=${season}`);
  };

  const RAW_PLAYERS: Player[] = useMemo(() => {
    if (season === "2025") {
      if (statMode === "goals") return goals2025 as Player[];
      if (statMode === "bounces") return bounces2025 as Player[];
      if (statMode === "disposals") return disposals2025 as Player[];
      return players2025 as Player[];
    }

    return players2026 as Player[];
  }, [season, statMode]);

  const ALL_PLAYERS: Player[] = useMemo(() => {
    return RAW_PLAYERS.filter(isRealPlayer).filter(
      (p) => getPlayerStatValue(p, statMode, season) > 0
    );
  }, [RAW_PLAYERS, statMode, season]);

  const SPIN_CLUBS = useMemo(
    () => clampClubsToPlayers(AFL_CLUBS, ALL_PLAYERS),
    [ALL_PLAYERS]
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
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [active, clubPlayers, pickedIds, search]);

  const teamATotal = useMemo(
    () => sumStatTotal(teamA, ACTIVE_SLOTS, getPlayerById, statMode, season),
    [teamA, ACTIVE_SLOTS, statMode, season]
  );

  const teamBTotal = useMemo(
    () => sumStatTotal(teamB, ACTIVE_SLOTS, getPlayerById, statMode, season),
    [teamB, ACTIVE_SLOTS, statMode, season]
  );

  const allFilledA = useMemo(
    () => ACTIVE_SLOTS.every((s) => Boolean(teamA[s.id])),
    [teamA, ACTIVE_SLOTS]
  );

  const allFilledB = useMemo(
    () => ACTIVE_SLOTS.every((s) => Boolean(teamB[s.id])),
    [teamB, ACTIVE_SLOTS]
  );

  const gameOver = allFilledA && allFilledB;

  const winner = useMemo<"A" | "B" | "DRAW" | null>(() => {
    if (!gameOver) return null;
    if (teamATotal > teamBTotal) return "A";
    if (teamBTotal > teamATotal) return "B";
    return "DRAW";
  }, [gameOver, teamATotal, teamBTotal]);

  const winnerAccent = getWinnerAccent(winner);

  function cleanupSpinTimers() {
    if (spinTimer.current) window.clearInterval(spinTimer.current);
    if (spinTimeout.current) window.clearTimeout(spinTimeout.current);
    if (delayedSpinTimeout.current) window.clearTimeout(delayedSpinTimeout.current);
    if (aiPickTimeout.current) window.clearTimeout(aiPickTimeout.current);

    spinTimer.current = null;
    spinTimeout.current = null;
    delayedSpinTimeout.current = null;
    aiPickTimeout.current = null;
    pendingSpinRef.current = false;
  }

  function scheduleSpin(delay = 650) {
    if (pendingSpinRef.current) return;

    pendingSpinRef.current = true;

    if (delayedSpinTimeout.current) {
      window.clearTimeout(delayedSpinTimeout.current);
      delayedSpinTimeout.current = null;
    }

    delayedSpinTimeout.current = window.setTimeout(() => {
      pendingSpinRef.current = false;
      delayedSpinTimeout.current = null;
      spinToRandomClub();
    }, delay);
  }

  function advanceTurnAndMaybeSpin() {
    setTurnIndex((prev) => prev + 1);
    setPicksSinceSpin((prev) => {
      const next = prev + 1;

      if (next >= 2) {
        scheduleSpin(650);
        return 0;
      }

      return next;
    });
  }

  function spinToRandomClub(forbiddenClubName?: string) {
  if (gameOver) return;
  if (spinning || SPIN_CLUBS.length === 0) return;

  pickLockRef.current = false;
  setSpinning(true);
  setActive(null);
  setSearch("");
  setPicksSinceSpin(0);

  let i = Math.floor(Math.random() * SPIN_CLUBS.length);

  if (spinTimer.current) window.clearInterval(spinTimer.current);
  if (spinTimeout.current) window.clearTimeout(spinTimeout.current);

  setDisplayClub(SPIN_CLUBS[i]);

  spinTimer.current = window.setInterval(() => {
    i = (i + 1) % SPIN_CLUBS.length;
    setDisplayClub(SPIN_CLUBS[i]);
  }, 60);

  spinTimeout.current = window.setTimeout(() => {
    if (spinTimer.current) window.clearInterval(spinTimer.current);
    spinTimer.current = null;
    spinTimeout.current = null;

    let final = SPIN_CLUBS[Math.floor(Math.random() * SPIN_CLUBS.length)];

    if (SPIN_CLUBS.length > 1) {
      while (final.name === forbiddenClubName) {
        final = SPIN_CLUBS[Math.floor(Math.random() * SPIN_CLUBS.length)];
      }
    }

    setClub(final);
    setDisplayClub(final);
    setSpinning(false);
  }, 1200);
}

  function slotIsFilled(side: Side, slotId: string) {
    return side === "A" ? Boolean(teamA[slotId]) : Boolean(teamB[slotId]);
  }

  function onOpen(side: Side, slot: Slot) {
    if (pickLockRef.current) return;
    if (pendingSpinRef.current) return;
    if (gameOver) return;
    if (spinning) return;
    if (aiMode && side === "B") return;
    if (side !== turn) return;
    if (slotIsFilled(side, slot.id)) return;

    setSearch("");
    setActive({
      side,
      slotId: slot.id,
      allowed: slot.allowed,
      slotLabel: slot.label,
    });
  }

  function onPick(playerId: string) {
    if (pickLockRef.current) return;
    if (pendingSpinRef.current) return;
    if (gameOver) return;
    if (!active) return;
    if (spinning) return;
    if (active.side !== turn) return;
    if (slotIsFilled(active.side, active.slotId)) return;
    if (pickedIds.has(playerId)) return;

    pickLockRef.current = true;

    const currentActive = active;
    setActive(null);

    if (currentActive.side === "A") {
      setTeamA((prev) => ({ ...prev, [currentActive.slotId]: playerId }));
    } else {
      setTeamB((prev) => ({ ...prev, [currentActive.slotId]: playerId }));
    }

    setSearch("");
    advanceTurnAndMaybeSpin();

    requestAnimationFrame(() => {
      pickLockRef.current = false;
    });
  }

  function runAiTurn() {
    if (!aiMode) return;
    if (gameOver) return;
    if (turn !== "B") return;
    if (spinning) return;
    if (pendingSpinRef.current) return;
    if (pickLockRef.current) return;
    if (active) return;

    const openSlots = ACTIVE_SLOTS.filter((slot) => !teamB[slot.id]);

    if (openSlots.length === 0) return;

    const allMoves: AiMove[] = [];

    for (const slot of openSlots) {
      const candidates = clubPlayers
        .filter((p) => !pickedIds.has(p.id))
        .filter((p) => p.pos.some((pos) => slot.allowed.includes(pos)));

      for (const candidate of candidates) {
        allMoves.push({
          slotId: slot.id,
          player: candidate,
        });
      }
    }

    if (allMoves.length === 0) {
  setActive(null);
  setSearch("");
  scheduleSpin(150);
  return;
}

const aiMove = chooseAiMove(allMoves, statMode, season, aiDifficulty);

if (!aiMove) {
  setActive(null);
  setSearch("");
  scheduleSpin(150);
  return;
}

    pickLockRef.current = true;

    setTeamB((prev) => ({ ...prev, [aiMove.slotId]: aiMove.player.id }));
    setSearch("");
    setActive(null);
    advanceTurnAndMaybeSpin();

    requestAnimationFrame(() => {
      pickLockRef.current = false;
    });
  }

  function resetGame(nextAiMode = aiMode) {
    cleanupSpinTimers();

    pickLockRef.current = false;
    pendingSpinRef.current = false;
    setTeamA(createEmptyTeam(ACTIVE_SLOTS));
    setTeamB(createEmptyTeam(ACTIVE_SLOTS));
    setTurnIndex(0);
    setPicksSinceSpin(0);
    setActive(null);
    setSearch("");
    setSpinning(false);

    const randomStartClub =
  SPIN_CLUBS[Math.floor(Math.random() * SPIN_CLUBS.length)] ?? AFL_CLUBS[0];

setClub(randomStartClub);
setDisplayClub(randomStartClub);

window.setTimeout(() => {
  spinToRandomClub(randomStartClub.name);
}, 50);
  }

  function toggleAiMode() {
    const next = !aiMode;
    setAiMode(next);
    resetGame(next);
  }

  useEffect(() => {
    if (!seasonReady) return;

    const firstClub = SPIN_CLUBS[0] ?? AFL_CLUBS[0];

    cleanupSpinTimers();
    setSpinning(false);

    setClub(firstClub);
    setDisplayClub(firstClub);
    setTeamA(createEmptyTeam(ACTIVE_SLOTS));
    setTeamB(createEmptyTeam(ACTIVE_SLOTS));
    setTurnIndex(0);
    setPicksSinceSpin(0);
    setActive(null);
    setSearch("");

    const timeout = window.setTimeout(() => {
      spinToRandomClub();
    }, 50);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [season, statMode, SPIN_CLUBS, seasonReady, ACTIVE_SLOTS]);

  useEffect(() => {
    if (!active) return;
    if (eligiblePlayers.length !== 0) return;

    const currentTeam = active.side === "A" ? teamA : teamB;
    const remainingOpenSlots = ACTIVE_SLOTS.filter(
      (slot) => !currentTeam[slot.id]
    );

    if (remainingOpenSlots.length !== 1) return;

    const timeout = window.setTimeout(() => {
      setActive(null);
      setSearch("");
      advanceTurnAndMaybeSpin();
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [eligiblePlayers, active, teamA, teamB, ACTIVE_SLOTS]);

  useEffect(() => {
    if (!gameOver) return;
    cleanupSpinTimers();
    setSpinning(false);
    setActive(null);
    setSearch("");
  }, [gameOver]);

  useEffect(() => {
    if (!aiMode) return;
    if (gameOver) return;
    if (turn !== "B") return;
    if (spinning) return;
    if (pendingSpinRef.current) return;
    if (active) return;

    aiPickTimeout.current = window.setTimeout(() => {
      runAiTurn();
    }, 500);

    return () => {
      if (aiPickTimeout.current) {
        window.clearTimeout(aiPickTimeout.current);
        aiPickTimeout.current = null;
      }
    };
  }, [
    aiMode,
    gameOver,
    turn,
    spinning,
    active,
    club,
    teamB,
    pickedIds,
    statMode,
    season,
    aiDifficulty,
    ACTIVE_SLOTS,
    clubPlayers,
  ]);

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

      <div className="absolute inset-0 bg-black/68" />

      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,#ffffff22,transparent_40%),radial-gradient(circle_at_80%_30%,#ffffff15,transparent_35%),radial-gradient(circle_at_30%_80%,#ffffff10,transparent_40%)]" />

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-wide text-white">
              VERSUS MODE
            </h1>

            <div className="mt-3 text-white/65 font-bold tracking-wide">
              {getStatTitle(statMode)}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
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

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => changeStatMode("fantasy")}
                className={`rounded-xl border px-4 py-2 font-bold transition ${
                  statMode === "fantasy"
                    ? "bg-white text-black border-white"
                    : "border-white/20 text-white/80 hover:text-white hover:border-white/40"
                }`}
              >
                Fantasy Points
              </button>

              {season === "2026" && (
                <button
                  onClick={() => changeStatMode("supercoach")}
                  className={`rounded-xl border px-4 py-2 font-bold transition ${
                    statMode === "supercoach"
                      ? "bg-emerald-400 text-black border-emerald-300"
                      : "border-white/20 text-white/80 hover:text-white hover:border-white/40"
                  }`}
                >
                  SC Points
                </button>
              )}

              <button
                onClick={() => changeStatMode("disposals")}
                className={`rounded-xl border px-4 py-2 font-bold transition ${
                  statMode === "disposals"
                    ? "bg-white text-black border-white"
                    : "border-white/20 text-white/80 hover:text-white hover:border-white/40"
                }`}
              >
                Disposals
              </button>

              <button
                onClick={() => changeStatMode("goals")}
                className={`rounded-xl border px-4 py-2 font-bold transition ${
                  statMode === "goals"
                    ? "bg-yellow-400 text-black border-yellow-300"
                    : "border-white/20 text-white/80 hover:text-white hover:border-white/40"
                }`}
              >
                Goals
              </button>

              <button
                onClick={() => changeStatMode("bounces")}
                className={`rounded-xl border px-4 py-2 font-bold transition ${
                  statMode === "bounces"
                    ? "bg-orange-500 text-white border-orange-400"
                    : "border-white/20 text-white/80 hover:text-white hover:border-white/40"
                }`}
              >
                Bounces
              </button>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <button
              className="rounded-xl border border-white/20 px-4 py-2 text-white/80 hover:text-white hover:border-white/40"
              onClick={goHome}
            >
              ← Home
            </button>

            <button
              onClick={toggleAiMode}
              className={`rounded-xl border px-4 py-2 text-sm font-extrabold tracking-wide transition shadow-[0_10px_30px_rgba(0,0,0,0.22)] ${
                aiMode
                  ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
                  : "border-white/15 bg-white/8 text-white/85 hover:border-white/35 hover:bg-white/12"
              }`}
            >
              {aiMode ? "Friend Mode" : "A.I Mode"}
            </button>

            {aiMode && (
              <div className="w-[220px] rounded-2xl border border-white/12 bg-black/35 backdrop-blur-md px-4 py-3">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em] font-black text-white/65">
                  <span>Difficulty</span>
                  <span className="text-white">{aiDifficulty}</span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={10}
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(Number(e.target.value))}
                  className="mt-3 w-full accent-emerald-400"
                />

                <div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                  <span>Easy</span>
                  <span>Hard</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div className="rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-950/80 via-blue-900/45 to-black/70 backdrop-blur-md shadow-[0_10px_30px_rgba(37,99,235,0.22)] px-6 py-5">
            <div className="text-[11px] sm:text-xs uppercase tracking-[0.28em] text-blue-200/75 font-extrabold">
              BLUE
            </div>
            <div className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.18)]">
              {formatStatValue(teamATotal, statMode)}
            </div>
          </div>

          <div className="rounded-2xl border border-red-400/30 bg-gradient-to-br from-red-950/80 via-red-900/45 to-black/70 backdrop-blur-md shadow-[0_10px_30px_rgba(239,68,68,0.22)] px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] sm:text-xs uppercase tracking-[0.28em] text-red-200/75 font-extrabold">
                RED
              </div>

              {aiMode && (
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/12 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200">
                  AI
                </span>
              )}
            </div>

            <div className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.18)]">
              {formatStatValue(teamBTotal, statMode)}
            </div>
          </div>
        </div>

        {!gameOver && (
          <div className="mt-4 text-center text-white/60">
            {spinning || pendingSpinRef.current ? (
              <span className="font-semibold tracking-wide">Spinning club…</span>
            ) : aiMode && turn === "B" ? (
              <span className="font-semibold tracking-wide">
                Turn: <span className="text-white">TEAM B AI</span>
              </span>
            ) : (
              <span className="font-semibold tracking-wide">
                Turn: <span className="text-white">TEAM {turn}</span>
              </span>
            )}
          </div>
        )}

        {gameOver && (
          <div
            className={`mt-8 rounded-[28px] border ${winnerAccent.ring} ${winnerAccent.glow} bg-gradient-to-br ${winnerAccent.from} ${winnerAccent.via} ${winnerAccent.to} backdrop-blur-xl px-6 py-7 sm:px-8 sm:py-8 relative overflow-hidden`}
          >
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,#ffffff24,transparent_45%)]" />
            <div className="relative text-center">
              <div
                className={`text-xs sm:text-sm font-black uppercase tracking-[0.45em] ${winnerAccent.badge}`}
              >
                Final Result
              </div>

              <div className="mt-3 text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-[0_4px_18px_rgba(255,255,255,0.16)]">
                {winner === "DRAW" ? "IT'S A DRAW" : `TEAM ${winner} WINS`}
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
                <div className="rounded-2xl border border-white/12 bg-black/30 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-white/55 font-extrabold">
                    BLUE
                  </div>
                  <div className="mt-2 text-2xl font-black text-white">
                    {formatStatValue(teamATotal, statMode)}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/12 bg-white/5 px-4 py-4 flex items-center justify-center">
                  <div className="text-lg sm:text-xl font-black tracking-[0.25em] text-white/65">
                    VS
                  </div>
                </div>

                <div className="rounded-2xl border border-white/12 bg-black/30 px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-white/55 font-extrabold">
                    RED
                  </div>
                  <div className="mt-2 text-2xl font-black text-white">
                    {formatStatValue(teamBTotal, statMode)}
                  </div>
                </div>
              </div>

              <div className="mt-5 text-sm sm:text-base text-white/72 font-semibold">
                Margin:{" "}
                <span className="text-white font-extrabold">
                  {formatStatValue(Math.abs(teamATotal - teamBTotal), statMode)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          <TeamColumn
            side="A"
            clubs={AFL_CLUBS}
            slots={ACTIVE_SLOTS}
            selection={teamA}
            getPlayer={getPlayerById}
            onOpen={onOpen}
            enabled={!gameOver && !spinning && !pendingSpinRef.current && turn === "A"}
            badgeClass={
              season === "2026"
                ? "bg-blue-400 text-white"
                : "bg-blue-600 text-white"
            }
            gameOver={gameOver}
            winner={winner}
            statMode={statMode}
            season={season}
          />

          <TeamColumn
            side="B"
            clubs={AFL_CLUBS}
            slots={ACTIVE_SLOTS}
            selection={teamB}
            getPlayer={getPlayerById}
            onOpen={onOpen}
            enabled={!gameOver && !spinning && !pendingSpinRef.current && turn === "B" && !aiMode}
            badgeClass={
              season === "2026"
                ? "bg-red-500 text-white"
                : "bg-red-700 text-white"
            }
            gameOver={gameOver}
            winner={winner}
            statMode={statMode}
            season={season}
            aiControlled={aiMode}
          />
        </div>

        <div className="mt-12 text-center">
          {gameOver ? (
            <div className="flex items-center justify-center">
              <button
                onClick={() => resetGame()}
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-r from-white to-white/90 px-10 py-4 text-xl font-black text-black shadow-[0_18px_50px_rgba(255,255,255,0.18)] transition hover:scale-[1.02] hover:shadow-[0_22px_60px_rgba(255,255,255,0.24)] active:scale-[0.99]"
              >
                <span className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.65),transparent)] animate-[shimmer_1.6s_linear_infinite]" />
                <span className="relative">PLAY AGAIN</span>
              </button>
            </div>
          ) : (
            <>
              <div className="text-white/60 font-semibold tracking-widest">
                DRAFTING FROM:
              </div>

              <div className="mt-5 flex items-center justify-center">
                <div
                  className={`inline-flex items-center justify-center rounded-2xl px-10 py-4 font-extrabold text-xl select-none shadow-[0_14px_40px_rgba(0,0,0,0.35)] border border-white/10 ${
                    spinning || pendingSpinRef.current ? "opacity-90" : ""
                  }`}
                  style={{
                    backgroundColor: displayClub.primary,
                    color: displayClub.text,
                  }}
                  title="Auto-spins after every 2 picks"
                >
                  {displayClub.name.toUpperCase()}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setActive(null)}
          />

          <div className="relative w-full max-w-xl rounded-2xl border border-white/15 bg-zinc-950 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-extrabold tracking-wide">
                  Select {active.slotLabel}{" "}
                  <span className="text-white/60 font-bold">• TEAM {active.side}</span>
                </div>
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

            <div className="mt-3 max-h-[360px] overflow-y-auto rounded-xl border border-white/10">
              {eligiblePlayers.length === 0 ? (
                <div className="px-4 py-8 text-center text-white/55 font-semibold">
                  No eligible players found.
                </div>
              ) : (
                eligiblePlayers.map((p) => {
  const meta = clubForPlayer(AFL_CLUBS, p);

  return (
    <button
      key={p.id}
      onClick={() => onPick(p.id)}
      className="w-full border-b border-white/10 last:border-b-0 px-4 py-3 text-left hover:bg-white/5 transition"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-extrabold text-white">
            {p.name}
          </div>
          <div className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/45">
            {p.club} • {p.pos.join(", ")}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {meta && (
            <div className="h-[34px] w-[96px] overflow-hidden rounded-sm">
              <Image
                src={teamIconUrl(meta.name)}
                alt={meta.name}
                width={96}
                height={34}
                className="h-full w-full object-fill"
                unoptimized
              />
            </div>
          )}
        </div>
      </div>
    </button>
  );
})
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function VersusDraftPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white p-6">Loading...</div>
      }
    >
      <VersusDraftPageInner />
    </Suspense>
  );
}