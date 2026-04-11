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

function getSlotsForMode(mode: GameMode): Slot[] {
  if (mode === "bounces") {
    return SLOTS.filter((slot) => slot.id !== "ruck");
  }
  return SLOTS;
}

function createEmptyTeamForMode(mode: GameMode): Record<string, string | null> {
  return Object.fromEntries(
    getSlotsForMode(mode).map((slot) => [slot.id, null])
  ) as Record<string, string | null>;
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

function normalize2026Players(data: unknown, mode: GameMode): Player[] {
  const list = Array.isArray(data)
    ? data
    : Array.isArray((data as { players?: unknown[] })?.players)
    ? (data as { players: unknown[] }).players
    : [];

  return (list as RawPlayer2026[])
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

    if (typeof window !== "undefined") {
      try {
        value = Number(localStorage.getItem(entry.key) ?? 0);
        if (!Number.isFinite(value)) value = 0;
      } catch {
        value = 0;
      }
    }

    return {
      ...entry,
      value,
    };
  });
}

function UnlimitedDraftPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
    const players = normalize2026Players(players2026, mode);

    // 🔥 CRITICAL FIX: fallback if empty
    if (players.length === 0) {
      console.warn("⚠️ 2026 players empty, using fallback");
      return normalize2026Players(players2026, "fantasy");
    }

    return players;
  }

  if (mode === "goals") return (goals2025 as Player[]).filter((p) => p.points > 0);
  if (mode === "disposals") return (disposals2025 as Player[]).filter((p) => p.points > 0);
  if (mode === "bounces") return (bounces2025 as Player[]).filter((p) => p.points > 0);

  return (players2025 as Player[]).filter((p) => p.points > 0);
}, [season, mode]);

  const slots = useMemo(() => getSlotsForMode(mode), [mode]);

  const SPIN_CLUBS = useMemo(() => {
  const clubs = clampClubsToPlayers(AFL_CLUBS, ALL_PLAYERS);
  return clubs.length > 0 ? clubs : AFL_CLUBS;
}, [ALL_PLAYERS]);

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
    () => createEmptyTeamForMode(mode)
  );

  useEffect(() => {
    if (!seasonReady) return;

    const firstClub = SPIN_CLUBS[0] ?? AFL_CLUBS[0];
    setClub(firstClub);
    setDisplayClub(firstClub);
        setTeam(createEmptyTeamForMode(mode));
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
  if (typeof window === "undefined") return null;

  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return null;
    }

    return createClient();
  } catch (error) {
    console.error("Supabase client init error:", error);
    return null;
  }
}, []);

const { user } = useUser();

async function saveGlobalScore(score: number) {
  if (!user || !supabase) {
    console.log("❌ No user or supabase");
    return;
  }

  const username =
    user.username ||
    user.firstName ||
    user.primaryEmailAddress?.emailAddress ||
    "Anonymous";

  console.log("🚀 Attempting save:", {
    user_id: user.id,
    username,
    mode: `unlimited_${mode}`,
    season: Number(season),
    score,
  });

  const fullTeam = Object.fromEntries(
  Object.entries(team).map(([slotId, playerId]) => {
    const player = getPlayerById(playerId);

    return [
      slotId,
      player
        ? {
            id: player.id,
            name: player.name,
            club: player.club,
            points: player.points,
            pos: player.pos,
          }
        : null,
    ];
  })
);

  const { data: existingRow, error: fetchError } = await supabase
    .from("global_scores")
    .select("id, score")
    .eq("user_id", user.id)
    .eq("mode", `unlimited_${mode}`)
    .eq("season", Number(season))
    .maybeSingle();

  if (fetchError) {
    console.error("❌ Supabase fetch error:", fetchError);
    return;
  }

  if (!existingRow) {
    const { error: insertError } = await supabase.from("global_scores").insert({
      user_id: user.id,
      username,
      mode: `unlimited_${mode}`,
      season: Number(season),
      score,
      team_json: fullTeam,
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("❌ Supabase insert error:", insertError);
    } else {
      console.log("✅ Inserted new high score");
    }

    return;
  }

  if (Number(score) > Number(existingRow.score ?? 0)) {
    const { error: updateError } = await supabase
      .from("global_scores")
      .update({
        username,
        score,
        team_json: fullTeam,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingRow.id);

    if (updateError) {
      console.error("❌ Supabase update error:", updateError);
    } else {
      console.log("✅ Updated to new high score");
    }
  } else {
    console.log("⏭️ Score was not higher, keeping existing high score");
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
}, [currentScore, highScore, season, mode, user]);

useEffect(() => {
  if (!gameOver) return;
  if (!user || !supabase) return;

  console.log("🔥 Saving finished score:", currentScore);
  void saveGlobalScore(currentScore);
}, [gameOver, user, supabase, currentScore, mode, season]);

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

  // 🔥 HARD SAFETY
  if (spinning || SPIN_CLUBS.length <= 1) {
    const fallback = SPIN_CLUBS[0] ?? AFL_CLUBS[0];
    setClub(fallback);
    setDisplayClub(fallback);
    setSpinning(false);
    return;
  }

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

    let final = SPIN_CLUBS[0];

    // 🔥 SAFE RANDOM (no infinite loop risk)
    const available = SPIN_CLUBS.filter((c) => c.name !== club.name);
    if (available.length > 0) {
      final = available[Math.floor(Math.random() * available.length)];
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
        setTeam(createEmptyTeamForMode(mode));

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
                    <span className="pb-2 text-sm font-bold tracking-[0.16em] text-white/40">
                      {unit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative border-t border-white/10 md:border-t-0 md:border-l md:border-white/10 px-4 py-5 sm:px-7 sm:py-7 md:py-8">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent pointer-events-none" />
                <div className="relative">
                  <div className="text-[11px] font-extrabold tracking-[0.28em] text-white/45">
                    HIGH SCORE
                  </div>

                  <div className="mt-4 flex items-end gap-2 flex-wrap">
                    <span className="bg-gradient-to-b from-[#fff7c2] via-[#f2cf63] to-[#c78a18] bg-clip-text text-4xl sm:text-5xl md:text-6xl font-extrabold leading-none text-transparent drop-shadow-[0_2px_14px_rgba(242,207,99,0.18)]">
                      {formatStatValue(highScore, unit)}
                    </span>
                    <span className="pb-2 text-sm font-bold tracking-[0.16em] text-[#d7bb67]">
                      {unit}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      refreshAllHighScores();
                      setShowHighScores(true);
                    }}
                    className="mt-4 w-full sm:w-auto rounded-xl border border-white/15 bg-white/8 px-3 py-3 sm:py-2 text-sm font-bold text-white/85 transition hover:bg-white/12 hover:text-white hover:border-white/30"
                  >
                    Show All High Scores
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {gameOver && (
          <div className="mt-6 text-center px-2">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-[0.12em] sm:tracking-[0.14em] text-white">
              RUN COMPLETE
            </div>
            <div className="mt-2 text-white/70 font-bold">
              Final Score: {formatStatValue(currentScore, unit)} {unit}
            </div>

            <button
              className="mt-5 w-full sm:w-auto rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-white/90 backdrop-blur-md hover:bg-white/14 hover:border-white/30"
              onClick={resetGame}
            >
              Play Again
            </button>
          </div>
        )}

        <div className="mt-8">
                    <SingleTeamColumn
            clubs={AFL_CLUBS}
            slots={slots}
            selection={team}
            getPlayer={getPlayerById}
            onOpen={onOpen}
            enabled={!gameOver && !spinning}
            badgeClass={season === "2026" ? "bg-red-500 text-white" : "bg-blue-600 text-white"}
            statLabel={unit}
          />
        </div>

        <div className="mt-10 sm:mt-12 text-center">
          <div className="text-xs sm:text-sm text-white/55 font-semibold tracking-[0.22em] sm:tracking-[0.28em]">DRAFTING FROM</div>

          <div className="mt-4 sm:mt-5 flex items-center justify-center">
            <div
              className={`inline-flex w-full max-w-[320px] sm:w-auto items-center justify-center rounded-[22px] px-5 sm:px-10 py-4 font-extrabold text-base sm:text-xl select-none border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.38)] ${
                spinning ? "opacity-90 scale-[1.01]" : ""
              }`}
              style={{ backgroundColor: displayClub.primary, color: displayClub.text }}
              title="Auto-spins after every pick"
            >
              {displayClub.name.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setActive(null)} />

          <div className="relative w-full max-w-xl max-h-[85vh] overflow-hidden rounded-[24px] sm:rounded-3xl border border-white/15 bg-zinc-950/95 backdrop-blur-xl p-3 sm:p-4 shadow-[0_25px_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div className="font-extrabold tracking-wide text-base sm:text-lg">Select {active.slotLabel}</div>

              <button
                className="min-h-[44px] rounded-2xl border border-white/20 px-3 py-2 text-white/80 hover:text-white hover:border-white/40"
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
                className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3.5 text-base text-white outline-none focus:border-white/40"
                autoFocus
              />
            </div>

            <div className="mt-3 max-h-[58vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/20">
              {eligiblePlayers.length === 0 ? (
                <div className="p-4 text-white/60">No eligible players found.</div>
              ) : (
                eligiblePlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onPick(p.id)}
                    className="w-full px-4 py-3 text-left hover:bg-white/5 border-b border-white/5 last:border-b-0 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                  >
                    <div className="min-w-0 flex w-full flex-col gap-1 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                      <div className="font-extrabold truncate">{p.name}</div>
                      <div className="text-white/55 text-xs">{p.club}</div>
                    </div>

                    <div className="shrink-0 flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
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
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div
            className="absolute inset-0 bg-black/75"
            onClick={() => setShowHighScores(false)}
          />

          <div className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-[24px] sm:rounded-3xl border border-white/15 bg-zinc-950/95 p-4 sm:p-5 backdrop-blur-xl shadow-[0_25px_80px_rgba(0,0,0,0.65)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xl sm:text-2xl font-extrabold tracking-[0.06em] sm:tracking-[0.08em] text-white">
                  ALL HIGH SCORES
                </div>
                <div className="mt-1 text-sm text-white/55">
                  Your best score for every season and mode
                </div>
              </div>

              <button
                className="min-h-[44px] rounded-2xl border border-white/20 px-3 py-2 text-white/80 hover:text-white hover:border-white/40"
                onClick={() => setShowHighScores(false)}
              >
                ✕
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allHighScores.map((entry) => {
                const seasonCardClass =
                  entry.season === "2025"
                    ? "border-blue-400/20 bg-[linear-gradient(135deg,rgba(37,99,235,0.22),rgba(15,23,42,0.92))]"
                    : "border-red-400/20 bg-[linear-gradient(135deg,rgba(239,68,68,0.22),rgba(15,23,42,0.92))]";

                return (
                  <div
                    key={entry.key}
                    className={`rounded-2xl border px-4 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.22)] ${seasonCardClass}`}
                  >
                    <div className="text-sm font-bold uppercase tracking-[0.16em] text-white/60">
                      {entry.season}
                    </div>

                    <div className="mt-1 text-lg font-extrabold text-white">
                      {modeTitle(entry.mode)}
                    </div>

                    <div className="mt-3 flex items-end gap-2">
                      <span className="bg-gradient-to-b from-[#fff7c2] via-[#f2cf63] to-[#c78a18] bg-clip-text text-3xl font-extrabold text-transparent drop-shadow-[0_2px_14px_rgba(242,207,99,0.18)]">
                        {formatStatValue(entry.value, entry.unit)}
                      </span>
                      <span className="pb-1 text-xs font-bold tracking-[0.16em] text-[#d7bb67]">
                        {entry.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex justify-stretch sm:justify-end">
              <button
                onClick={() => {
                  refreshAllHighScores();
                }}
                className="w-full sm:w-auto rounded-2xl border border-white/15 bg-white/8 px-4 py-3 sm:py-2 font-bold text-white/85 transition hover:bg-white/12 hover:text-white hover:border-white/30"
              >
                Refresh
              </button>
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
          <div key={slot.id} className="flex items-stretch gap-2 sm:gap-3">
            <div
              className={`w-14 sm:w-20 shrink-0 rounded-lg font-extrabold text-center text-xs sm:text-sm py-2.5 px-1 shadow-[0_8px_22px_rgba(0,0,0,0.2)] ${badgeClass}`}
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

export default function UnlimitedDraftPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white p-4 sm:p-6">Loading...</div>}>
      <UnlimitedDraftPageInner />
    </Suspense>
  );
}