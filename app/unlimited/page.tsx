"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import players2025 from "../data/public/afl_players.json";
import goals2025 from "../data/public/afl_goals.json";
import disposals2025 from "../data/public/afl_disposals.json";
import bounces2025 from "../data/public/afl_bounces.json";
import players2026 from "../data/public/afl_players26.json";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";

/** ================= Types ================= */
type PlayerPos = "FWD" | "MID" | "DEF" | "RUCK";
type SlotPos = "FWD" | "MID" | "DEF" | "RUCK" | "FLEX";
type Position = "FWD" | "MID" | "DEF" | "RUCK" | "FLEX";
type GameMode = "fantasy" | "sc" | "goals" | "disposals" | "bounces";

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

type RawPlayer2026 = {
  id?: string | number;
  name?: string;
  fullName?: string;
  player?: string;
  playerName?: string;
  club?: string;
  team?: string;
  pos?: PlayerPos[] | string;
  position?: PlayerPos[] | string;
  positions?: PlayerPos[] | string;
  points?: number | string;
  fantasy?: number | string;
  fantasyPoints?: number | string;
  aflFantasy?: number | string;
  avg?: number | string;
  average?: number | string;
  sc?: number | string;
  scPoints?: number | string;
  supercoach?: number | string;
  superCoach?: number | string;
  supercoachPoints?: number | string;
  goals?: number | string;
  avgGoals?: number | string;
  goalAverage?: number | string;
  disposals?: number | string;
  avgDisposals?: number | string;
  disposalAverage?: number | string;
  bounces?: number | string;
  avgBounces?: number | string;
  bounceAverage?: number | string;
  [key: string]: unknown;
};

type ClubMeta = {
  name: string;
  primary: string;
  text: string;
};

type HighScoreEntry = {
  key: string;
  season: "2025" | "2026";
  mode: GameMode;
  label: string;
  unit: string;
  value: number;
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
    case "sc":
      return "SC";
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

function modeTitle(mode: GameMode) {
  switch (mode) {
    case "sc":
      return "SC Points";
    case "goals":
      return "Goals";
    case "disposals":
      return "Disposals";
    case "bounces":
      return "Bounces";
    default:
      return "Fantasy Points";
  }
}

function formatStatValue(value: number, statLabel: string) {
  if (statLabel === "GOALS" || statLabel === "BOUNCES") {
    return String(Math.round(value));
  }
  return value.toFixed(1);
}

function getAvailableModes(season: "2025" | "2026"): GameMode[] {
  if (season === "2026") {
    return ["fantasy", "sc", "goals", "disposals", "bounces"];
  }
  return ["fantasy", "goals", "disposals", "bounces"];
}

function isModeAllowedForSeason(
  season: "2025" | "2026",
  mode: string | null
): mode is GameMode {
  if (!mode) return false;
  return getAvailableModes(season).includes(mode as GameMode);
}

function parseNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function normalizePositions(value: unknown): PlayerPos[] {
  if (Array.isArray(value)) {
    return value.filter(
      (v): v is PlayerPos =>
        v === "FWD" || v === "MID" || v === "DEF" || v === "RUCK"
    );
  }

  if (typeof value === "string") {
    const parts = value
      .split(/[\/,| ]+/)
      .map((p) => p.trim().toUpperCase())
      .filter(Boolean);

    const mapped = parts.filter(
      (v): v is PlayerPos =>
        v === "FWD" || v === "MID" || v === "DEF" || v === "RUCK"
    );

    if (mapped.length) return mapped;
  }

  return ["MID"];
}

function get2026StatValue(player: RawPlayer2026, mode: GameMode): number {
  const candidates: Record<GameMode, string[]> = {
    fantasy: ["points", "fantasyPoints", "fantasy", "aflFantasy", "avg", "average"],
    sc: ["sc", "scPoints", "supercoach", "superCoach", "supercoachPoints"],
    goals: ["goals", "avgGoals", "goalAverage"],
    disposals: ["disposals", "avgDisposals", "disposalAverage"],
    bounces: ["bounces", "avgBounces", "bounceAverage"],
  };

  for (const key of candidates[mode]) {
    if (key in player) {
      const value = parseNumber(player[key]);
      if (Number.isFinite(value)) return value;
    }
  }

  return 0;
}

function normalize2026Players(data: RawPlayer2026[], mode: GameMode): Player[] {
  return data
    .map((p, index) => {
      const name =
        (typeof p.name === "string" && p.name) ||
        (typeof p.fullName === "string" && p.fullName) ||
        (typeof p.player === "string" && p.player) ||
        (typeof p.playerName === "string" && p.playerName) ||
        `Player ${index + 1}`;

      const club =
        (typeof p.club === "string" && p.club) ||
        (typeof p.team === "string" && p.team) ||
        "";

      const pos = normalizePositions(p.pos ?? p.position ?? p.positions);

      const id =
        p.id != null && String(p.id).trim().length > 0
          ? String(p.id)
          : `${name}-${club}-${index}`;

      return {
        id,
        name,
        club,
        pos,
        points: get2026StatValue(p, mode),
      };
    })
    .filter((p) => p.name && p.club)
    .filter((p) => p.points > 0);
}

function getHighScoreKey(season: "2025" | "2026", mode: GameMode) {
  if (season === "2025") {
    if (mode === "goals") return "unlimited_highscore_2025_goals";
    if (mode === "disposals") return "unlimited_highscore_2025_disposals";
    if (mode === "bounces") return "unlimited_highscore_2025_bounces";
    return "unlimited_highscore_2025_fantasy";
  }

  if (mode === "sc") return "unlimited_highscore_2026_sc";
  if (mode === "goals") return "unlimited_highscore_2026_goals";
  if (mode === "disposals") return "unlimited_highscore_2026_disposals";
  if (mode === "bounces") return "unlimited_highscore_2026_bounces";
  return "unlimited_highscore_2026_fantasy";
}

function getMyStatsUnlimitedKey(season: "2025" | "2026", mode: GameMode) {
  if (season === "2025") {
    if (mode === "goals") return "coco_unlimited_2025_goals";
    if (mode === "disposals") return "coco_unlimited_2025_disposals";
    if (mode === "bounces") return "coco_unlimited_2025_bounces";
    return "coco_unlimited_2025_fantasy";
  }

  if (mode === "sc") return "coco_unlimited_2026_sc";
  if (mode === "goals") return "coco_unlimited_2026_goals";
  if (mode === "disposals") return "coco_unlimited_2026_disposals";
  if (mode === "bounces") return "coco_unlimited_2026_bounces";
  return "coco_unlimited_2026_fantasy";
}

function getAllHighScoreEntries(): HighScoreEntry[] {
  const entries: Array<Omit<HighScoreEntry, "value">> = [
    {
      key: getHighScoreKey("2025", "fantasy"),
      season: "2025",
      mode: "fantasy",
      label: "2025 Fantasy Points",
      unit: modeLabel("fantasy"),
    },
    {
      key: getHighScoreKey("2025", "goals"),
      season: "2025",
      mode: "goals",
      label: "2025 Goals",
      unit: modeLabel("goals"),
    },
    {
      key: getHighScoreKey("2025", "disposals"),
      season: "2025",
      mode: "disposals",
      label: "2025 Disposals",
      unit: modeLabel("disposals"),
    },
    {
      key: getHighScoreKey("2025", "bounces"),
      season: "2025",
      mode: "bounces",
      label: "2025 Bounces",
      unit: modeLabel("bounces"),
    },
    {
      key: getHighScoreKey("2026", "fantasy"),
      season: "2026",
      mode: "fantasy",
      label: "2026 Fantasy Points",
      unit: modeLabel("fantasy"),
    },
    {
      key: getHighScoreKey("2026", "sc"),
      season: "2026",
      mode: "sc",
      label: "2026 SC Points",
      unit: modeLabel("sc"),
    },
    {
      key: getHighScoreKey("2026", "goals"),
      season: "2026",
      mode: "goals",
      label: "2026 Goals",
      unit: modeLabel("goals"),
    },
    {
      key: getHighScoreKey("2026", "disposals"),
      season: "2026",
      mode: "disposals",
      label: "2026 Disposals",
      unit: modeLabel("disposals"),
    },
    {
      key: getHighScoreKey("2026", "bounces"),
      season: "2026",
      mode: "bounces",
      label: "2026 Bounces",
      unit: modeLabel("bounces"),
    },
  ];

  return entries.map((entry) => {
    let value = 0;
    try {
      value = Number(localStorage.getItem(entry.key) ?? 0);
      if (!Number.isFinite(value)) value = 0;
    } catch {
      value = 0;
    }

    return {
      ...entry,
      value,
    };
  });
}

function makeEmptyTeam(slots: Slot[]) {
  return Object.fromEntries(slots.map((s) => [s.id, null])) as Record<
    string,
    string | null
  >;
}

function TeamSlots({
  slots,
  team,
  getPlayerById,
  clubs,
  statLabel,
  enabled,
  onOpen,
}: {
  slots: Slot[];
  team: Record<string, string | null>;
  getPlayerById: (id: string | null) => Player | null;
  clubs: ClubMeta[];
  statLabel: string;
  enabled: boolean;
  onOpen: (slot: Slot) => void;
}) {
  return (
    <div className="space-y-3">
      {slots.map((slot) => {
        const p = getPlayerById(team[slot.id]);
        const clubMeta = clubForPlayer(clubs, p);

        const isFilled = Boolean(p);
        const clickable = enabled && !isFilled;

        let badgeClass =
          "bg-white/10 text-white border border-white/15 backdrop-blur-md";

        if (isFilled && clubMeta) {
          badgeClass = "border border-white/20";
        }

        return (
          <div key={slot.id} className="flex items-stretch gap-2 sm:gap-3">
            <div
              className={`w-14 sm:w-20 shrink-0 rounded-lg font-extrabold text-center text-xs sm:text-sm py-2.5 px-1 shadow-[0_8px_22px_rgba(0,0,0,0.2)] ${badgeClass}`}
              style={
                isFilled && clubMeta
                  ? { backgroundColor: clubMeta.primary, color: clubMeta.text }
                  : undefined
              }
            >
              {slot.label}
            </div>

            <button
              className={`flex-1 border border-white/60 rounded-xl px-3 sm:px-4 text-left transition flex min-h-[56px] items-center justify-between gap-2 ${
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
                      borderColor: "rgba(255,255,255,0.30)",
                    }
                  : { backgroundColor: "rgba(0,0,0,0.30)" }
              }
              onClick={() => onOpen(slot)}
              disabled={!clickable}
              title={isFilled ? "Locked (cannot be replaced)" : undefined}
            >
              <span
                className={`block min-w-0 truncate text-sm sm:text-base ${
                  p ? "font-extrabold" : "font-extrabold text-white/80"
                }`}
              >
                {p ? p.name : `+ Select ${slot.label}`}
              </span>

              {p?.points != null && (
                <span className="ml-2 shrink-0 whitespace-nowrap font-extrabold px-2.5 py-1 rounded-lg bg-black/45 text-[11px] sm:text-sm text-white backdrop-blur-md border border-white/15">
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

function UnlimitedDraftPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  const [season, setSeason] = useState<"2025" | "2026">("2025");
  const [seasonReady, setSeasonReady] = useState(false);
  const [mode, setMode] = useState<GameMode>("fantasy");
  const [showHighScores, setShowHighScores] = useState(false);
  const [allHighScores, setAllHighScores] = useState<HighScoreEntry[]>([]);

  useEffect(() => {
    const urlSeason = searchParams.get("season");
    const resolvedSeason: "2025" | "2026" =
      urlSeason === "2026" ? "2026" : "2025";

    setSeason(resolvedSeason);

    try {
      localStorage.setItem("selectedSeason", resolvedSeason);
    } catch {}

    const urlMode = searchParams.get("mode");
    let resolvedMode: GameMode = "fantasy";

    if (isModeAllowedForSeason(resolvedSeason, urlMode)) {
      resolvedMode = urlMode;
    } else {
      try {
        const savedMode = localStorage.getItem(
          resolvedSeason === "2026"
            ? "selectedUnlimitedMode_2026"
            : "selectedUnlimitedMode_2025"
        );
        if (isModeAllowedForSeason(resolvedSeason, savedMode)) {
          resolvedMode = savedMode;
        }
      } catch {}
    }

    setMode(resolvedMode);

    try {
      localStorage.setItem(
        resolvedSeason === "2026"
          ? "selectedUnlimitedMode_2026"
          : "selectedUnlimitedMode_2025",
        resolvedMode
      );
    } catch {}

    setSeasonReady(true);
  }, [searchParams]);

  const pushRoute = (nextSeason: "2025" | "2026", nextMode: GameMode) => {
    const params = new URLSearchParams();
    params.set("season", nextSeason);
    params.set("mode", nextMode);
    router.replace(`/unlimited?${params.toString()}`);
  };

  const changeSeason = (nextSeason: "2025" | "2026") => {
    const nextMode = isModeAllowedForSeason(nextSeason, mode) ? mode : "fantasy";

    setSeason(nextSeason);
    setMode(nextMode);

    try {
      localStorage.setItem("selectedSeason", nextSeason);
      localStorage.setItem(
        nextSeason === "2026"
          ? "selectedUnlimitedMode_2026"
          : "selectedUnlimitedMode_2025",
        nextMode
      );
    } catch {}

    pushRoute(nextSeason, nextMode);
  };

  const changeMode = (nextMode: GameMode) => {
    if (!isModeAllowedForSeason(season, nextMode)) return;

    setMode(nextMode);

    try {
      localStorage.setItem(
        season === "2026"
          ? "selectedUnlimitedMode_2026"
          : "selectedUnlimitedMode_2025",
        nextMode
      );
    } catch {}

    pushRoute(season, nextMode);
  };

  const goHome = () => {
    router.push(`/?season=${season}&mode=${mode}`);
  };

  const ALL_PLAYERS: Player[] = useMemo(() => {
    if (season === "2026") {
      return normalize2026Players(players2026 as RawPlayer2026[], mode);
    }

    if (mode === "goals") return (goals2025 as Player[]).filter((p) => p.points > 0);
    if (mode === "disposals") {
      return (disposals2025 as Player[]).filter((p) => p.points > 0);
    }
    if (mode === "bounces") return (bounces2025 as Player[]).filter((p) => p.points > 0);

    return (players2025 as Player[]).filter((p) => p.points > 0);
  }, [season, mode]);

  const slots = useMemo(() => {
    if (mode === "bounces") {
      return SLOTS.filter((slot) => slot.id !== "ruck");
    }
    return SLOTS;
  }, [mode]);

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
    makeEmptyTeam(SLOTS)
  );

  useEffect(() => {
    if (!seasonReady) return;

    const firstClub = SPIN_CLUBS[0] ?? AFL_CLUBS[0];
    setClub(firstClub);
    setDisplayClub(firstClub);
    setTeam(makeEmptyTeam(slots));
    setActive(null);
    setSearch("");
    setSpinning(false);
  }, [season, mode, SPIN_CLUBS, seasonReady, slots]);

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
      ALL_PLAYERS.filter((p) => p.club === club.name)
        .filter((p) => p.points > 0)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [ALL_PLAYERS, club.name]
  );

  const eligiblePlayers = useMemo(() => {
    if (!active) return [];
    const q = search.trim().toLowerCase();

    return clubPlayers
      .filter((p) => !pickedIds.has(p.id))
      .filter((p) => p.pos.some((pos) => active.allowed.includes(pos)))
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [active, clubPlayers, pickedIds, search]);

  const emptySlots = useMemo(
    () => slots.filter((slot) => !team[slot.id]),
    [team, slots]
  );

  function hasEligiblePlayersForSlot(slot: Slot, clubName: string) {
    return ALL_PLAYERS.some(
      (p) =>
        p.club === clubName &&
        p.points > 0 &&
        !pickedIds.has(p.id) &&
        p.pos.some((pos) => slot.allowed.includes(pos))
    );
  }

  const clubHasAnyValidPick = useMemo(() => {
    return emptySlots.some((slot) => hasEligiblePlayersForSlot(slot, club.name));
  }, [emptySlots, club.name, pickedIds, ALL_PLAYERS]);

  const currentScore = useMemo(() => sumPoints(team, getPlayerById), [team, ALL_PLAYERS]);

  const allFilled = useMemo(() => slots.every((s) => Boolean(team[s.id])), [team, slots]);
  const gameOver = allFilled;

  /** ===== High score (localStorage) ===== */
  const [highScore, setHighScore] = useState<number>(0);

  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  async function saveGlobalScore(score: number) {
    if (!user || !supabase) return;

    const username =
      user.username ||
      user.firstName ||
      user.primaryEmailAddress?.emailAddress ||
      "Anonymous";

    const { error } = await supabase
      .from("global_scores")
      .upsert(
        {
          user_id: user.id,
          username,
          mode: `unlimited_${mode}`,
          season: Number(season),
          score,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,mode,season",
        }
      );

    if (error) {
      console.error("Supabase save error:", error);
    }
  }

  useEffect(() => {
    try {
      const key = getHighScoreKey(season, mode);
      const saved = Number(localStorage.getItem(key) ?? 0);
      setHighScore(Number.isFinite(saved) ? saved : 0);
    } catch {
      setHighScore(0);
    }
  }, [season, mode]);

  useEffect(() => {
    if (currentScore <= highScore) return;

    setHighScore(currentScore);

    try {
      localStorage.setItem(getHighScoreKey(season, mode), String(currentScore));
      localStorage.setItem(
        getMyStatsUnlimitedKey(season, mode),
        String(currentScore)
      );
    } catch {}

    void saveGlobalScore(currentScore);
  }, [currentScore, highScore, season, mode, user, supabase]);

  const refreshAllHighScores = () => {
    setAllHighScores(getAllHighScoreEntries());
  };

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
  }, [season, mode, seasonReady]);

  useEffect(() => {
    if (!gameOver) return;
    cleanupSpinTimers();
    setSpinning(false);
    setActive(null);
    setSearch("");
  }, [gameOver]);

  useEffect(() => {
    if (!active) return;
    if (spinning) return;
    if (gameOver) return;

    const noEligibleForOpenedSlot = eligiblePlayers.length === 0;
    const noOtherValidSlotsForClub = !clubHasAnyValidPick;

    if (noEligibleForOpenedSlot && noOtherValidSlotsForClub) {
      setActive(null);
      setSearch("");

      delayedSpinTimeout.current = window.setTimeout(() => {
        spinToRandomClub();
      }, 250);
    }
  }, [active, spinning, gameOver, eligiblePlayers, clubHasAnyValidPick]);

  useEffect(() => {
    return () => cleanupSpinTimers();
  }, []);

  function slotIsFilled(slotId: string) {
    return Boolean(team[slotId]);
  }

  function onOpen(slot: Slot) {
    if (gameOver) return;
    if (spinning) return;
    if (slotIsFilled(slot.id)) return;

    setSearch("");

    const slotHasPlayers = hasEligiblePlayersForSlot(slot, club.name);
    const clubCanFillAnySlot = emptySlots.some((s) =>
      hasEligiblePlayersForSlot(s, club.name)
    );

    if (!slotHasPlayers && !clubCanFillAnySlot) {
      spinToRandomClub();
      return;
    }

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
    setTeam(makeEmptyTeam(slots));

    const firstClub = SPIN_CLUBS[0] ?? AFL_CLUBS[0];
    setClub(firstClub);
    setDisplayClub(firstClub);

    window.setTimeout(() => spinToRandomClub(), 50);
  }

  const unit = modeLabel(mode);
  const availableModes = getAvailableModes(season);

  return (
    <main className="min-h-screen text-white relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/vbg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "scroll",
        }}
      />

      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%),linear-gradient(to_bottom,rgba(4,10,24,0.25),rgba(0,0,0,0.35))]" />

      <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[0.06em] sm:tracking-[0.08em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)]">
              UNLIMITED MODE
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => changeSeason("2025")}
                className={`min-h-[44px] rounded-2xl border px-4 py-2 font-bold transition ${
                  season === "2025"
                    ? "bg-blue-600 border-blue-400 text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)]"
                    : "border-white/20 bg-black/20 text-white/80 hover:text-white hover:border-white/40"
                }`}
              >
                2025
              </button>

              <button
                onClick={() => changeSeason("2026")}
                className={`min-h-[44px] rounded-2xl border px-4 py-2 font-bold transition ${
                  season === "2026"
                    ? "bg-red-500 border-red-400 text-white shadow-[0_10px_30px_rgba(239,68,68,0.35)]"
                    : "border-white/20 bg-black/20 text-white/80 hover:text-white hover:border-white/40"
                }`}
              >
                2026
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
              {availableModes.includes("fantasy") && (
                <button
                  onClick={() => changeMode("fantasy")}
                  className={`min-h-[44px] w-full sm:w-auto rounded-2xl border px-4 py-2 font-bold transition ${
                    mode === "fantasy"
                      ? "bg-white text-black border-white shadow-[0_10px_28px_rgba(255,255,255,0.18)]"
                      : "border-white/20 bg-black/20 text-white/80 hover:text-white hover:border-white/40"
                  }`}
                >
                  Fantasy Points
                </button>
              )}

              {availableModes.includes("sc") && (
                <button
                  onClick={() => changeMode("sc")}
                  className={`min-h-[44px] w-full sm:w-auto rounded-2xl border px-4 py-2 font-bold transition ${
                    mode === "sc"
                      ? "bg-white text-black border-white shadow-[0_10px_28px_rgba(255,255,255,0.18)]"
                      : "border-white/20 bg-black/20 text-white/80 hover:text-white hover:border-white/40"
                  }`}
                >
                  SC Points
                </button>
              )}

              {availableModes.includes("goals") && (
                <button
                  onClick={() => changeMode("goals")}
                  className={`min-h-[44px] w-full sm:w-auto rounded-2xl border px-4 py-2 font-bold transition ${
                    mode === "goals"
                      ? "bg-white text-black border-white shadow-[0_10px_28px_rgba(255,255,255,0.18)]"
                      : "border-white/20 bg-black/20 text-white/80 hover:text-white hover:border-white/40"
                  }`}
                >
                  Goals
                </button>
              )}

              {availableModes.includes("disposals") && (
                <button
                  onClick={() => changeMode("disposals")}
                  className={`min-h-[44px] w-full sm:w-auto rounded-2xl border px-4 py-2 font-bold transition ${
                    mode === "disposals"
                      ? "bg-white text-black border-white shadow-[0_10px_28px_rgba(255,255,255,0.18)]"
                      : "border-white/20 bg-black/20 text-white/80 hover:text-white hover:border-white/40"
                  }`}
                >
                  Disposals
                </button>
              )}

              {availableModes.includes("bounces") && (
                <button
                  onClick={() => changeMode("bounces")}
                  className={`min-h-[44px] w-full sm:w-auto rounded-2xl border px-4 py-2 font-bold transition ${
                    mode === "bounces"
                      ? "bg-white text-black border-white shadow-[0_10px_28px_rgba(255,255,255,0.18)]"
                      : "border-white/20 bg-black/20 text-white/80 hover:text-white hover:border-white/40"
                  }`}
                >
                  Bounces
                </button>
              )}
            </div>
          </div>

          <button
            className="w-full sm:w-auto rounded-2xl border border-white/15 bg-black/25 px-4 py-3 sm:py-2 text-white/80 backdrop-blur-md hover:text-white hover:border-white/35"
            onClick={goHome}
          >
            ← Home
          </button>
        </div>

        <div className="mt-8 sm:mt-10 flex justify-center">
          <div className="w-full max-w-2xl overflow-hidden rounded-[24px] sm:rounded-[30px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03))] shadow-[0_20px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative px-4 py-5 sm:px-7 sm:py-7 md:py-8">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none" />
                <div className="relative">
                  <div className="text-[11px] font-extrabold tracking-[0.28em] text-white/45">
                    CURRENT SCORE
                  </div>

                  <div className="mt-4 flex items-end gap-2 flex-wrap">
                    <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-none text-white">
                      {formatStatValue(currentScore, unit)}
                    </span>
                    <span className="pb-2 text-sm font-bold tracking-[0.24em] text-white/55">
                      {unit}
                    </span>
                  </div>

                  <div className="mt-3 text-sm text-white/60">
                    {modeTitle(mode)}
                  </div>
                </div>
              </div>

              <div className="relative border-t md:border-t-0 md:border-l border-white/10 px-4 py-5 sm:px-7 sm:py-7 md:py-8">
                <div className="absolute inset-0 bg-gradient-to-bl from-white/[0.04] via-transparent to-transparent pointer-events-none" />
                <div className="relative">
                  <div className="text-[11px] font-extrabold tracking-[0.28em] text-white/45">
                    HIGH SCORE
                  </div>

                  <div className="mt-4 flex items-end gap-2 flex-wrap">
                    <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-none text-white">
                      {formatStatValue(highScore, unit)}
                    </span>
                    <span className="pb-2 text-sm font-bold tracking-[0.24em] text-white/55">
                      {unit}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={resetGame}
                      className="rounded-xl border border-white/15 bg-white/8 px-4 py-2 text-sm font-extrabold text-white/90 hover:bg-white/12"
                    >
                      Restart
                    </button>

                    <button
                      onClick={() => {
                        setShowHighScores((prev) => {
                          const next = !prev;
                          if (!prev) refreshAllHighScores();
                          return next;
                        });
                      }}
                      className="rounded-xl border border-white/15 bg-white/8 px-4 py-2 text-sm font-extrabold text-white/90 hover:bg-white/12"
                    >
                      {showHighScores ? "Hide High Scores" : "High Scores"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showHighScores && (
          <div className="mt-6 rounded-[24px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl p-4 sm:p-5">
            <div className="text-sm sm:text-base font-extrabold tracking-[0.16em] text-white/70 mb-4">
              ALL HIGH SCORES
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allHighScores.map((entry) => (
                <div
                  key={entry.key}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <div className="text-xs font-bold tracking-[0.16em] text-white/55">
                    {entry.label.toUpperCase()}
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-white">
                    {formatStatValue(entry.value, entry.unit)}
                    <span className="ml-2 text-sm text-white/55">{entry.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[24px] sm:rounded-[30px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03))] shadow-[0_20px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-extrabold tracking-[0.28em] text-white/45">
                  YOUR TEAM
                </div>
                <div className="mt-2 text-xl sm:text-2xl font-extrabold text-white">
                  Fill every slot
                </div>
              </div>

              {gameOver && (
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-extrabold text-emerald-200">
                  COMPLETE
                </div>
              )}
            </div>

            <div className="mt-5">
              <TeamSlots
                slots={slots}
                team={team}
                getPlayerById={getPlayerById}
                clubs={AFL_CLUBS}
                statLabel={unit}
                enabled={!spinning && !gameOver}
                onOpen={onOpen}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[24px] sm:rounded-[30px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03))] shadow-[0_20px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl p-4 sm:p-5">
              <div className="text-[11px] font-extrabold tracking-[0.28em] text-white/45">
                CLUB
              </div>

              <div className="mt-5 flex justify-center">
                <div
                  className="w-full max-w-[260px] rounded-[28px] border border-white/12 p-5 text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
                  style={{
                    background:
                      displayClub?.primary
                        ? `linear-gradient(180deg, ${displayClub.primary}, rgba(0,0,0,0.75))`
                        : "rgba(255,255,255,0.06)",
                    color: displayClub?.text ?? "#fff",
                  }}
                >
                  <div className="text-[11px] font-extrabold tracking-[0.28em] opacity-75">
                    NOW DRAFTING FROM
                  </div>
                  <div className="mt-3 text-2xl sm:text-3xl font-extrabold leading-tight">
                    {displayClub?.name ?? "Club"}
                  </div>

                  <button
                    onClick={spinToRandomClub}
                    disabled={spinning || gameOver}
                    className={`mt-5 w-full rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                      spinning || gameOver
                        ? "bg-black/30 text-white/50 border border-white/15 cursor-not-allowed"
                        : "bg-black/25 text-white border border-white/20 hover:bg-black/35"
                    }`}
                  >
                    {spinning ? "Spinning..." : "Spin"}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] sm:rounded-[30px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03))] shadow-[0_20px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl p-4 sm:p-5">
              <div className="text-[11px] font-extrabold tracking-[0.28em] text-white/45">
                {active ? `${active.slotLabel} OPTIONS` : "PLAYER OPTIONS"}
              </div>

              {active ? (
                <>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search players..."
                    className="mt-4 w-full rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-white placeholder:text-white/40 outline-none"
                  />

                  <div className="mt-4 max-h-[420px] overflow-y-auto space-y-2 pr-1">
                    {eligiblePlayers.length > 0 ? (
                      eligiblePlayers.map((player) => (
                        <button
                          key={player.id}
                          onClick={() => onPick(player.id)}
                          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left hover:bg-black/30 transition"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm sm:text-base font-extrabold text-white">
                                {player.name}
                              </div>
                              <div className="mt-1 text-xs sm:text-sm text-white/55">
                                {player.club} · {player.pos.join("/")}
                              </div>
                            </div>

                            <div className="shrink-0 rounded-lg bg-black/45 border border-white/15 px-2.5 py-1 text-[11px] sm:text-sm font-extrabold text-white">
                              {formatStatValue(player.points, unit)} {unit}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-6 text-sm text-white/55 text-center">
                        No eligible players for this slot from {club.name}.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-8 text-center text-white/55 text-sm">
                  Select a slot on the left to see player options.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function UnlimitedDraftPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white p-4 sm:p-6">Loading...</div>}>
      <UnlimitedDraftPageInner />
    </Suspense>
  );
}